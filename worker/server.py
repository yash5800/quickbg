import asyncio
import json
import io
import logging
import os
import uuid
import psutil
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
from pymongo.errors import PyMongoError, DuplicateKeyError
from pymongo.collection import Collection
from pymongo.database import Database
import hashlib
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
from dotenv import load_dotenv
load_dotenv()

print(os.getenv("NEXT_MONGODB_URI") and "MONGO" or "No MONGO URI configured")

from huggingface_hub import login

HF_TOKEN = os.getenv("HF_TOKEN")
if HF_TOKEN:
    login(token=HF_TOKEN)
    print("Logged into Hugging Face Hub")
else:
    print("No HF_TOKEN configured; relying on cached models or public access")

UPLOADS_DIR = Path(__file__).parent / "uploads"
ORG_DIR = UPLOADS_DIR / "org"
PROCESSED_DIR = UPLOADS_DIR / "processed"

ORG_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/tiff", "image/tif", "image/heif", "image/heic", "image/avif"}
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("WORKER_MAX_UPLOAD_SIZE_BYTES", str(20 * 1024 * 1024)))
MAX_CONCURRENCY = max(1, int(os.getenv("WORKER_MAX_CONCURRENCY", "2")))
MAX_JOBS_PER_CLIENT = max(1, int(os.getenv("WORKER_MAX_JOBS_PER_CLIENT", "1")))
# Support both WORKER_JOB_RETENTION_MINUTES (new) and WORKER_JOB_RETENTION_HOURS (legacy for backward compatibility)
# Minimum of 1 minute for testing. Default: 10 minutes
if "WORKER_JOB_RETENTION_MINUTES" in os.environ:
    JOB_RETENTION_MINUTES = max(1, int(os.getenv("WORKER_JOB_RETENTION_MINUTES")))
else:
    legacy_retention_hours = os.getenv("WORKER_JOB_RETENTION_HOURS")
    if legacy_retention_hours is not None:
        JOB_RETENTION_MINUTES = max(1, int(legacy_retention_hours)) * 60
    else:
        JOB_RETENTION_MINUTES = 10
QUEUE_POLL_SECONDS = float(os.getenv("WORKER_QUEUE_POLL_SECONDS", "1.0"))
CLEANUP_INTERVAL_SECONDS = int(os.getenv("WORKER_CLEANUP_INTERVAL_SECONDS", "60"))
CPU_THRESHOLD_PERCENT = int(os.getenv("WORKER_CPU_THRESHOLD_PERCENT", "80"))
MEMORY_THRESHOLD_PERCENT = int(os.getenv("WORKER_MEMORY_THRESHOLD_PERCENT", "80"))

MONGO_URI = os.getenv("NEXT_MONGODB_URI")
MONGO_DB_NAME = os.getenv("NEXT_MONGODB_DB", "testbgremover")
WORKER_INTERNAL_TOKEN = os.getenv("WORKER_INTERNAL_TOKEN")
ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "WORKER_CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001",
    ).split(",")
    if origin.strip()
]

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("testbgremover.worker")

MODEL_REPO_ID = os.getenv("WORKER_MODEL_REPO_ID", "Joker5800/ZhengPeng7_BiRefNet_lite")
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

def get_dynamic_concurrency() -> int:
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        memory_percent = memory.percent

        if cpu_percent > CPU_THRESHOLD_PERCENT or memory_percent > MEMORY_THRESHOLD_PERCENT:
            return 1
        if cpu_percent < CPU_THRESHOLD_PERCENT * 0.5 and memory_percent < MEMORY_THRESHOLD_PERCENT * 0.5:
            return min(MAX_CONCURRENCY, 2)
        return 1
    except Exception:
        return 1


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def ensure_database() -> Collection:
    global mongo_client, db, jobs_collection

    if jobs_collection is not None:
        return jobs_collection

    if not MONGO_URI:
        raise RuntimeError("NEXT_MONGODB_URI not configured")

    mongo_client = MongoClient(MONGO_URI, tz_aware=True)
    db = mongo_client.get_database(MONGO_DB_NAME)
    jobs_collection = db["jobs"]
    # analytics collection stores aggregated counts per day and hourly breakdowns
    try:
        db.create_collection("analytics")
    except Exception:
        pass
    try:
        db.create_collection("analytics_seen")
    except Exception:
        pass
    analytics_collection = db["analytics"]
    analytics_seen = db["analytics_seen"]

    # ensure indexes
    try:
        analytics_collection.create_index([("date", 1)], unique=True)
    except Exception:
        pass
    # Temporary dedupe store for user hashes (TTL ~ 25 hours)
    try:
        analytics_seen.create_index([("date", 1), ("h", 1)], unique=True)
        analytics_seen.create_index("createdAt", expireAfterSeconds=int(25 * 3600))
    except Exception:
        pass

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


def record_analytics(client_key: Optional[str]) -> None:
    """Record job and unique user counts without storing raw IPs.
    We store only a hash of client_key temporarily in `analytics_seen` to dedupe unique users per day.
    """
    try:
        if db is None:
            return

        analytics = db["analytics"]
        analytics_seen = db["analytics_seen"]

        now = utcnow()
        date_str = now.date().isoformat()
        hour_str = f"{now.hour:02d}"

        # Increment job counters (daily + hourly)
        update_ops = {
            "$inc": {"jobs": 1, f"hours.{hour_str}.jobs": 1},
            "$setOnInsert": {"date": date_str},
        }
        analytics.update_one({"date": date_str}, update_ops, upsert=True)

        # If we have a client key, store a hash in analytics_seen to dedupe unique users per day.
        if client_key:
            h = hashlib.sha256(client_key.encode("utf-8")).hexdigest()
            seen_doc = {"date": date_str, "h": h, "createdAt": utcnow()}
            try:
                analytics_seen.insert_one(seen_doc)
                # first-seen for this day -> increment unique user counters
                analytics.update_one({"date": date_str}, {"$inc": {"unique_users": 1, f"hours.{hour_str}.users": 1}, "$setOnInsert": {"date": date_str}}, upsert=True)
            except DuplicateKeyError:
                # already seen today, do nothing for unique user counts
                pass
    except Exception:
        logger.exception("Failed to record analytics")


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

    with torch.inference_mode():
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

    if request.headers.get("x-internal-token") == WORKER_INTERNAL_TOKEN:
        return True

    origin = request.headers.get("origin")
    if origin and origin in ALLOWED_ORIGINS:
        return True

    return False


async def update_job(job_id: str, updates: dict) -> None:
    """Update job document. Always removes 'progress' field to use status-derived progress."""
    collection = get_job_store()
    # Remove 'progress' field as it's redundant (derived from status)
    updates.pop("progress", None)
    updates.pop("completedAt", None)  # No need to store completion time separately
    updates["updatedAt"] = utcnow()
    
    result = await asyncio.to_thread(collection.update_one, {"jobId": job_id}, {"$set": updates})
    job = await asyncio.to_thread(collection.find_one, {"jobId": job_id}, {"_id": 0})
    if job:
        await broadcast_job_state(job)


async def process_job(job_id: str) -> None:
    collection = get_job_store()
    now = utcnow()

    try:
        job = await asyncio.to_thread(collection.find_one, {"jobId": job_id})
        if not job:
            logger.warning(f"Job {job_id} not found, skipping")
            return

        input_path = Path(job["inputPath"])
        output_path = Path(job["outputPath"])

        # Update to running (progress derived from status)
        await update_job(job_id, {"status": "running", "startedAt": now})
        logger.info(f"[Job {job_id}] Processing started")

        if not input_path.exists():
            logger.warning(f"[Job {job_id}] Input file not found, marking failed")
            await update_job(job_id, {"status": "failed", "error": "Input file not found"})
            return

        image_bytes = input_path.read_bytes()
        logger.info(f"[Job {job_id}] Image loaded: {len(image_bytes)} bytes")
        
        processed_bytes = await asyncio.to_thread(process_image_bytes, image_bytes)
        output_path.write_bytes(processed_bytes)
        logger.info(f"[Job {job_id}] Image processed and saved")

        # Update to completed (no progress field needed)
        await update_job(
            job_id,
            {
                "status": "completed",
                "error": None,
            },
        )
        logger.info(f"[Job {job_id}] Successfully completed")
    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        await update_job(
            job_id,
            {
                "status": "failed",
                "error": str(exc),
            },
        )
        logger.error(f"[Job {job_id}] Failed: {str(exc)}")
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
    now = utcnow()

    # Clean up stale "starting" jobs that have been stuck for >2 minutes
    # These could be from crashed workers or hung processes
    stale_starting = list(collection.find({
        "status": "starting",
        "startedAt": {"$lt": now - timedelta(minutes=2)}
    }))
    for job in stale_starting:
        logger.warning(f"[Job {job['jobId']}] Stale starting job, resetting to queued")
        collection.update_one(
            {"jobId": job["jobId"]},
            {"$set": {"status": "queued", "updatedAt": now}},
        )

    # Clean up stale "running" jobs that have been stuck for >5 minutes
    stale_running = list(collection.find({
        "status": "running",
        "startedAt": {"$lt": now - timedelta(minutes=5)}
    }))
    for job in stale_running:
        logger.warning(f"[Job {job['jobId']}] Stale running job, marking failed")
        collection.update_one(
            {"jobId": job["jobId"]},
            {"$set": {"status": "failed", "error": "Job timed out", "updatedAt": now}},
        )

    candidates = list(
        collection.find({"status": "queued"}).sort("createdAt", 1).limit(100)
    )

    # Clean up queued jobs with missing input files
    for job in candidates:
        input_path = Path(job.get("inputPath", ""))
        if input_path and not input_path.exists():
            logger.warning(f"[Job {job['jobId']}] Queued job has missing input file, marking failed")
            collection.update_one(
                {"jobId": job["jobId"]},
                {
                    "$set": {
                        "status": "failed",
                        "error": "Queued job input file is missing",
                        "updatedAt": now,
                    }
                },
            )

    # Re-fetch candidates after cleanup
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
                    "updatedAt": now,
                    "startedAt": now,
                }
            },
            return_document=ReturnDocument.AFTER,
        )

        if claimed:
            logger.info(f"[Job {claimed['jobId']}] Claimed for processing")
            return claimed

    return None


async def dispatcher_loop() -> None:
    assert dispatcher_wakeup is not None

    while True:
        # Claim and process as many jobs as we can
        while True:
            # Check current concurrency
            async with active_tasks_lock:
                active_count = len(active_tasks)

            current_concurrency = get_dynamic_concurrency()

            if active_count >= current_concurrency:
                break

            # claim_next_job handles cleanup and returns an already-claimed job
            job = await asyncio.to_thread(claim_next_job)
            if not job:
                break

            logger.info(f"[Dispatcher] Processing job {job['jobId']}")
            task = asyncio.create_task(process_job(job["jobId"]))
            async with active_tasks_lock:
                active_tasks.add(task)

        # No more jobs to claim, wait for work
        try:
            await asyncio.wait_for(dispatcher_wakeup.wait(), timeout=QUEUE_POLL_SECONDS)
        except asyncio.TimeoutError:
            pass

        dispatcher_wakeup.clear()

        dispatcher_wakeup.clear()
        logger.debug(f"[Dispatcher] Woke up, checking for new jobs")


async def cleanup_loop() -> None:
    """
    Monitor and clean up expired jobs. Calls cleanup_files for each expired job
    before MongoDB TTL auto-deletes the documents.
    """
    collection = get_job_store()
    cleanup_count = 0
    files_cleaned = 0

    while True:
        try:
            now = utcnow()

            # Find expired jobs that haven't been cleaned yet
            expired_jobs = list(collection.find(
                {"expiresAt": {"$lt": now}, "status": {"$ne": "cleaned"}},
                {"jobId": 1, "status": 1, "resultPath": 1}
            ))

            if expired_jobs:
                logger.info(f"[TTL Cleanup] Found {len(expired_jobs)} expired jobs to clean")

                for job in expired_jobs:
                    job_id = job.get("jobId")
                    if job_id:
                        # Clean up the files on disk
                        cleanup_files(job_id)
                        files_cleaned += 1
                        logger.debug(f"[TTL Cleanup] Cleaned files for job {job_id}")

                        # Mark as cleaned so we don't process again
                        try:
                            collection.update_one(
                                {"jobId": job_id},
                                {"$set": {"status": "cleaned"}}
                            )
                        except Exception as e:
                            logger.warning(f"[TTL Cleanup] Failed to mark job {job_id} as cleaned: {e}")

                logger.info(f"[TTL Cleanup] Cleaned {len(expired_jobs)} jobs, {files_cleaned} total file cleanups")

            # Also log what's coming up
            soon_expire = now + timedelta(minutes=5)
            expiring_soon = collection.count_documents({"expiresAt": {"$gte": now, "$lte": soon_expire}})
            if expiring_soon > 0:
                logger.info(f"[TTL Cleanup] {expiring_soon} jobs expiring in next 5 minutes")

            cleanup_count += len(expired_jobs)

        except Exception as e:
            logger.error(f"[TTL Cleanup] Error during monitoring: {e}", exc_info=True)

        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)


def get_queue_position(job_id: str, created_at: datetime) -> Optional[int]:
    """Calculate job's position in queue. Returns None if not queued."""
    collection = get_job_store()
    count = collection.count_documents({
        "status": "queued",
        "createdAt": {"$lt": created_at}
    })
    return count + 1


def estimate_wait(queue_position: Optional[int], avg_seconds_per_job: int = 12) -> Optional[int]:
    """Estimate wait time in seconds based on queue position."""
    if queue_position is None:
        return None
    return queue_position * avg_seconds_per_job


def get_progress_from_status(status: str) -> int:
    """Derive progress percentage from status.
    This eliminates the need to store redundant progress field.
    """
    status_map = {
        "queued": 0,
        "starting": 25,
        "running": 50,
        "completed": 100,
        "failed": 0,
        "cancelled": 0,
        "expired": 0,
    }
    return status_map.get(status, 0)


def build_status_payload(job: dict) -> dict:
    """Build status response for API, deriving progress from status."""
    public_status = job.get("status", "queued")
    if public_status == "starting":
        public_status = "running"

    # Progress is now derived from status instead of stored separately
    progress = get_progress_from_status(public_status)

    queue_position = None
    estimated_wait = None
    if public_status == "queued":
        queue_position = get_queue_position(job["jobId"], job["createdAt"])
        estimated_wait = estimate_wait(queue_position)

    return {
        "job_id": job["jobId"],
        "status": public_status,
        "progress": progress,
        "error": job.get("error"),
        "queue_position": queue_position,
        "estimated_wait_seconds": estimated_wait,
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
    logger.info(f"Received remove request: filename={file.filename}, size={file.size}")

    if not is_internal_request(request):
        raise HTTPException(status_code=401, detail="Unauthorized")

    collection = get_job_store()

    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type")

    file_bytes = await file.read()
    logger.info(f"File read complete: {len(file_bytes)} bytes")

    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")

    job_id = str(uuid.uuid4())
    input_path, output_path = build_job_paths(job_id)

    # Try to decode and normalize to PNG where possible so downstream model
    # processing reliably receives a PNG/RGBA image. If decoding fails, fall
    # back to saving the original bytes and let downstream report errors.
    normalized_saved = False
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img = img.convert("RGBA")
        normalized_buf = io.BytesIO()
        img.save(normalized_buf, format="PNG")
        normalized_buf.seek(0)
        png_bytes = normalized_buf.read()
        input_path = input_path.with_suffix(".png")
        input_path.write_bytes(png_bytes)
        logger.info(f"Job {job_id} created, normalized PNG saved to {input_path}")
        normalized_saved = True
    except Exception:
        logger.debug("PIL failed to decode; attempting format-specific decoders if available")
        # Try pillow_heif for HEIF/HEIC
        try:
            import pillow_heif

            heif = pillow_heif.read_heif(file_bytes)
            img = Image.frombytes(heif.mode, heif.size, heif.data)
            img = img.convert("RGBA")
            normalized_buf = io.BytesIO()
            img.save(normalized_buf, format="PNG")
            normalized_buf.seek(0)
            png_bytes = normalized_buf.read()
            input_path = input_path.with_suffix(".png")
            input_path.write_bytes(png_bytes)
            logger.info(f"Job {job_id} created, decoded HEIF/HEIC and saved PNG to {input_path}")
            normalized_saved = True
        except Exception:
            logger.debug("pillow_heif not available or failed to decode")

    if not normalized_saved:
        # Final fallback: write original upload bytes
        input_path.write_bytes(file_bytes)
        logger.info(f"Job {job_id} created, original file saved to {input_path}")

    client_key = request.headers.get("x-client-ip")
    if not client_key and request.client is not None:
        client_key = request.client.host

    job_record = {
        "jobId": job_id,
        "status": "queued",
        "createdAt": utcnow(),
        "updatedAt": utcnow(),
        "expiresAt": utcnow() + timedelta(minutes=JOB_RETENTION_MINUTES),
        "inputPath": str(input_path),
        "outputPath": str(output_path),
        "fileName": file.filename or f"{job_id}.png",
        "clientKey": client_key or "anonymous",
        "error": None,
    }

    await asyncio.to_thread(collection.insert_one, job_record)
    logger.info(f"[Job {job_id}] Created - expires at {job_record['expiresAt'].isoformat()}")

    # Record analytics (jobs + unique users) asynchronously; we store only hashed client keys temporarily.
    try:
        asyncio.create_task(asyncio.to_thread(record_analytics, client_key))
    except Exception:
        logger.exception("Failed to schedule analytics recording")

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
                    "progress": get_progress_from_status(completed_job.get("status", "failed")),
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
    current_concurrency = get_dynamic_concurrency()

    cpu_percent = 0
    memory_percent = 0
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
    except Exception:
        pass

    return {
        "status": "healthy",
        "device": device,
        "model_loaded": model is not None,
        "queued_jobs": queued_jobs,
        "running_jobs": running_jobs,
        "max_concurrency": current_concurrency,
        "cpu_percent": cpu_percent,
        "memory_percent": memory_percent,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))