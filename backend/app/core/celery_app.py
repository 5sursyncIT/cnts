"""Celery application configuration for background task processing."""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "cnts",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Dakar",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "sweep-expired-reservations": {
            "task": "app.tasks.maintenance.sweep_reservations",
            "schedule": 3600.0,
        },
        "check-expiration-alerts": {
            "task": "app.tasks.maintenance.check_expiration_alerts",
            "schedule": 86400.0,
        },
    },
)

celery_app.autodiscover_tasks(["app.tasks"])
