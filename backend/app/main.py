from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.errors import register_exception_handlers
from app.routers import (
    analytics,
    auth,
    calendar,
    dashboard,
    job_children,
    jobs,
    notifications,
    pipeline,
    sources,
    transfer,
)

app = FastAPI(title="JobFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(pipeline.router)
app.include_router(pipeline.interview_types_router)
app.include_router(sources.router)
app.include_router(jobs.router)
app.include_router(job_children.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(calendar.router)
app.include_router(notifications.router)
app.include_router(transfer.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
