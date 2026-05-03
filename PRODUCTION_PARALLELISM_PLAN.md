# Production Parallelism Plan

## Goal

Rebuild the upload pipeline so the system can handle many users at once, process multiple jobs in parallel, and keep one user from blocking everyone else.

The current worker is synchronous and effectively single-request-at-a-time per process. The target design must be:
- asynchronous
- horizontally scalable
- secure by default
- observable
- backwards compatible during rollout

## Current State

- The website submits an image and waits on a proxy path.
- The worker currently processes the image inside the request handler.
- Status and WebSocket routes are documented in the repo but not implemented in the worker.
- There is no durable job queue.
- There is no persisted job state.
- There is no fair scheduling between users.

## Target Architecture

### Website

- Acts only as UI and API gateway client.
- Never blocks on image inference.
- Submits jobs asynchronously and receives a `job_id` immediately.
- Polls or subscribes to status updates.
- Renders local progress from job state, not from inference work.

### Worker Service

- Accepts job creation requests.
- Stores job metadata durably.
- Pushes jobs into a real queue.
- Runs multiple worker consumers in parallel.
- Streams status updates from job state transitions.
- Returns results from object storage or a durable result store.

### Shared Infrastructure

- Queue: Redis, RabbitMQ, or managed equivalent.
- State store: PostgreSQL, MongoDB, or Redis plus persistence, but durable storage is required.
- Result store: object storage or durable file store with cleanup lifecycle.
- Monitoring: structured logs, metrics, traces, and job audit records.

## Correct Request Flow

1. Browser uploads file to website.
2. Website validates size and type before forwarding.
3. Website requests job creation from worker.
4. Worker writes a job record and enqueues work.
5. Worker returns `job_id`, `queued`, and a tracking URL.
6. Browser subscribes to `GET /jobs/{job_id}` or `WS /jobs/{job_id}/events`.
7. Worker consumer processes the job.
8. Worker updates progress and final status.
9. Browser fetches result when status becomes `completed`.

## Parallelism Rules

- Multiple users must be processed concurrently.
- Multiple jobs from the same user can also run concurrently, but with per-user fairness.
- Concurrency must be capped globally and per user.
- Queue scheduling must prevent one account or IP from starving others.
- Long jobs must not block short jobs behind them if the queue supports priority or fair dispatch.

## Worker Design

### Job State Machine

- `queued`
- `starting`
- `running`
- `uploading_result`
- `completed`
- `failed`
- `expired`
- `cancelled`

### Job Record Fields

- `job_id`
- `user_id` or anonymous session key
- `file_name`
- `mime_type`
- `size_bytes`
- `status`
- `progress`
- `attempt_count`
- `created_at`
- `updated_at`
- `started_at`
- `completed_at`
- `result_location`
- `error_code`
- `error_message`

### Execution Model

- Use a queue consumer pool, not request-thread execution.
- Start one process per CPU/GPU worker slot, not per HTTP request.
- Bound in-flight jobs with a semaphore or worker pool size.
- Separate API process from inference workers.
- Make job processing idempotent so retries do not duplicate results.

## Website Design

### Upload Path

- Validate file size, MIME type, and count before upload.
- Send the file with `multipart/form-data`.
- Expect immediate `job_id` response.
- Store the job id in client state.
- Start status subscription or polling.

### Status Path

- Prefer WebSocket or SSE if supported.
- Fall back to polling every 1-2 seconds.
- Stop polling after terminal states.
- Never assume a job finished until the worker says so.

### UX Rules

- Show queued, running, completed, and failed states clearly.
- Show queue position only if the worker can compute it accurately.
- Support many jobs in the UI without freezing the page.

## Security Plan

### Edge Validation

- Enforce file type allowlist.
- Enforce file size limits.
- Reject malformed multipart requests early.
- Sniff content server-side, do not trust extension or browser MIME alone.

### Request Protection

- Use rate limiting per IP and per account.
- Add auth or signed upload tokens if the product is not public.
- Add CSRF protection on browser-initiated state-changing requests.
- Set strict CORS to the website origin only.

### Job Safety

- Sanitize all file names.
- Never expose internal file paths.
- Use random job ids.
- Keep results private unless an authenticated download is authorized.
- Expire completed jobs and delete temp files automatically.

### Abuse Resistance

- Add global queue depth limits.
- Add per-user queue limits.
- Add request throttling for repeated failures.
- Reject uploads when the system is under backpressure instead of letting memory grow unbounded.

## Monitoring And Operations

- Log every job creation, start, completion, retry, and failure.
- Export queue depth, active workers, completed jobs, failed jobs, and average latency.
- Add health checks for API, queue, storage, and model loading.
- Add trace correlation from request to job id.
- Add an admin-only cleanup endpoint or background retention job.

## Backwards-Compatible Rollout

### Phase 1

- Introduce new async job endpoints.
- Keep existing endpoints working.
- Route website uploads to the new async path behind a feature flag.

### Phase 2

- Add queue and persistent job state.
- Add status streaming and polling.
- Add result storage and cleanup.

### Phase 3

- Enable parallel workers.
- Enforce fairness and per-user caps.
- Remove synchronous fallback once stable.

### Phase 4

- Remove obsolete code paths and stale docs.
- Lock down production auth, rate limits, and origin rules.

## Non-Negotiable Production Requirements

- No inference work in the HTTP request thread.
- No in-memory-only job state for production.
- No single-user starvation of the queue.
- No undocumented endpoint behavior.
- No public exposure of internal worker files or temp directories.
- No unbounded queue growth.

## Acceptance Criteria

- 100 concurrent uploads do not freeze the website.
- Multiple users receive fair scheduling.
- Status survives process restarts.
- Workers can scale horizontally.
- Failed jobs do not block healthy jobs.
- Results can be retrieved after processing without race conditions.
- Security checks reject bad input before inference.
