# Deploy BG Remover to Google Cloud Run (Docker)

This project can be deployed to Cloud Run using the included `Dockerfile`.

## 1) Prerequisites

- Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated
- Cloud APIs enabled:
  - `run.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `cloudbuild.googleapis.com`

## 2) Set variables

```bash
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="us-central1"
export REPO="testbgremover"
export IMAGE="testbgremover-worker"
export SERVICE="testbgremover-worker"

gcloud config set project "$PROJECT_ID"
```

## 3) Create Artifact Registry (one-time)

```bash
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="BG Remover Docker images"
```

## 4) Build and push image

### Option A: Cloud Build (recommended)

```bash
export IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest"

gcloud builds submit --config cloudbuild.yaml --substitutions=_IMAGE_URI="$IMAGE_URI"
```

### Option B: Local Docker build + push

```bash
gcloud auth configure-docker "$REGION-docker.pkg.dev"

docker build -t "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest" .
docker push "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest"
```

## 5) Deploy to Cloud Run

```bash
gcloud run deploy "$SERVICE" \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 2 \
  --memory 8Gi \
  --timeout 300 \
  --concurrency 1
```

Notes:
- `--memory 8Gi` is recommended because model loading/inference is heavy.
- `--concurrency 1` avoids multiple concurrent inferences per container.

## 6) Verify

```bash
SERVICE_URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')

echo "$SERVICE_URL"
curl "$SERVICE_URL/health"
```

You should get JSON with `status: healthy`.
