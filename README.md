# Diamond Buyback Tracking System

Monorepo for tracking diamond buyback items with strict scan handovers, audit logging, and role-based workflows.

## Repo Structure

```
diamond-tracker/
  backend/
  admin-web/
  mobile/
  docs/
  docker-compose.yml
  .env.example
```

## Quick Start (Docker)

1) Copy env:

```bash
cp .env.example .env
```

2) Start services:

```bash
docker compose up --build
```

Backend: http://localhost:8000/docs
Admin Web: http://localhost:3000
MinIO Console: http://localhost:9001

## Backend Local Dev (without Docker)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Admin Web Dev

```bash
cd admin-web
npm install
npm run dev
```

## Flutter Mobile

```bash
cd mobile
flutter pub get
flutter pub run build_runner build
flutter run
```

## Render Deployment (Blueprint)

This repo includes `render.yaml` for a simple two-service setup (backend + admin web) with a managed Postgres database.

1) Create a new Render Blueprint from this repo (Render will pick up `render.yaml`).
2) Set the required secret env vars in the Render dashboard for the backend service:
   - `SECRET_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `S3_ENDPOINT_URL`
   - `S3_BUCKET`
   - `S3_ACCESS_KEY`
   - `S3_SECRET_KEY`
   - Optional: override `S3_REGION` if needed
3) For storage, use an external S3-compatible service (AWS S3, DO Spaces, etc).
   - If you must use local storage on Render, set `STORAGE_BACKEND=local`,
     add a persistent disk to the backend service, and set `LOCAL_STORAGE_PATH`
     to the mounted path.

## Notes

- Default admin credentials are set in `.env` via `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- Storage defaults to MinIO (S3-compatible). Set `STORAGE_BACKEND=local` for local disk fallback.
