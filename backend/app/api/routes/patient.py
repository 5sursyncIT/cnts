from datetime import UTC, date, datetime, time, timedelta
from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core import documents_store
from app.core.creneaux import RegleLieu, creneaux_disponibles, erreur_creneau
from app.core.eligibilite import evaluer_eligibilite
from app.core.patient_mail import rdv_confirmation_email, send_patient_email
from app.db.models import (
    CarteDonneur,
    DocumentMedical,
    Don,
    Donneur,
    LieuRdv,
    PointsHistorique,
    RendezVous,
    UserAccount,
)
from app.db.session import get_db
from app.schemas.patient import (
    CartePatientResponse,
    CreneauOut,
    EligibilitePatientOut,
    LieuRdvPublic,
    DocumentMedicalResponse,
    DonneurResponse,
    DonneurUpdate,
    DonPatientResponse,
    RendezVousCreate,
    RendezVousResponse,
)

router = APIRouter(prefix="/me")


def _my_donneur(user: UserAccount) -> Donneur:
    """Dossier donneur du compte connecté ; un dossier supprimé ne donne plus accès à l'espace."""
    donneur = user.donneur
    if donneur is None or donneur.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Donor profile not found for this user")
    return donneur

# --- Profile Management ---


@router.get("", response_model=DonneurResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Get current user's donor profile.
    """
    return _my_donneur(current_user)


@router.put("", response_model=DonneurResponse)
def update_my_profile(
    *,
    db: Session = Depends(get_db),
    profile_in: DonneurUpdate,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Update current user's donor profile.
    """
    donneur = _my_donneur(current_user)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(donneur, field, value)

    db.add(donneur)
    db.commit()
    db.refresh(donneur)
    return donneur


# --- Rendez-vous ----------------------------------------------------------------


def _eligibilite(db: Session, donneur: Donneur, ref_date: date):
    """Éligibilité à une date donnée, d'après le dernier don connu (dossier ou historique)."""
    dernier = db.execute(
        select(Don).where(Don.donneur_id == donneur.id).order_by(Don.date_don.desc(), Don.created_at.desc()).limit(1)
    ).scalar_one_or_none()
    dates = [d for d in (donneur.dernier_don, dernier.date_don if dernier else None) if d is not None]
    return evaluer_eligibilite(
        sexe=donneur.sexe,
        date_naissance=donneur.date_naissance,
        dernier_don=max(dates) if dates else None,
        dernier_type_don=dernier.type_don if dernier else None,
        ref_date=ref_date,
    )


def _lieu_actif(db: Session, lieu_id: UUID, *, verrou: bool = False) -> LieuRdv:
    stmt = select(LieuRdv).where(LieuRdv.id == lieu_id, LieuRdv.actif.is_(True))
    if verrou:
        # Sérialise les réservations d'un même lieu : la capacité ne peut pas être dépassée.
        stmt = stmt.with_for_update()
    lieu = db.execute(stmt).scalar_one_or_none()
    if lieu is None:
        raise HTTPException(status_code=404, detail="Lieu de rendez-vous introuvable")
    return lieu


def _occupation(db: Session, lieu_id: UUID, debut: datetime, fin: datetime) -> dict[datetime, int]:
    rows = db.execute(
        select(RendezVous.date_prevue, func.count())
        .where(
            RendezVous.lieu_id == lieu_id,
            RendezVous.statut.in_(("CONFIRME", "EFFECTUE")),
            RendezVous.date_prevue >= debut,
            RendezVous.date_prevue < fin,
        )
        .group_by(RendezVous.date_prevue)
    ).all()
    # SQLite renvoie des datetimes naïfs : tout est ramené en UTC.
    return {(d if d.tzinfo else d.replace(tzinfo=UTC)).astimezone(UTC): n for d, n in rows}


def _fr(d: datetime) -> str:
    jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
    mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    return f"{jours[d.weekday()]} {d.day} {mois[d.month - 1]} {d.year} à {d.strftime('%Hh%M')}"


@router.get("/rdv/lieux", response_model=list[LieuRdvPublic])
def list_rdv_places(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Lieux où prendre rendez-vous en ligne."""
    _my_donneur(current_user)
    return db.execute(select(LieuRdv).where(LieuRdv.actif.is_(True)).order_by(LieuRdv.nom)).scalars().all()


@router.get("/rdv/creneaux", response_model=list[CreneauOut])
def list_rdv_slots(
    lieu_id: UUID,
    jour: date,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Créneaux encore libres d'un lieu pour un jour donné (heure de Dakar = UTC)."""
    _my_donneur(current_user)
    lieu = _lieu_actif(db, lieu_id)
    debut = datetime.combine(jour, time.min, tzinfo=UTC)
    occupes = _occupation(db, lieu.id, debut, debut + timedelta(days=1))
    creneaux = creneaux_disponibles(RegleLieu.depuis(lieu), jour, datetime.now(UTC), occupes)
    return [CreneauOut(debut=d, places=n) for d, n in creneaux]


@router.get("/eligibilite", response_model=EligibilitePatientOut)
def my_eligibility(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Éligibilité au don aujourd'hui et date à partir de laquelle un rendez-vous est possible."""
    e = _eligibilite(db, _my_donneur(current_user), datetime.now(UTC).date())
    return EligibilitePatientOut(eligible=e.eligible, eligible_le=e.eligible_le, raison=e.raison)


@router.get("/appointments", response_model=list[RendezVousResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Mes rendez-vous, du plus récent au plus ancien."""
    donneur = _my_donneur(current_user)
    query = select(RendezVous).where(RendezVous.donneur_id == donneur.id)
    query = query.order_by(RendezVous.date_prevue.desc()).offset(skip).limit(limit)
    return db.execute(query).scalars().all()


@router.post("/appointments", response_model=RendezVousResponse)
def create_appointment(
    *,
    db: Session = Depends(get_db),
    rdv_in: RendezVousCreate,
    background: BackgroundTasks,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Réserve un créneau : lieu ouvert, place libre, donneur éligible à cette date, un seul RDV à venir."""
    donneur = _my_donneur(current_user)
    now = datetime.now(UTC)
    debut = rdv_in.date_prevue if rdv_in.date_prevue.tzinfo else rdv_in.date_prevue.replace(tzinfo=UTC)
    debut = debut.astimezone(UTC)

    lieu = _lieu_actif(db, rdv_in.lieu_id, verrou=True)
    regle = RegleLieu.depuis(lieu)
    if (erreur := erreur_creneau(regle, debut, now)) is not None:
        raise HTTPException(status_code=422, detail=erreur)

    a_venir = db.execute(
        select(RendezVous)
        .where(RendezVous.donneur_id == donneur.id, RendezVous.statut == "CONFIRME", RendezVous.date_prevue > now)
        .limit(1)
    ).scalar_one_or_none()
    if a_venir is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Vous avez déjà un rendez-vous le {_fr(a_venir.date_prevue)}. Annulez-le pour en prendre un autre.",
        )

    elig = _eligibilite(db, donneur, debut.date())
    if not elig.eligible:
        detail = elig.raison
        if elig.eligible_le:
            detail += f" : vous pourrez donner à partir du {elig.eligible_le.strftime('%d/%m/%Y')}."
        raise HTTPException(status_code=422, detail=detail)

    if _occupation(db, lieu.id, debut, debut + timedelta(seconds=1)).get(debut, 0) >= regle.capacite_creneau:
        raise HTTPException(status_code=409, detail="Ce créneau vient d'être complété. Choisissez-en un autre.")

    rdv = RendezVous(
        donneur_id=donneur.id,
        date_prevue=debut,
        type_rdv=rdv_in.type_rdv,
        lieu_id=lieu.id,
        lieu=lieu.nom,
        commentaire=rdv_in.commentaire,
        statut="CONFIRME",
    )
    db.add(rdv)
    db.commit()
    db.refresh(rdv)
    if current_user.email_verified_at is not None:
        subject, body = rdv_confirmation_email(donneur.prenom, _fr(debut), lieu.nom, lieu.adresse)
        background.add_task(send_patient_email, current_user.email, subject, body)
    return rdv


@router.put("/appointments/{id}", response_model=RendezVousResponse)
def cancel_appointment(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Annule un de mes rendez-vous confirmés et encore à venir."""
    donneur = _my_donneur(current_user)
    rdv = db.get(RendezVous, id)
    if not rdv or rdv.donneur_id != donneur.id:
        raise HTTPException(status_code=404, detail="Appointment not found")
    date_prevue = rdv.date_prevue if rdv.date_prevue.tzinfo else rdv.date_prevue.replace(tzinfo=UTC)
    if rdv.statut != "CONFIRME" or date_prevue <= datetime.now(UTC):
        raise HTTPException(status_code=409, detail="Seul un rendez-vous confirmé et à venir peut être annulé.")

    rdv.statut = "ANNULE"
    rdv.motif = "Annulé par le donneur"
    db.commit()
    db.refresh(rdv)
    return rdv


# --- Documents remis par le centre --------------------------------------------------


def _document_out(doc: DocumentMedical) -> DocumentMedicalResponse:
    return DocumentMedicalResponse(
        id=doc.id,
        titre=doc.titre,
        type_document=doc.type_document,
        description=doc.description,
        date_document=doc.date_document,
        fichier_url=f"/api/me/documents/{doc.id}/fichier" if doc.fichier_cle else (doc.fichier_url or ""),
        fichier_nom=doc.fichier_nom,
        mime=doc.mime,
        taille=doc.taille,
        created_at=doc.created_at,
    )


@router.get("/documents", response_model=list[DocumentMedicalResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Documents remis par le centre (attestations, certificats…). Jamais de résultat d'analyse."""
    donneur = _my_donneur(current_user)
    query = (
        select(DocumentMedical)
        .where(DocumentMedical.donneur_id == donneur.id, DocumentMedical.type_document != "ANALYSE")
        .order_by(DocumentMedical.date_document.desc())
        .offset(skip)
        .limit(limit)
    )
    return [_document_out(d) for d in db.execute(query).scalars().all()]


@router.get("/documents/{doc_id}/fichier")
def download_my_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> FileResponse:
    donneur = _my_donneur(current_user)
    doc = db.get(DocumentMedical, doc_id)
    if doc is None or doc.donneur_id != donneur.id or not doc.fichier_cle or doc.type_document == "ANALYSE":
        raise HTTPException(status_code=404, detail="Document introuvable")
    path = documents_store.chemin(doc.fichier_cle)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Document introuvable")
    return FileResponse(path, media_type=doc.mime or "application/octet-stream", filename=doc.fichier_nom or path.name)


# --- Dons & carte donneur ---


@router.get("/dons", response_model=list[DonPatientResponse])
def get_my_donations(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Historique des dons du donneur connecté (date et type uniquement).
    """
    donneur = _my_donneur(current_user)

    query = select(Don).where(Don.donneur_id == donneur.id)
    query = query.order_by(Don.date_don.desc()).offset(skip).limit(limit)
    return db.execute(query).scalars().all()


@router.get("/carte", response_model=CartePatientResponse)
def get_my_card(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Carte de fidélité du donneur connecté et ses 20 derniers mouvements de points.
    """
    donneur = _my_donneur(current_user)

    carte = db.execute(
        select(CarteDonneur).where(CarteDonneur.donneur_id == donneur.id)
    ).scalar_one_or_none()
    if carte is None:
        raise HTTPException(status_code=404, detail="Aucune carte donneur")

    historique = (
        db.execute(
            select(PointsHistorique)
            .where(PointsHistorique.carte_id == carte.id)
            .order_by(PointsHistorique.created_at.desc())
            .limit(20)
        )
        .scalars()
        .all()
    )
    return CartePatientResponse(
        numero_carte=carte.numero_carte,
        niveau=carte.niveau,
        points=carte.points,
        total_dons=carte.total_dons,
        date_premier_don=carte.date_premier_don,
        date_dernier_don=carte.date_dernier_don,
        is_active=carte.is_active,
        historique=historique,
    )
