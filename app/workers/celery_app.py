from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "govt_notice_workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.task_routes = {
    "app.workers.tasks.process_notice.*": {"queue": "ai_processing"},
    "app.workers.tasks.send_reminders.*": {"queue": "reminders"},
    "app.workers.tasks.send_email.*": {"queue": "email"},
}

celery_app.conf.beat_schedule = {
    "check-deadline-reminders-hourly": {
        "task": "app.workers.tasks.send_reminders.check_and_send_reminders",
        "schedule": crontab(minute=0), # Every hour
    },
}

celery_app.autodiscover_tasks(["app.workers.tasks"])
