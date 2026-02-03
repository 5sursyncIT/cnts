import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.events import log_event
from app.core.blood import is_compatible_rbc
from app.db.models import CrossMatch, Don, Poche, Receveur
from app.db.session import get_db
from app.schemas.crossmatch import CrossMatchCreate, CrossMatchOut

router = APIRouter(prefix="/cross-match")


@router.post("", response_model=CrossMatchOut, status_code=201)
def create_or_update_crossmatch(payload: CrossMatchCreate, db: Session = Depends(get_db)) -> CrossMatch:
    poche = db.get(Poche, payload.poche_id)
    if poche is None:
        raise HTTPException(status_code=404, detail="poche introuvable")
    if poche.type_produit != "CGR":
        raise HTTPException(status_code=422, detail="cross-match uniquement pour CGR")

    receveur = db.get(Receveur, payload.receveur_id)
    if receveur is None:
        raise HTTPException(status_code=404, detail="receveur introuvable")

    if payload.resultat == "COMPATIBLE":
        if poche.groupe_sanguin is None or receveur.groupe_sanguin is None:
            raise HTTPException(status_code=422, detail="groupe sanguin manquant (poche ou receveur)")
        if not is_compatible_rbc(receveur=receveur.groupe_sanguin, donneur=poche.groupe_sanguin):
            raise HTTPException(status_code=409, detail="incompatibilité receveur ↔ poche")

    existing = db.execute(
        select(CrossMatch).where(
            CrossMatch.poche_id == payload.poche_id,
            CrossMatch.receveur_id == payload.receveur_id,
        )
    ).scalar_one_or_none()

    if existing is None:
        row = CrossMatch(
            poche_id=payload.poche_id,
            receveur_id=payload.receveur_id,
            resultat=payload.resultat,
            validateur_id=payload.validateur_id,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    else:
        existing.resultat = payload.resultat
        if payload.validateur_id is not None:
            existing.validateur_id = payload.validateur_id
        db.commit()
        db.refresh(existing)
        row = existing

    din = db.execute(select(Don.din).where(Don.id == poche.don_id)).scalar_one_or_none()
    log_event(
        db,
        aggregate_type="poche",
        aggregate_id=row.poche_id,
        event_type="crossmatch.enregistre",
        payload={
            "poche_id": str(row.poche_id),
            "din": din,
            "receveur_id": str(row.receveur_id),
            "resultat": row.resultat,
            "validateur_id": str(row.validateur_id) if row.validateur_id else None,
        },
    )
    db.commit()
    return row
