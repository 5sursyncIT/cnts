import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_admin, require_staff
from app.core.eligibilite import evaluer_eligibilite
from app.core.security import hash_cni
from app.db.models import CarteDonneur, Don, Donneur, UserAccount
from app.db.session import get_db
from app.schemas.donneurs import DonneurCreate, DonneurOut, DonneurUpdate, EligibiliteOut

router = APIRouter(prefix="/donneurs")


def _apply_donneur_fields(row: Donneur, payload: DonneurCreate) -> None:
    row.nom = payload.nom
    row.prenom = payload.prenom
    row.sexe = payload.sexe
    row.date_naissance = payload.date_naissance
    row.groupe_sanguin = payload.groupe_sanguin
    row.adresse = payload.adresse
    row.region = payload.region
    row.departement = payload.departement
    row.telephone = payload.telephone
    row.email = payload.email
    row.profession = payload.profession


@router.post("", response_model=DonneurOut)
def create_donneur(
    payload: DonneurCreate,
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_staff),
) -> Donneur:
    cni_hash = hash_cni(payload.cni)
    # Le CNI n'est jamais stocké en clair (RGPD) ; seule son empreinte sert à
    # détecter les doublons.
    existing = db.execute(select(Donneur).where(Donneur.cni_hash == cni_hash)).scalar_one_or_none()
    if existing is not None:
        if existing.deleted_at is None:
            # On NE renvoie PAS la fiche existante : cela transformerait cet
            # endpoint en oracle révélant qu'une personne est déjà donneuse.
            raise HTTPException(status_code=409, detail="Un donneur avec ce CNI existe déjà")
        # Réactivation d'un donneur précédemment supprimé (même CNI).
        existing.deleted_at = None
        _apply_donneur_fields(existing, payload)
        db.commit()
        db.refresh(existing)
        return existing

    row = Donneur(cni_hash=cni_hash, dernier_don=None)
    _apply_donneur_fields(row, payload)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[DonneurOut])
def list_donneurs(
    q: str | None = Query(default=None),
    numero_carte: str | None = Query(default=None),
    sexe: str | None = Query(default=None),
    groupe_sanguin: str | None = Query(default=None),
    region: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_staff),
) -> list[Donneur]:
    stmt = select(Donneur).where(Donneur.deleted_at.is_(None))

    if numero_carte:
        # Recherche par numéro de carte donneur (identifiant unique)
        stmt = stmt.join(CarteDonneur, CarteDonneur.donneur_id == Donneur.id).where(
            CarteDonneur.numero_carte.ilike(f"%{numero_carte}%")
        )
    elif q:
        # Search by name, telephone or card number
        name_filter = or_(
            Donneur.nom.ilike(f"%{q}%"),
            Donneur.prenom.ilike(f"%{q}%"),
            Donneur.telephone.ilike(f"%{q}%"),
        )
        carte_subq = select(CarteDonneur.donneur_id).where(
            CarteDonneur.numero_carte.ilike(f"%{q}%")
        )
        stmt = stmt.where(or_(name_filter, Donneur.id.in_(carte_subq)))

    if sexe:
        stmt = stmt.where(Donneur.sexe == sexe)

    if groupe_sanguin:
        stmt = stmt.where(Donneur.groupe_sanguin == groupe_sanguin)

    if region:
        stmt = stmt.where(Donneur.region == region)

    stmt = stmt.options(selectinload(Donneur.carte_donneur))
    # Tri stable (created_at + id) pour une pagination par offset déterministe.
    return list(
        db.execute(
            stmt.order_by(Donneur.created_at.desc(), Donneur.id.desc())
            .offset(offset)
            .limit(limit)
        ).scalars()
    )


@router.get("/{donneur_id}", response_model=DonneurOut)
def get_donneur(
    donneur_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_staff),
) -> Donneur:
    row = db.execute(
        select(Donneur)
        .where(Donneur.id == donneur_id, Donneur.deleted_at.is_(None))
        .options(selectinload(Donneur.carte_donneur))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="donneur not found")
    return row


@router.put("/{donneur_id}", response_model=DonneurOut)
def update_donneur(
    donneur_id: uuid.UUID,
    payload: DonneurUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_staff),
) -> Donneur:
    row = db.get(Donneur, donneur_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=404, detail="donneur not found")

    if payload.cni is not None:
        # Update only the hash, not the plaintext CNI (privacy/GDPR)
        row.cni_hash = hash_cni(payload.cni)

    if payload.nom is not None:
        row.nom = payload.nom
    if payload.prenom is not None:
        row.prenom = payload.prenom
    if payload.sexe is not None:
        row.sexe = payload.sexe
    if payload.date_naissance is not None:
        row.date_naissance = payload.date_naissance
    if payload.groupe_sanguin is not None:
        row.groupe_sanguin = payload.groupe_sanguin
    if payload.adresse is not None:
        row.adresse = payload.adresse
    if payload.telephone is not None:
        row.telephone = payload.telephone
    if payload.email is not None:
        row.email = payload.email
    if payload.region is not None:
        row.region = payload.region
    if payload.departement is not None:
        row.departement = payload.departement
    if payload.profession is not None:
        row.profession = payload.profession

    db.commit()
    db.refresh(row)
    return row


@router.get("/{donneur_id}/eligibilite", response_model=EligibiliteOut)
def eligibilite(
    donneur_id: uuid.UUID,
    as_of: dt.date | None = Query(default=None),
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_staff),
) -> EligibiliteOut:
    row = db.get(Donneur, donneur_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=404, detail="donneur not found")
    ref_date = as_of or dt.date.today()

    last_don = db.execute(
        select(Don)
        .where(Don.donneur_id == donneur_id)
        .order_by(Don.date_don.desc(), Don.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    result = evaluer_eligibilite(
        sexe=row.sexe,
        date_naissance=row.date_naissance,
        dernier_don=row.dernier_don,
        dernier_type_don=last_don.type_don if last_don else None,
        ref_date=ref_date,
    )
    return EligibiliteOut(
        eligible=result.eligible,
        eligible_le=result.eligible_le,
        raison=result.raison,
        delai_jours=result.delai_jours,
        age=result.age,
    )


@router.delete("/{donneur_id}", status_code=204)
def delete_donneur(
    donneur_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_admin),
) -> None:
    row = db.get(Donneur, donneur_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status_code=404, detail="donneur not found")
    # Suppression logique : la fiche et ses dons restent traçables (hémovigilance).
    row.deleted_at = func.now()
    db.commit()
