# JobFlow

A personal job-application CRM (ATS) with a drag-and-drop Kanban pipeline.

## Live

Have a go: https://jobflow-two-phi.vercel.app

Make your own account, it takes about ten seconds.

## Stack

- Backend: FastAPI + SQLAlchemy 2.0 + PostgreSQL 16 + Alembic + JWT auth
- Frontend: React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + TanStack Query 5 + dnd-kit

## Local development

### 1. Database

```
cp .env.example .env
# edit .env and set a real SECRET_KEY
docker compose up -d db
```

### 2. Backend

```
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt      # PowerShell
.venv\Scripts\alembic upgrade head
.venv\Scripts\python -m app.seed --demo             # optional demo data
.venv\Scripts\uvicorn app.main:app --reload
```

API runs at http://localhost:8000 (docs at /docs).

### 3. Frontend

```
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173.

## Built fast

Worth saying: the whole thing, backend, frontend, database schema, auth, the Kanban board, all of it, came together in about 50 minutes, from two prompts. Nothing was hand-fixed line by line afterwards. Two asks in, and out came a working app.


