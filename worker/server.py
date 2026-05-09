import asyncio
import json
import io
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import torch
from huggingface_hub import snapshot_download
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
load_dotenv()

print(os.getenv("NEXT_MONGODB_URI"))

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

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("bgremover.worker")

MODEL_REPO_ID = os.getenv("WORKER_MODEL_REPO_ID", "ZhengPeng7/BiRefNet_lite")
MODEL_LOCAL_DIR = Path(
    os.getenv("WORKER_MODEL_LOCAL_DIR", str(Path(__file__).parent / "ZhengPeng7_BiRefNet_lite"))
)
MODEL_CACHE_DIR = os.getenv("WORKER_MODEL_CACHE_DIR")

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


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def ensure_database() -> Collection:
    global mongo_client, db, jobs_collection

    if jobs_collection is not None:
        return jobs_collection

    if not MONGO_URI:
        raise RuntimeError("NEXT_MONGODB_URI not configured")

    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client.get_database(MONGO_DB_NAME)
    jobs_collection = db["jobs"]

    def safe_create_index(keys, **kwargs):
        try:
            jobs_collection.create_index(keys, **kwargs)
        except PyMongoError as exc:
            details = getattr(exc, "details", {}) or {}
            code_name = getattr(exc, "code_name", None) or details.get("codeName")
            code = getattr(exc, "code", None) or details.get("code")
            if code == 85 or code_name == "IndexOptionsConflict":
                logger.warning("Index conflict on jobs collection; continuing", extra={"keys": keys, "options": kwargs})
                return
            raise

    safe_create_index([("jobId", 1)], unique=True)
    safe_create_index([("status", 1), ("createdAt", 1)])
    safe_create_index([("clientKey", 1), ("status", 1), ("createdAt", 1)])
    safe_create_index([("expiresAt", 1)], expireAfterSeconds=0)
    return jobs_collection


def load_model():
    global model, device

    def has_checkpoint_files(model_dir: Path) -> bool:
        if not model_dir.exists():
            return False

        patterns = [
            "model.safetensors",
            "pytorch_model.bin",
            "pytorch_model.bin.index.json",
            "*.safetensors",
        ]
        return any(any(model_dir.glob(pattern)) for pattern in patterns)

    local_model_path = MODEL_LOCAL_DIR

    if not has_checkpoint_files(local_model_path):
        logger.warning(
            "No local model checkpoint found at %s. Downloading %s...",
            local_model_path,
            MODEL_REPO_ID,
        )
        local_model_path.mkdir(parents=True, exist_ok=True)

        snapshot_kwargs = {
            "repo_id": MODEL_REPO_ID,
            "local_dir": str(local_model_path),
            "local_dir_use_symlinks": False,
        }
        if MODEL_CACHE_DIR:
            snapshot_kwargs["cache_dir"] = MODEL_CACHE_DIR

        snapshot_download(**snapshot_kwargs)

        if not has_checkpoint_files(local_model_path):
            raise RuntimeError(
                f"Model download completed but checkpoint files are still missing in {local_model_path}"
            )

        logger.info("Model weights downloaded to %s", local_model_path)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = AutoModelForImageSegmentation.from_pretrained(
        str(local_model_path),
        trust_remote_code=True,
        local_files_only=True,
    )
    model.to(device)
    model.eval()
    return model, device


def cleanup_files(job_id: str):
    org_path = ORG_DIR / f"{job_id}.png"
    processed_path = PROCESSED_DIR / f"{job_id}.png"

    if org_path.exists():
        org_path.unlink()
    if processed_path.exists():
        processed_path.unlink()


async def broadcast_job_state(job: dict) -> None:
    payload = build_status_payload(job)

    async with job_subscribers_lock:
        queues = list(job_subscribers.get(job["jobId"], set()))

    for queue in queues:
        try:
            queue.put_nowait(payload)
        except asyncio.QueueFull:
            logger.warning("Dropping stale SSE update for job %s", job["jobId"])


async def register_job_subscriber(job_id: str) -> asyncio.Queue[dict]:
    queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=10)
    async with job_subscribers_lock:
        subscribers = job_subscribers.setdefault(job_id, set())
        subscribers.add(queue)
    return queue


async def unregister_job_subscriber(job_id: str, queue: asyncio.Queue[dict]) -> None:
    async with job_subscribers_lock:
        subscribers = job_subscribers.get(job_id)
        if not subscribers:
            return
        subscribers.discard(queue)
        if not subscribers:
            job_subscribers.pop(job_id, None)


def process_image_bytes(image_bytes: bytes) -> bytes:
    global model, device

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


def set_dispatcher_wakeup() -> None:
    if dispatcher_wakeup is not None:
        dispatcher_wakeup.set()


def get_job_store() -> Collection:
    return ensure_database()


def build_job_paths(job_id: str) -> tuple[Path, Path]:
    return ORG_DIR / f"{job_id}.png", PROCESSED_DIR / f"{job_id}.png"


def is_internal_request(request: Request) -> bool:
    if not WORKER_INTERNAL_TOKEN:
        return True

    return request.headers.get("x-internal-token") == WORKER_INTERNAL_TOKEN


async def update_job(job_id: str, updates: dict) -> None:
    collection = get_job_store()
    await asyncio.to_thread(collection.update_one, {"jobId": job_id}, {"$set": {**updates, "updatedAt": utcnow()}})
    job = await asyncio.to_thread(collection.find_one, {"jobId": job_id}, {"_id": 0})
    if job:
        await broadcast_job_state(job)


async def process_job(job_id: str) -> None:
    collection = get_job_store()
    now = utcnow()

    try:
        job = await asyncio.to_thread(collection.find_one, {"jobId": job_id})
        if not job:
            return

        input_path = Path(job["inputPath"])
        output_path = Path(job["outputPath"])

        await update_job(job_id, {"status": "running", "progress": 10, "startedAt": now})

        if not input_path.exists():
            raise FileNotFoundError("Input file not found")

        image_bytes = input_path.read_bytes()
        await update_job(job_id, {"progress": 35})
        processed_bytes = await asyncio.to_thread(process_image_bytes, image_bytes)
        output_path.write_bytes(processed_bytes)

        await update_job(
            job_id,
            {
                "status": "completed",
                "progress": 100,
                "completedAt": utcnow(),
                "error": None,
            },
        )
    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        await update_job(
            job_id,
            {
                "status": "failed",
                "progress": 100,
                "completedAt": utcnow(),
                "error": str(exc),
            },
        )
    finally:
        current_task = asyncio.current_task()
        async with active_tasks_lock:
            if current_task in active_tasks:
                active_tasks.remove(current_task)
        set_dispatcher_wakeup()


def can_run_job(job: dict) -> bool:
    collection = get_job_store()
    client_key = job.get("clientKey") or "anonymous"
    active_count = collection.count_documents(
        {
            "clientKey": client_key,
            "status": {"$in": ["starting", "running"]},
        }
    )
    return active_count < MAX_JOBS_PER_CLIENT


def claim_next_job() -> Optional[dict]:
    collection = get_job_store()
    candidates = list(
        collection.find({"status": "queued"}).sort("createdAt", 1).limit(100)
    )

    for job in candidates:
        if not can_run_job(job):
            continue

        claimed = collection.find_one_and_update(
            {"jobId": job["jobId"], "status": "queued"},
            {
                "$set": {
                    "status": "starting",
                    "progress": 5,
                    "updatedAt": utcnow(),
                    "startedAt": utcnow(),
                }
            },
            return_document=ReturnDocument.AFTER,
        )

        if claimed:
            return claimed

    return None


async def dispatcher_loop() -> None:
    assert dispatcher_wakeup is not None

    while True:
        while True:
            async with active_tasks_lock:
                active_count = len(active_tasks)

            if active_count >= MAX_CONCURRENCY:
                break

            job = await asyncio.to_thread(claim_next_job)
            if not job:
                break

            task = asyncio.create_task(process_job(job["jobId"]))
            async with active_tasks_lock:
                active_tasks.add(task)

        try:
            await asyncio.wait_for(dispatcher_wakeup.wait(), timeout=QUEUE_POLL_SECONDS)
        except asyncio.TimeoutError:
            pass

        dispatcher_wakeup.clear()


async def cleanup_loop() -> None:
    collection = get_job_store()

    while True:
        cutoff = utcnow() - timedelta(hours=JOB_RETENTION_HOURS)
        stale_jobs = list(
            collection.find(
                {
                    "status": {"$in": ["completed", "failed", "cancelled", "expired"]},
                    "$or": [
                        {"completedAt": {"$lt": cutoff}},
                        {"createdAt": {"$lt": cutoff}},
                    ],
                },
                {"jobId": 1, "inputPath": 1, "outputPath": 1},
            )
        )

        for job in stale_jobs:
            cleanup_files(job["jobId"])
            await asyncio.to_thread(collection.delete_one, {"jobId": job["jobId"]})

        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)


def build_status_payload(job: dict) -> dict:
    public_status = job.get("status", "queued")
    if public_status == "starting":
        public_status = "running"

    return {
        "job_id": job["jobId"],
        "status": public_status,
        "progress": job.get("progress", 0),
        "error": job.get("error"),
    }


def format_sse_payload(job: dict) -> str:
    return f"data: {json.dumps(build_status_payload(job))}\n\n"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global dispatcher_task, cleanup_task, dispatcher_wakeup

    print("Loading model...")
    load_model()
    get_job_store()
    dispatcher_wakeup = asyncio.Event()
    dispatcher_task = asyncio.create_task(dispatcher_loop())
    cleanup_task = asyncio.create_task(cleanup_loop())
    print(f"Model loaded on {device}")

    try:
        yield
    finally:
        for task in [dispatcher_task, cleanup_task]:
            if task is not None:
                task.cancel()
        await asyncio.gather(*[task for task in [dispatcher_task, cleanup_task] if task is not None], return_exceptions=True)
        print("Shutting down...")


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/remove")
async def remove_background(
    request: Request,
    wait: bool = Form(False),
    file: UploadFile = File(...),
):
    if not is_internal_request(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    collection = get_job_store()

    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")

    job_id = str(uuid.uuid4())
    input_path, output_path = build_job_paths(job_id)
    input_path.write_bytes(file_bytes)

    client_key = request.headers.get("x-client-ip")
    if not client_key and request.client is not None:
        client_key = request.client.host

    job_record = {
        "jobId": job_id,
        "status": "queued",
        "progress": 0,
        "createdAt": utcnow(),
        "updatedAt": utcnow(),
        "expiresAt": utcnow() + timedelta(hours=JOB_RETENTION_HOURS),
        "inputPath": str(input_path),
        "outputPath": str(output_path),
        "fileName": file.filename or f"{job_id}.png",
        "clientKey": client_key or "anonymous",
        "error": None,
    }

    await asyncio.to_thread(collection.insert_one, job_record)

    if wait:
        await process_job(job_id)
        completed_job = await asyncio.to_thread(collection.find_one, {"jobId": job_id}, {"_id": 0})
        if not completed_job:
            raise HTTPException(status_code=500, detail="Job not found after processing")

        if completed_job.get("status") != "completed":
            return JSONResponse(
                {
                    "job_id": job_id,
                    "status": completed_job.get("status", "failed"),
                    "progress": completed_job.get("progress", 0),
                    "error": completed_job.get("error"),
                },
                status_code=500,
            )

        output_path = Path(completed_job["outputPath"])
        if not output_path.exists():
            raise HTTPException(status_code=500, detail="Processed image not found")

        return FileResponse(
            output_path,
            media_type="image/png",
            headers={"X-Job-Id": job_id},
        )

    set_dispatcher_wakeup()
    await broadcast_job_state(job_record)

    return JSONResponse(
        {
            "job_id": job_id,
            "status": "queued",
            "progress": 0,
        },
        status_code=202,
    )


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    collection = get_job_store()
    job = await asyncio.to_thread(collection.find_one, {"jobId": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JSONResponse(build_status_payload(job))


@app.get("/queue-status")
async def queue_status():
    collection = get_job_store()
    queued_jobs = await asyncio.to_thread(collection.count_documents, {"status": "queued"})
    running_jobs = await asyncio.to_thread(collection.count_documents, {"status": {"$in": ["starting", "running"]}})
    failed_jobs = await asyncio.to_thread(collection.count_documents, {"status": "failed"})
    completed_jobs = await asyncio.to_thread(collection.count_documents, {"status": "completed"})

    return JSONResponse(
        {
            "queue_length": queued_jobs,
            "running_jobs": running_jobs,
            "batch_size": MAX_CONCURRENCY,
            "max_concurrency": MAX_CONCURRENCY,
            "failed_jobs": failed_jobs,
            "completed_jobs": completed_jobs,
        }
    )


@app.get("/result/{job_id}")
async def get_result(job_id: str):
    collection = get_job_store()
    job = await asyncio.to_thread(collection.find_one, {"jobId": job_id}, {"_id": 0})

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("status") != "completed":
        raise HTTPException(status_code=409, detail="Job not completed")

    output_path = Path(job["outputPath"])
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Result not found")

    return FileResponse(
        output_path,
        media_type="image/png",
        headers={"X-Job-Id": job_id},
    )


@app.get("/events/{job_id}")
async def job_events(job_id: str, request: Request):
    collection = get_job_store()
    job = await asyncio.to_thread(collection.find_one, {"jobId": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    subscriber_queue = await register_job_subscriber(job_id)

    async def event_stream():
        try:
            yield format_sse_payload(job)

            while True:
                if await request.is_disconnected():
                    break

                try:
                    payload = await asyncio.wait_for(subscriber_queue.get(), timeout=15)
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
                    continue

                yield f"data: {json.dumps(payload)}\n\n"

                if payload.get("status") in {"completed", "failed"}:
                    break
        finally:
            await unregister_job_subscriber(job_id, subscriber_queue)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/health")
async def health():
    collection = get_job_store()
    queued_jobs = collection.count_documents({"status": "queued"})
    running_jobs = collection.count_documents({"status": {"$in": ["starting", "running"]}})
    return {
        "status": "healthy",
        "device": device,
        "model_loaded": model is not None,
        "queued_jobs": queued_jobs,
        "running_jobs": running_jobs,
        "max_concurrency": MAX_CONCURRENCY,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))