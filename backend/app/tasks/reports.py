"""Report generation tasks."""

import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.reports.generate_report")
def generate_report(report_type: str, params: dict) -> dict:
    """Generate a report asynchronously and store the result."""
    import datetime as dt
    import uuid

    from app.db.models import TaskResult
    from app.db.session import SessionLocal

    task_id = generate_report.request.id or str(uuid.uuid4())
    db = SessionLocal()
    try:
        # Update task status
        result = db.get(TaskResult, task_id) if task_id else None
        if result:
            result.status = "RUNNING"
            db.commit()

        # Generate report based on type
        report_data = {}
        if report_type == "activity":
            report_data = _generate_activity_report(db, params)
        elif report_type == "stock":
            report_data = _generate_stock_report(db, params)
        else:
            report_data = {"error": f"type de rapport inconnu : {report_type}"}

        if result:
            result.status = "SUCCESS"
            result.result_json = report_data
            result.completed_at = dt.datetime.now(dt.timezone.utc)
            db.commit()

        return report_data
    except Exception as exc:
        if result:
            result.status = "FAILURE"
            result.error_message = str(exc)[:1000]
            db.commit()
        raise
    finally:
        db.close()


def _generate_activity_report(db, params: dict) -> dict:
    """Generate activity report data."""
    from sqlalchemy import func, select

    from app.db.models import Don

    stmt = select(func.count(Don.id))
    total = db.execute(stmt).scalar() or 0
    return {"total_dons": total, "params": params}


def _generate_stock_report(db, params: dict) -> dict:
    """Generate stock report data."""
    from sqlalchemy import func, select

    from app.db.models import Poche

    stmt = (
        select(Poche.type_produit, Poche.statut_distribution, func.count(Poche.id))
        .group_by(Poche.type_produit, Poche.statut_distribution)
    )
    rows = db.execute(stmt).all()
    breakdown = [
        {"type_produit": r[0], "statut": r[1], "count": r[2]}
        for r in rows
    ]
    return {"breakdown": breakdown, "params": params}
