import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_auth_in_production
from app.audit.events import log_event
from app.db.models import Notification, NotificationPreference, UserAccount
from app.db.session import get_db
from app.schemas.notifications import (
    NotificationCreate,
    NotificationOut,
    NotificationPreferenceOut,
    NotificationPreferenceUpdate,
)

router = APIRouter(prefix="/notifications")


@router.post("", response_model=NotificationOut, status_code=201)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Notification:
    notif = Notification(
        canal=payload.canal,
        destinataire=payload.destinataire,
        template=payload.template,
        variables=payload.variables,
        priorite=payload.priorite,
    )
    db.add(notif)
    db.flush()

    log_event(
        db,
        aggregate_type="notification",
        aggregate_id=notif.id,
        event_type="notification.creee",
        payload={
            "canal": notif.canal,
            "destinataire": notif.destinataire,
            "template": notif.template,
        },
    )
    db.commit()
    db.refresh(notif)

    # Enqueue sending via Celery (best effort, don't fail if Redis unavailable)
    try:
        from app.tasks.notifications import send_notification

        send_notification.delay(str(notif.id))
    except Exception:
        pass

    return notif


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    canal: str | None = Query(default=None),
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Notification]:
    stmt = select(Notification)
    if canal:
        stmt = stmt.where(Notification.canal == canal)
    if statut:
        stmt = stmt.where(Notification.statut == statut)
    return list(
        db.execute(stmt.order_by(Notification.created_at.desc()).offset(offset).limit(limit)).scalars()
    )


@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(notification_id: uuid.UUID, db: Session = Depends(get_db)) -> Notification:
    notif = db.get(Notification, notification_id)
    if notif is None:
        raise HTTPException(status_code=404, detail="notification introuvable")
    return notif


@router.post("/{notification_id}/retry", response_model=NotificationOut)
def retry_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Notification:
    notif = db.get(Notification, notification_id)
    if notif is None:
        raise HTTPException(status_code=404, detail="notification introuvable")

    if notif.statut != "ECHEC":
        raise HTTPException(status_code=409, detail="seules les notifications en echec peuvent etre relancees")

    notif.statut = "EN_ATTENTE"
    notif.erreur = None

    log_event(
        db,
        aggregate_type="notification",
        aggregate_id=notif.id,
        event_type="notification.relancee",
        payload={"tentatives_precedentes": notif.tentatives},
    )
    db.commit()
    db.refresh(notif)

    try:
        from app.tasks.notifications import send_notification

        send_notification.delay(str(notif.id))
    except Exception:
        pass

    return notif


@router.get("/preferences/me", response_model=NotificationPreferenceOut)
def get_preferences(
    db: Session = Depends(get_db),
    user: UserAccount = Depends(get_current_user),
) -> NotificationPreference:
    pref = db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user.id)
    ).scalar_one_or_none()
    if pref is None:
        pref = NotificationPreference(user_id=user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("/preferences/me", response_model=NotificationPreferenceOut)
def update_preferences(
    payload: NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    user: UserAccount = Depends(get_current_user),
) -> NotificationPreference:
    pref = db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user.id)
    ).scalar_one_or_none()
    if pref is None:
        pref = NotificationPreference(user_id=user.id)
        db.add(pref)

    pref.email_enabled = payload.email_enabled
    pref.sms_enabled = payload.sms_enabled
    pref.whatsapp_enabled = payload.whatsapp_enabled
    db.commit()
    db.refresh(pref)
    return pref
