import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.core.config import settings
from app.db.models import UserAccount
from app.core.idempotency import get_idempotent_response, store_idempotent_response
from app.db.models import ColdChainReading, ColdChainStorage, Don, FractionnementRecette, Poche, ProductRule
from app.db.session import get_db
from app.schemas.stock import (
    ColdChainAlertOut,
    ColdChainReadingCreate,
    ColdChainReadingOut,
    ColdChainStorageCreate,
    ColdChainStorageOut,
    ColdChainStorageUpdate,
    FractionnementComposant,
    FractionnementCreate,
    FractionnementDepuisRecetteCreate,
    FractionnementOut,
    PocheOut,
    RecetteFractionnementOut,
    RecetteFractionnementUpsert,
    RecetteComposant,
    ProductRuleOut,
    ProductRuleUpdate,
)

router = APIRouter(prefix="/stock")


def _get_product_rule(db: Session, type_produit: str) -> ProductRule:
    rule = db.get(ProductRule, type_produit)
    if rule is None:
        defaults: dict[str, dict] = {
            "ST": {"shelf_life_days": 35, "default_volume_ml": 450, "min_volume_ml": 350, "max_volume_ml": 550},
            "CGR": {"shelf_life_days": 42, "default_volume_ml": 280, "min_volume_ml": 200, "max_volume_ml": 400},
            "PFC": {"shelf_life_days": 365, "default_volume_ml": 200, "min_volume_ml": 120, "max_volume_ml": 400},
            "CP": {"shelf_life_days": 5, "default_volume_ml": 60, "min_volume_ml": 40, "max_volume_ml": 120},
        }
        seed = defaults.get(type_produit)
        if seed is None:
            raise HTTPException(status_code=400, detail=f"règle produit manquante: {type_produit}")
        rule = ProductRule(type_produit=type_produit, **seed)
        db.add(rule)
        db.commit()
        return rule
    return rule


def _peremption_produit(db: Session, *, type_produit: str, date_don: dt.date) -> dt.date:
    rule = _get_product_rule(db, type_produit)
    return date_don + dt.timedelta(days=rule.shelf_life_days)


def _do_fractionnement(
    db: Session,
    *,
    source: Poche,
    don: Don,
    composants: list[FractionnementComposant],
    recipe_code: str | None,
) -> dict:
    if not composants:
        raise HTTPException(status_code=400, detail="composants requis")

    created: list[Poche] = []
    total_volume = 0
    for comp in composants:
        rule = _get_product_rule(db, comp.type_produit)
        volume = comp.volume_ml if comp.volume_ml is not None else rule.default_volume_ml
        if volume is None:
            raise HTTPException(status_code=400, detail=f"volume_ml requis pour {comp.type_produit}")
        if rule.min_volume_ml is not None and volume < rule.min_volume_ml:
            raise HTTPException(status_code=400, detail=f"volume_ml trop bas pour {comp.type_produit}")
        if rule.max_volume_ml is not None and volume > rule.max_volume_ml:
            raise HTTPException(status_code=400, detail=f"volume_ml trop haut pour {comp.type_produit}")
        total_volume += volume
        p = Poche(
            don_id=source.don_id,
            source_poche_id=source.id,
            type_produit=comp.type_produit,
            groupe_sanguin=source.groupe_sanguin,
            volume_ml=volume,
            date_peremption=_peremption_produit(db, type_produit=comp.type_produit, date_don=don.date_don),
            emplacement_stock="STOCK",
            statut_stock="EN_STOCK",
            statut_distribution="DISPONIBLE" if don.statut_qualification == "LIBERE" else "NON_DISTRIBUABLE",
        )
        db.add(p)
        created.append(p)

    perte_ml: int | None = None
    if source.volume_ml is not None:
        if total_volume > (source.volume_ml + settings.fractionnement_max_overage_ml):
            raise HTTPException(status_code=409, detail="volume composants incohérent vs volume source")
        perte_ml = int(source.volume_ml - total_volume)

    source.statut_stock = "FRACTIONNEE"
    source.emplacement_stock = "FRACTIONNEMENT"

    db.commit()
    for p in created:
        db.refresh(p)

    payload: dict = {
        "source_poche_id": str(source.id),
        "din": don.din,
        "volume_source_ml": source.volume_ml,
        "volume_composants_ml": total_volume,
        "perte_ml": perte_ml,
        "poches_creees": [{"id": str(p.id), "type_produit": p.type_produit} for p in created],
    }
    if recipe_code is not None:
        payload["recette_code"] = recipe_code

    log_event(
        db,
        aggregate_type="poche",
        aggregate_id=source.id,
        event_type="poche.fractionnee",
        payload=payload,
    )
    db.commit()

    return FractionnementOut(
        source_poche_id=source.id,
        perte_ml=perte_ml,
        poches_creees=[PocheOut.model_validate(p) for p in created],
    ).model_dump(mode="json")


def _expand_recette_composants(recette: FractionnementRecette) -> list[FractionnementComposant]:
    if not isinstance(recette.composants, list):
        raise HTTPException(status_code=409, detail="recette invalide: composants")

    expanded: list[FractionnementComposant] = []
    for item in recette.composants:
        comp = RecetteComposant.model_validate(item)
        for _ in range(comp.quantite):
            expanded.append(
                FractionnementComposant(type_produit=comp.type_produit, volume_ml=comp.volume_ml)
            )
    return expanded



@router.get("/regles")
def list_regles(db: Session = Depends(get_db)) -> list[dict]:
    rows = list(db.execute(select(ProductRule).order_by(ProductRule.type_produit.asc())).scalars())
    return [
        {
            "type_produit": r.type_produit,
            "shelf_life_days": r.shelf_life_days,
            "default_volume_ml": r.default_volume_ml,
            "min_volume_ml": r.min_volume_ml,
            "max_volume_ml": r.max_volume_ml,
        }
        for r in rows
    ]


@router.put("/regles/{type_produit}")
def upsert_regle(
    type_produit: str,
    payload: dict,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> dict:
    shelf_life_days = payload.get("shelf_life_days")
    if not isinstance(shelf_life_days, int) or shelf_life_days <= 0:
        raise HTTPException(status_code=400, detail="shelf_life_days requis (int > 0)")

    def _opt_int(key: str) -> int | None:
        v = payload.get(key)
        if v is None:
            return None
        if not isinstance(v, int):
            raise HTTPException(status_code=400, detail=f"{key} doit être un int")
        return v

    default_volume_ml = _opt_int("default_volume_ml")
    min_volume_ml = _opt_int("min_volume_ml")
    max_volume_ml = _opt_int("max_volume_ml")
    if min_volume_ml is not None and max_volume_ml is not None and min_volume_ml > max_volume_ml:
        raise HTTPException(status_code=400, detail="min_volume_ml > max_volume_ml")

    row = db.get(ProductRule, type_produit)
    if row is None:
        row = ProductRule(type_produit=type_produit, shelf_life_days=shelf_life_days)
        db.add(row)
    row.shelf_life_days = shelf_life_days
    row.default_volume_ml = default_volume_ml
    row.min_volume_ml = min_volume_ml
    row.max_volume_ml = max_volume_ml
    db.commit()
    return {
        "type_produit": row.type_produit,
        "shelf_life_days": row.shelf_life_days,
        "default_volume_ml": row.default_volume_ml,
        "min_volume_ml": row.min_volume_ml,
        "max_volume_ml": row.max_volume_ml,
    }


@router.get("/poches", response_model=list[PocheOut])
def list_poches(
    type_produit: str | None = Query(default=None),
    statut_stock: str = Query(default="EN_STOCK"),
    db: Session = Depends(get_db),
) -> list[Poche]:
    stmt = select(Poche).where(Poche.statut_stock == statut_stock)
    if type_produit is not None:
        stmt = stmt.where(Poche.type_produit == type_produit)
    stmt = stmt.order_by(Poche.date_peremption.asc()).limit(200)
    return list(db.execute(stmt).scalars())


@router.post("/fractionnements", response_model=FractionnementOut)
def fractionner(
    payload: FractionnementCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> JSONResponse | dict:
    scope = "fractionnement"
    if payload.idempotency_key:
        hit = get_idempotent_response(
            db,
            scope=scope,
            key=payload.idempotency_key,
            payload=payload.model_dump(),
        )
        if hit is not None:
            return JSONResponse(status_code=hit.status_code, content=hit.response_json)

    source = db.get(Poche, payload.source_poche_id)
    if source is None:
        raise HTTPException(status_code=404, detail="poche source introuvable")
    if source.type_produit != "ST":
        raise HTTPException(status_code=409, detail="seul ST est fractionnable")
    if source.statut_stock != "EN_STOCK":
        raise HTTPException(status_code=409, detail="poche source non disponible")

    don = db.get(Don, source.don_id)
    if don is None:
        raise HTTPException(status_code=409, detail="don introuvable")

    response = _do_fractionnement(db, source=source, don=don, composants=payload.composants, recipe_code=None)

    if payload.idempotency_key:
        store_idempotent_response(
            db,
            scope=scope,
            key=payload.idempotency_key,
            payload=payload.model_dump(),
            status_code=201,
            response_json=response,
        )
        db.commit()
        return JSONResponse(status_code=201, content=response)

    return response


@router.get("/regles", response_model=list[ProductRuleOut])
def list_product_rules(db: Session = Depends(get_db)) -> list[ProductRule]:
    # Ensure default rules exist
    defaults = ["ST", "CGR", "PFC", "CP"]
    for type_produit in defaults:
        _get_product_rule(db, type_produit)
    
    stmt = select(ProductRule).order_by(ProductRule.type_produit)
    return list(db.execute(stmt).scalars())


@router.put("/regles/{type_produit}", response_model=ProductRuleOut)
def update_product_rule(
    type_produit: str,
    payload: ProductRuleUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ProductRule:
    rule = _get_product_rule(db, type_produit)
    rule.shelf_life_days = payload.shelf_life_days
    rule.default_volume_ml = payload.default_volume_ml
    rule.min_volume_ml = payload.min_volume_ml
    rule.max_volume_ml = payload.max_volume_ml
    rule.isbt_product_code = payload.isbt_product_code
    
    db.commit()
    db.refresh(rule)
    
    log_event(
        db,
        aggregate_type="system",
        aggregate_id=uuid.uuid4(),
        event_type="product_rule.updated",
        payload={"type_produit": type_produit, "changes": payload.model_dump()},
    )
    db.commit()
    
    return rule


@router.get("/recettes", response_model=list[RecetteFractionnementOut])
def list_recettes(
    site_code: str | None = Query(default=None, max_length=32),
    actif: bool = Query(default=True),
    inclure_globales: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> list[FractionnementRecette]:
    stmt = select(FractionnementRecette)
    if actif:
        stmt = stmt.where(FractionnementRecette.actif.is_(True))
    if site_code is not None:
        if inclure_globales:
            stmt = stmt.where(
                (FractionnementRecette.site_code == site_code)
                | (FractionnementRecette.site_code.is_(None))
            )
        else:
            stmt = stmt.where(FractionnementRecette.site_code == site_code)
    stmt = stmt.order_by(FractionnementRecette.code.asc()).limit(200)
    return list(db.execute(stmt).scalars())


@router.get("/recettes/{code}", response_model=RecetteFractionnementOut)
def get_recette(code: str, db: Session = Depends(get_db)) -> FractionnementRecette:
    row = db.get(FractionnementRecette, code)
    if row is None:
        raise HTTPException(status_code=404, detail="recette introuvable")
    return row


@router.put("/recettes/{code}", response_model=RecetteFractionnementOut)
def upsert_recette(
    code: str,
    payload: RecetteFractionnementUpsert,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> FractionnementRecette:
    for c in payload.composants:
        _get_product_rule(db, c.type_produit)

    row = db.get(FractionnementRecette, code)
    if row is None:
        row = FractionnementRecette(code=code, composants=[])
        db.add(row)

    row.libelle = payload.libelle
    row.actif = payload.actif
    row.site_code = payload.site_code
    row.type_source = payload.type_source
    row.composants = [c.model_dump(mode="json") for c in payload.composants]
    db.commit()
    db.refresh(row)
    return row


@router.delete("/recettes/{code}")
def disable_recette(
    code: str,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> dict:
    row = db.get(FractionnementRecette, code)
    if row is None:
        raise HTTPException(status_code=404, detail="recette introuvable")
    row.actif = False
    db.commit()
    return {"code": row.code, "actif": row.actif}


@router.post("/fractionnements/recette/{code}", response_model=FractionnementOut)
def fractionner_depuis_recette(
    code: str,
    payload: FractionnementDepuisRecetteCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> JSONResponse | dict:
    scope = f"fractionnement_recette:{code}"
    if payload.idempotency_key:
        hit = get_idempotent_response(
            db,
            scope=scope,
            key=payload.idempotency_key,
            payload=payload.model_dump(),
        )
        if hit is not None:
            return JSONResponse(status_code=hit.status_code, content=hit.response_json)

    recette = db.get(FractionnementRecette, code)
    if recette is None:
        raise HTTPException(status_code=404, detail="recette introuvable")
    if not recette.actif:
        raise HTTPException(status_code=409, detail="recette inactive")

    source = db.get(Poche, payload.source_poche_id)
    if source is None:
        raise HTTPException(status_code=404, detail="poche source introuvable")
    if source.type_produit != recette.type_source:
        raise HTTPException(status_code=409, detail="type source incompatible avec la recette")
    if source.statut_stock != "EN_STOCK":
        raise HTTPException(status_code=409, detail="poche source non disponible")

    don = db.get(Don, source.don_id)
    if don is None:
        raise HTTPException(status_code=409, detail="don introuvable")

    composants = _expand_recette_composants(recette)
    response = _do_fractionnement(db, source=source, don=don, composants=composants, recipe_code=recette.code)

    if payload.idempotency_key:
        store_idempotent_response(
            db,
            scope=scope,
            key=payload.idempotency_key,
            payload=payload.model_dump(),
            status_code=201,
            response_json=response,
        )
        db.commit()
        return JSONResponse(status_code=201, content=response)

    return response


@router.get("/cold-chain/storages", response_model=list[ColdChainStorageOut])
def list_cold_chain_storages(
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ColdChainStorage]:
    stmt = select(ColdChainStorage)
    if is_active is not None:
        stmt = stmt.where(ColdChainStorage.is_active.is_(is_active))
    stmt = stmt.order_by(ColdChainStorage.code.asc())
    return list(db.execute(stmt).scalars())


@router.get("/cold-chain/storages/{storage_id}", response_model=ColdChainStorageOut)
def get_cold_chain_storage(
    storage_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ColdChainStorage:
    row = db.get(ColdChainStorage, storage_id)
    if row is None:
        raise HTTPException(status_code=404, detail="stockage introuvable")
    return row


@router.post("/cold-chain/storages", response_model=ColdChainStorageOut, status_code=201)
def create_cold_chain_storage(
    payload: ColdChainStorageCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ColdChainStorage:
    if payload.min_temp >= payload.max_temp:
        raise HTTPException(status_code=400, detail="min_temp doit être < max_temp")
    existing = db.execute(
        select(ColdChainStorage).where(ColdChainStorage.code == payload.code)
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="code déjà utilisé")
    row = ColdChainStorage(
        code=payload.code,
        name=payload.name,
        location=payload.location,
        min_temp=payload.min_temp,
        max_temp=payload.max_temp,
        is_active=payload.is_active,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/cold-chain/storages/{storage_id}", response_model=ColdChainStorageOut)
def update_cold_chain_storage(
    storage_id: uuid.UUID,
    payload: ColdChainStorageUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ColdChainStorage:
    row = db.get(ColdChainStorage, storage_id)
    if row is None:
        raise HTTPException(status_code=404, detail="stockage introuvable")
    if payload.code is not None and payload.code != row.code:
        existing = db.execute(
            select(ColdChainStorage).where(ColdChainStorage.code == payload.code)
        ).scalar_one_or_none()
        if existing is not None:
            raise HTTPException(status_code=409, detail="code déjà utilisé")
        row.code = payload.code
    if payload.name is not None:
        row.name = payload.name
    if payload.location is not None:
        row.location = payload.location
    if payload.is_active is not None:
        row.is_active = payload.is_active
    new_min = row.min_temp if payload.min_temp is None else payload.min_temp
    new_max = row.max_temp if payload.max_temp is None else payload.max_temp
    if new_min >= new_max:
        raise HTTPException(status_code=400, detail="min_temp doit être < max_temp")
    row.min_temp = new_min
    row.max_temp = new_max
    db.commit()
    db.refresh(row)
    return row


@router.get("/cold-chain/readings", response_model=list[ColdChainReadingOut])
def list_cold_chain_readings(
    storage_id: uuid.UUID | None = Query(default=None),
    start: dt.datetime | None = Query(default=None),
    end: dt.datetime | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[ColdChainReading]:
    stmt = select(ColdChainReading)
    if storage_id is not None:
        stmt = stmt.where(ColdChainReading.storage_id == storage_id)
    if start is not None:
        stmt = stmt.where(ColdChainReading.recorded_at >= start)
    if end is not None:
        stmt = stmt.where(ColdChainReading.recorded_at <= end)
    stmt = stmt.order_by(ColdChainReading.recorded_at.desc()).limit(limit)
    return list(db.execute(stmt).scalars())


@router.post("/cold-chain/readings", response_model=ColdChainReadingOut, status_code=201)
def create_cold_chain_reading(
    payload: ColdChainReadingCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ColdChainReading:
    storage = db.get(ColdChainStorage, payload.storage_id)
    if storage is None:
        raise HTTPException(status_code=404, detail="stockage introuvable")
    recorded_at = payload.recorded_at or dt.datetime.now(dt.timezone.utc)
    row = ColdChainReading(
        storage_id=payload.storage_id,
        temperature_c=payload.temperature_c,
        recorded_at=recorded_at,
        source=payload.source,
        note=payload.note,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/cold-chain/alerts", response_model=list[ColdChainAlertOut])
def list_cold_chain_alerts(db: Session = Depends(get_db)) -> list[ColdChainAlertOut]:
    storages = list(
        db.execute(select(ColdChainStorage).where(ColdChainStorage.is_active.is_(True))).scalars()
    )
    latest_subq = (
        select(
            ColdChainReading.storage_id,
            func.max(ColdChainReading.recorded_at).label("latest_at"),
        )
        .group_by(ColdChainReading.storage_id)
        .subquery()
    )
    latest_readings = db.execute(
        select(ColdChainReading)
        .join(
            latest_subq,
            (ColdChainReading.storage_id == latest_subq.c.storage_id)
            & (ColdChainReading.recorded_at == latest_subq.c.latest_at),
        )
    ).scalars()
    latest_by_storage = {r.storage_id: r for r in latest_readings}
    alerts: list[ColdChainAlertOut] = []
    for storage in storages:
        reading = latest_by_storage.get(storage.id)
        if reading is None:
            alerts.append(
                ColdChainAlertOut(
                    storage_id=storage.id,
                    storage_code=storage.code,
                    storage_name=storage.name,
                    min_temp=storage.min_temp,
                    max_temp=storage.max_temp,
                    last_temperature_c=None,
                    last_recorded_at=None,
                    status="NO_DATA",
                )
            )
            continue
        out_of_range = reading.temperature_c < storage.min_temp or reading.temperature_c > storage.max_temp
        alerts.append(
            ColdChainAlertOut(
                storage_id=storage.id,
                storage_code=storage.code,
                storage_name=storage.name,
                min_temp=storage.min_temp,
                max_temp=storage.max_temp,
                last_temperature_c=reading.temperature_c,
                last_recorded_at=reading.recorded_at,
                status="OUT_OF_RANGE" if out_of_range else "OK",
            )
        )
    return alerts
