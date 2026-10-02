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
        # Rappel des rendez-vous de don la veille (fenêtre glissante de 24 h).
        "rappels-rendez-vous": {
            "task": "app.tasks.rappels.rappels_rendez_vous",
            "schedule": 3600.0,
        },
        "check-expiration-alerts": {
            "task": "app.tasks.maintenance.check_expiration_alerts",
            "schedule": 86400.0,
        },
    },
)

# Modules de tâches chargés explicitement par le worker. (`autodiscover_tasks(["app.tasks"])`
# cherchait un module `app.tasks.tasks` inexistant : aucune tâche n'était enregistrée et
# toutes les tâches planifiées étaient rejetées par le worker.)
celery_app.conf.include = [
    "app.tasks.maintenance",
    "app.tasks.notifications",
    "app.tasks.reports",
    "app.tasks.rappels",
]
