import asyncio
import json
import io
import logging
import os
import uuid
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, Any

import torch
import shutil
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from PIL import Image
from pymongo import MongoClient, ReturnDocument
from pymongo.errors import PyMongoError
from pymongo.collection import Collection
from pymongo.database import Database
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
UPLOADS_DIR = Path(__file__).parent / "uploads"
ORG_DIR = UPLOADS_DIR / "org"
PROCESSED_DIR = UPLOADS_DIR / "processed"

ORG_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("WORKER_MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024)))
MAX_CONCURRENCY = max(1, int(os.getenv("WORKER_MAX_CONCURRENCY", "2")))
MAX_JOBS_PER_CLIENT = max(1, int(os.getenv("WORKER_MAX_JOBS_PER_CLIENT", "2")))
JOB_RETENTION_HOURS = max(1, int(os.getenv("WORKER_JOB_RETENTION_HOURS", "24")))
QUEUE_POLL_SECONDS = float(os.getenv("WORKER_QUEUE_POLL_SECONDS", "1.0"))
CLEANUP_INTERVAL_SECONDS = int(os.getenv("WORKER_CLEANUP_INTERVAL_SECONDS", "1800"))
JOB_TIMEOUT_SECONDS = int(os.getenv("JOB_TIMEOUT_SECONDS", "300"))

MONGO_URI = os.getenv("NEXT_MONGODB_URI")
MONGO_DB_NAME = os.getenv("NEXT_MONGODB_DB", "bgremover")
WORKER_INTERNAL_TOKEN = os.getenv("WORKER_INTERNAL_TOKEN")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "WORKER_CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001",
    ).split(",")
    if origin.strip()
]

# --- Logging Configuration ---
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    if os.getenv("LOG_FORMAT", "TEXT").upper() == "JSON":
        handler.setFormatter(JsonFormatter())
    else:
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))
    root_logger.addHandler(handler)
    
    # Silence verbose loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    return logging.getLogger("bgremover.worker")

logger = setup_logging()

# --- State ---
mongo_client: Optional[MongoClient] = None
db: Optional[Database] = None
jobs_collection: Optional[Collection] = None
model = None
device = None
dispatcher_task: Optional[asyncio.Task] = None
cleanup_task: Optional[asyncio.Task] = None
dispatcher_wakeup: Optional[asyncio.Event] = None
active_tasks: set[asyncio.Task] = set()
active_tasks_lock = asyncio.Lock()
job_subscribers: dict[str, set[asyncio.Queue[dict]]] = {}
job_subscribers_lock = asyncio.Lock()

# --- Helpers ---
def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def ensure_database() -> Collection:
    global mongo_client, db, jobs_collection
    if jobs_collection is not None: return jobs_collection
    if not MONGO_URI: raise RuntimeError("NEXT_MONGODB_URI not configured")

    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client.get_database(MONGO_DB_NAME)
    jobs_collection = db["jobs"]

    def safe_create_index(keys, **kwargs):
        try:
            jobs_collection.create_index(keys, **kwargs)
        except PyMongoError:
            logger.warning("Index conflict on jobs collection; continuing", extra={"keys": keys})

    safe_create_index([("jobId", 1)], unique=True)
    safe_create_index([("status", 1), ("createdAt", 1)])
    safe_create_index([("clientKey", 1), ("status", 1), ("createdAt", 1)])
    safe_create_index([("expiresAt", 1)], expireAfterSeconds=0)
    return jobs_collection

def load_model():
    global model, device
    local_model_path = os.path.join(os.path.dirname(__file__), "ZhengPeng7_BiRefNet_lite")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info("Loading model on device: %s", device)
    model = AutoModelForImageSegmentation.from_pretrained(local_model_path, trust_remote_code=True)
    model.to(device)
    model.eval()
    return model, device

async def broadcast_job_state(job: dict) -> None:
    payload = build_status_payload(job)
    async with job_subscribers_lock:
        queues = list(job_subscribers.get(job["jobId"], set()))
    for queue in queues:
        try:
            queue.put_nowait(payload)
        except asyncio.QueueFull:
            pass

def process_image_bytes(image_bytes: bytes) -> bytes:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    transform = transforms.Compose([
        transforms.Resize((1024, 1024)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    input_tensor = transform(image).unsqueeze(0).to(device)
    input_tensor = input_tensor.to(next(model.parameters()).dtype)
    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid().cpu()
        pred = preds[0].squeeze()
    mask = transforms.ToPILImage()(pred)
    mask = mask.resize(image.size)
    image.putalpha(mask)
    output_buffer = io.BytesIO()
    image.save(output_buffer, format="PNG")
    return output_buffer.getvalue()

async def update_job(job_id: str, updates: dict) -> None:
    collection = ensure_database()
    try:
        await asyncio.to_thread(
            collection.update_one,
            {"jobId": job_id},
            {"$set": {**updates, "updatedAt": utcnow()}},
        )
        job = await asyncio.to_thread(collection.find_one, {"jobId": job_id}, {"_id": 0})
        if job: await broadcast_job_state(job)
    except Exception:
        logger.exception("Failed to update job %s", job_id)

async def process_job(job_id: str) -> None:
    collection = ensure_database()
    now = utcnow()
    try:
        job = await asyncio.to_thread(collection.find_one, {"jobId": job_id})
        if not job: return
        input_path, output_path = Path(job["inputPath"]), Path(job["outputPath"])
        
        await update_job(job_id, {"status": "running", "progress": 10, "startedAt": now})
        if not input_path.exists():
            logger.warning("Input missing for %s. Deleting record.", job_id)
            await asyncio.to_thread(collection.delete_one, {"jobId": job_id})
            return

        image_bytes = input_path.read_bytes()
        processed_bytes = await asyncio.wait_for(
            asyncio.to_thread(process_image_bytes, image_bytes),
            timeout=JOB_TIMEOUT_SECONDS
        )
        output_path.write_bytes(processed_bytes)
        await update_job(job_id, {"status": "completed", "progress": 100, "completedAt": utcnow()})
        logger.info("Job %s completed successfully", job_id)
    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        await update_job(job_id, {"status": "failed", "progress": 100, "completedAt": utcnow(), "error": str(exc)})
    finally:
        async with active_tasks_lock:
            active_tasks.discard(asyncio.current_task())
        if dispatcher_wakeup: dispatcher_wakeup.set()

async def claim_next_job() -> Optional[dict]:
    collection = ensure_database()
    candidates = await asyncio.to_thread(lambda: list(collection.find({"status": "queued"}).sort("createdAt", 1).limit(50)))
    for job in candidates:
        client_key = job.get("clientKey", "anonymous")
        active_count = await asyncio.to_thread(collection.count_documents, {"clientKey": client_key, "status": {"$in": ["starting", "running"]}})
        if active_count >= MAX_JOBS_PER_CLIENT: continue

        claimed = await asyncio.to_thread(
            collection.find_one_and_update,
            {"jobId": job["jobId"], "status": "queued"},
            {"$set": {"status": "starting", "progress": 5, "updatedAt": utcnow(), "startedAt": utcnow()}},
            return_document=ReturnDocument.AFTER
        )
        if claimed: return claimed
    return None

async def reset_stuck_jobs() -> None:
    collection = ensure_database()
    try:
        result = await asyncio.to_thread(
            collection.update_many,
            {"status": {"$in": ["starting", "running"]}},
            {"$set": {"status": "queued", "updatedAt": utcnow()}}
        )
        if result.modified_count > 0:
            logger.info("Reset %d stuck jobs on startup", result.modified_count)
    except Exception:
        logger.exception("Failed to reset stuck jobs")

async def dispatcher_loop() -> None:
    logger.info("Dispatcher loop active")
    while True:
        try:
            while len(active_tasks) < MAX_CONCURRENCY:
                job = await claim_next_job()
                if not job: break
                logger.info("Starting processing for job %s", job["jobId"])
                task = asyncio.create_task(process_job(job["jobId"]))
                async with active_tasks_lock: active_tasks.add(task)
            
            await asyncio.wait_for(dispatcher_wakeup.wait(), timeout=QUEUE_POLL_SECONDS)
            dispatcher_wakeup.clear()
        except asyncio.TimeoutError: pass
        except Exception:
            logger.exception("Error in dispatcher loop")
            await asyncio.sleep(5)

async def cleanup_loop() -> None:
    collection = ensure_database()
    while True:
        try:
            cutoff = utcnow() - timedelta(hours=JOB_RETENTION_HOURS)
            stale_jobs = await asyncio.to_thread(lambda: list(collection.find(
                {"$or": [{"completedAt": {"$lt": cutoff}}, {"createdAt": {"$lt": cutoff - timedelta(days=1)}}]},
                {"jobId": 1, "inputPath": 1, "outputPath": 1}
            )))
            for job in stale_jobs:
                for p in [Path(job.get("inputPath", "")), Path(job.get("outputPath", ""))]:
                    if p.exists(): p.unlink()
                await asyncio.to_thread(collection.delete_one, {"jobId": job["jobId"]})
            await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
        except Exception:
            logger.exception("Error in cleanup loop")
            await asyncio.sleep(60)

def build_status_payload(job: dict) -> dict:
    return {"job_id": job["jobId"], "status": "running" if job.get("status") == "starting" else job.get("status", "queued"), "progress": job.get("progress", 0), "error": job.get("error")}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global dispatcher_task, cleanup_task, dispatcher_wakeup
    logger.info("Worker lifespan starting...")
    try:
        await asyncio.to_thread(load_model)
        ensure_database()
        await reset_stuck_jobs()
        dispatcher_wakeup = asyncio.Event()
        dispatcher_task = asyncio.create_task(dispatcher_loop())
        cleanup_task = asyncio.create_task(cleanup_loop())
        logger.info("Startup complete")
        yield
    finally:
        logger.info("Worker lifespan shutting down...")
        for t in [dispatcher_task, cleanup_task]:
            if t: t.cancel()
        await asyncio.gather(*[t for t in [dispatcher_task, cleanup_task] if t], return_exceptions=True)

# --- FastAPI App ---
app = FastAPI(lifespan=lifespan, title="QuickBG Worker", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS or ["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    try:
        ensure_database()
        return {
            "status": "healthy", "device": str(device), "model_loaded": model is not None,
            "dispatcher_alive": dispatcher_task is not None and not dispatcher_task.done(),
            "active_tasks": len(active_tasks)
        }
    except Exception as e:
        return JSONResponse({"status": "unhealthy", "error": str(e)}, status_code=503)

@app.post("/remove")
async def remove_background(request: Request, file: UploadFile = File(...)):
    if WORKER_INTERNAL_TOKEN and request.headers.get("x-internal-token") != WORKER_INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type")
    
    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")

    job_id = str(uuid.uuid4())
    input_path, output_path = ORG_DIR / f"{job_id}.png", PROCESSED_DIR / f"{job_id}.png"
    input_path.write_bytes(file_bytes)
    
    client_key = request.headers.get("x-client-ip") or (request.client.host if request.client else "anonymous")
    job_record = {
        "jobId": job_id, "status": "queued", "progress": 0, "createdAt": utcnow(), "updatedAt": utcnow(),
        "expiresAt": utcnow() + timedelta(hours=JOB_RETENTION_HOURS), "inputPath": str(input_path),
        "outputPath": str(output_path), "fileName": file.filename or f"{job_id}.png", "clientKey": client_key
    }
    await asyncio.to_thread(ensure_database().insert_one, job_record)
    if dispatcher_wakeup: dispatcher_wakeup.set()
    return JSONResponse({"job_id": job_id, "status": "queued"}, status_code=202)

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    job = await asyncio.to_thread(ensure_database().find_one, {"jobId": job_id}, {"_id": 0})
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    return JSONResponse(build_status_payload(job))

@app.get("/result/{job_id}")
async def get_result(job_id: str):
    job = await asyncio.to_thread(ensure_database().find_one, {"jobId": job_id}, {"_id": 0})
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "completed": raise HTTPException(status_code=409, detail="Not completed")
    if not Path(job["outputPath"]).exists(): raise HTTPException(status_code=404, detail="Result missing")
    return FileResponse(job["outputPath"], media_type="image/png")

@app.get("/jobs")
async def list_jobs(request: Request, limit: int = 50):
    client_key = request.headers.get("x-client-ip") or (request.client.host if request.client else "anonymous")
    query = {} if (WORKER_INTERNAL_TOKEN and request.headers.get("x-internal-token") == WORKER_INTERNAL_TOKEN) else {"clientKey": client_key}
    cursor = ensure_database().find(query, {"_id": 0}).sort("createdAt", -1).limit(limit)
    jobs = await asyncio.to_thread(list, cursor)
    for j in jobs:
        for k, v in j.items():
            if isinstance(v, datetime): j[k] = v.isoformat()
    return JSONResponse(jobs)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")), access_log=False)
