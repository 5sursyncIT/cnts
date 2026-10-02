"""Rendez-vous des donneurs vus par le centre, lieux de rendez-vous et documents remis aux donneurs."""

import datetime as dt
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import require_admin, require_staff
from app.audit.events import log_event
from app.core import documents_store
from app.core.patient_mail import rdv_annulation_email, send_patient_email
from app.db.models import DocumentMedical, Donneur, LieuRdv, RendezVous, UserAccount
from app.db.session import get_db
from app.schemas.patient import TYPES_DOCUMENT
from app.schemas.rendez_vous import (
    DocumentStaffOut,
    LieuRdvIn,
    LieuRdvOut,
    RendezVousStaffOut,
    RendezVousStatutIn,
)

router = APIRouter()
UTC = dt.timezone.utc


def _aware(value: dt.datetime) -> dt.datetime:
    return value if value.tzinfo else value.replace(tzinfo=UTC)


def _fr(d: dt.datetime) -> str:
    return d.astimezone(UTC).strftime("%d/%m/%Y à %Hh%M")


# --- Rendez-vous ---------------------------------------------------------------------


@router.get("/rendez-vous", response_model=list[RendezVousStaffOut])
def list_rendez_vous(
    du: dt.date | None = None,
    au: dt.date | None = None,
    lieu_id: uuid.UUID | None = None,
    statut: str | None = Query(default=None, pattern="^(CONFIRME|EFFECTUE|MANQUE|ANNULE)$"),
    donneur_id: uuid.UUID | None = None,
    q: str | None = Query(default=None, max_length=100),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[RendezVous]:
    """RDV pris en ligne. Sans dates (et sans donneur), affiche aujourd'hui et les 7 jours suivants."""
    stmt = select(RendezVous).join(Donneur).options(joinedload(RendezVous.donneur))
    if donneur_id is None and du is None and au is None:
        du = dt.datetime.now(UTC).date()
        au = du + dt.timedelta(days=7)
    if du is not None:
        stmt = stmt.where(RendezVous.date_prevue >= dt.datetime.combine(du, dt.time.min, tzinfo=UTC))
    if au is not None:
        stmt = stmt.where(RendezVous.date_prevue < dt.datetime.combine(au + dt.timedelta(days=1), dt.time.min, tzinfo=UTC))
    if lieu_id is not None:
        stmt = stmt.where(RendezVous.lieu_id == lieu_id)
    if statut is not None:
        stmt = stmt.where(RendezVous.statut == statut)
    if donneur_id is not None:
        stmt = stmt.where(RendezVous.donneur_id == donneur_id)
    if q:
        motif = f"%{q.strip()}%"
        stmt = stmt.where(or_(Donneur.nom.ilike(motif), Donneur.prenom.ilike(motif), Donneur.telephone.ilike(motif)))
    order = RendezVous.date_prevue.desc() if donneur_id is not None else RendezVous.date_prevue.asc()
    return db.execute(stmt.order_by(order).offset(offset).limit(limit)).scalars().unique().all()


@router.patch("/rendez-vous/{rdv_id}", response_model=RendezVousStaffOut)
def update_rendez_vous_statut(
    rdv_id: uuid.UUID,
    payload: RendezVousStatutIn,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: UserAccount = Depends(require_staff),
) -> RendezVous:
    """Suivi d'un RDV confirmé : EFFECTUE / MANQUE (jour même ou passé) ou ANNULE (avec motif)."""
    rdv = db.get(RendezVous, rdv_id)
    if rdv is None:
        raise HTTPException(status_code=404, detail="Rendez-vous introuvable")
    if rdv.statut != "CONFIRME":
        raise HTTPException(status_code=409, detail="Ce rendez-vous a déjà été traité.")
    date_prevue = _aware(rdv.date_prevue)
    now = dt.datetime.now(UTC)
    if payload.statut in ("EFFECTUE", "MANQUE") and date_prevue.date() > now.date():
        raise HTTPException(status_code=409, detail="Un rendez-vous à venir ne peut pas être marqué effectué ou manqué.")
    if payload.statut == "ANNULE" and not (payload.motif or "").strip():
        raise HTTPException(status_code=422, detail="Indiquez le motif de l'annulation (il est communiqué au donneur).")

    rdv.statut = payload.statut
    rdv.motif = (payload.motif or "").strip() or None
    rdv.traite_par_id = user.id
    rdv.traite_le = now
    log_event(
        db,
        aggregate_type="rendez_vous",
        aggregate_id=rdv.id,
        event_type=f"rendez_vous.{payload.statut.lower()}",
        payload={"par": str(user.id), "motif": rdv.motif},
    )
    db.commit()
    db.refresh(rdv)

    compte = rdv.donneur.user
    if payload.statut == "ANNULE" and date_prevue > now and compte is not None and compte.email_verified_at is not None:
        subject, body = rdv_annulation_email(rdv.donneur.prenom, _fr(date_prevue), rdv.lieu or "", rdv.motif)
        background.add_task(send_patient_email, compte.email, subject, body)
    return rdv


# --- Lieux de rendez-vous -----------------------------------------------------------


@router.get("/rendez-vous/lieux", response_model=list[LieuRdvOut])
def list_lieux(db: Session = Depends(get_db)) -> list[LieuRdv]:
    return db.execute(select(LieuRdv).order_by(LieuRdv.nom)).scalars().all()


def _apply_lieu(lieu: LieuRdv, payload: LieuRdvIn) -> None:
    data = payload.model_dump()
    data["fermetures"] = sorted({d.isoformat() for d in payload.fermetures})
    for field, value in data.items():
        setattr(lieu, field, value)


@router.post("/rendez-vous/lieux", response_model=LieuRdvOut, status_code=201, dependencies=[Depends(require_admin)])
def create_lieu(payload: LieuRdvIn, db: Session = Depends(get_db)) -> LieuRdv:
    if db.execute(select(LieuRdv).where(LieuRdv.code == payload.code)).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ce code de lieu existe déjà")
    lieu = LieuRdv()
    _apply_lieu(lieu, payload)
    db.add(lieu)
    db.commit()
    db.refresh(lieu)
    return lieu


@router.put("/rendez-vous/lieux/{lieu_id}", response_model=LieuRdvOut, dependencies=[Depends(require_admin)])
def update_lieu(lieu_id: uuid.UUID, payload: LieuRdvIn, db: Session = Depends(get_db)) -> LieuRdv:
    """Les RDV déjà pris restent valables même si les horaires ou la capacité changent."""
    lieu = db.get(LieuRdv, lieu_id)
    if lieu is None:
        raise HTTPException(status_code=404, detail="Lieu introuvable")
    doublon = db.execute(select(LieuRdv).where(LieuRdv.code == payload.code, LieuRdv.id != lieu_id)).scalar_one_or_none()
    if doublon:
        raise HTTPException(status_code=409, detail="Ce code de lieu existe déjà")
    _apply_lieu(lieu, payload)
    db.commit()
    db.refresh(lieu)
    return lieu


# --- Documents remis au donneur -------------------------------------------------------


def _donneur(db: Session, donneur_id: uuid.UUID) -> Donneur:
    donneur = db.get(Donneur, donneur_id)
    if donneur is None or donneur.deleted_at is not None:
        raise HTTPException(status_code=404, detail="donneur not found")
    return donneur


def _document(db: Session, donneur_id: uuid.UUID, doc_id: uuid.UUID) -> DocumentMedical:
    doc = db.get(DocumentMedical, doc_id)
    if doc is None or doc.donneur_id != donneur_id:
        raise HTTPException(status_code=404, detail="Document introuvable")
    return doc


@router.get("/donneurs/{donneur_id}/documents", response_model=list[DocumentStaffOut])
def list_documents(donneur_id: uuid.UUID, db: Session = Depends(get_db)) -> list[DocumentMedical]:
    _donneur(db, donneur_id)
    return (
        db.execute(
            select(DocumentMedical)
            .where(DocumentMedical.donneur_id == donneur_id)
            .order_by(DocumentMedical.date_document.desc(), DocumentMedical.created_at.desc())
        )
        .scalars()
        .all()
    )


@router.post("/donneurs/{donneur_id}/documents", response_model=DocumentStaffOut, status_code=201)
async def upload_document(
    donneur_id: uuid.UUID,
    titre: str = Form(..., min_length=2, max_length=200),
    type_document: str = Form(...),
    date_document: dt.date = Form(...),
    description: str | None = Form(default=None, max_length=2000),
    fichier: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: UserAccount = Depends(require_staff),
) -> DocumentMedical:
    """Dépose un document visible par le donneur dans son espace (jamais de résultat d'analyse)."""
    if type_document not in TYPES_DOCUMENT:
        raise HTTPException(status_code=422, detail=f"Type de document invalide ({', '.join(TYPES_DOCUMENT)})")
    _donneur(db, donneur_id)
    cle, mime, taille = await documents_store.enregistrer(fichier)
    try:
        doc = DocumentMedical(
            donneur_id=donneur_id,
            titre=titre.strip(),
            type_document=type_document,
            date_document=date_document,
            description=(description or "").strip() or None,
            fichier_url="",
            fichier_cle=cle,
            fichier_nom=(fichier.filename or cle)[-255:],
            mime=mime,
            taille=taille,
            ajoute_par_id=user.id,
        )
        db.add(doc)
        log_event(db, aggregate_type="donneur", aggregate_id=donneur_id, event_type="document.ajoute",
                  payload={"titre": doc.titre, "type": type_document, "par": str(user.id)})
        db.commit()
    except Exception:
        db.rollback()
        documents_store.supprimer(cle)
        raise
    db.refresh(doc)
    return doc


@router.get("/donneurs/{donneur_id}/documents/{doc_id}/fichier")
def download_document(donneur_id: uuid.UUID, doc_id: uuid.UUID, db: Session = Depends(get_db)) -> FileResponse:
    doc = _document(db, donneur_id, doc_id)
    if not doc.fichier_cle or not documents_store.chemin(doc.fichier_cle).exists():
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return FileResponse(documents_store.chemin(doc.fichier_cle), media_type=doc.mime or "application/octet-stream",
                        filename=doc.fichier_nom or doc.fichier_cle)


@router.delete("/donneurs/{donneur_id}/documents/{doc_id}", status_code=204)
def delete_document(
    donneur_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: UserAccount = Depends(require_staff),
) -> None:
    doc = _document(db, donneur_id, doc_id)
    cle = doc.fichier_cle
    log_event(db, aggregate_type="donneur", aggregate_id=donneur_id, event_type="document.supprime",
              payload={"titre": doc.titre, "par": str(user.id)})
    db.delete(doc)
    db.commit()
    documents_store.supprimer(cle)
