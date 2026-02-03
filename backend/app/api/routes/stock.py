import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.events import log_event
from app.core.config import settings
from app.core.idempotency import get_idempotent_response, store_idempotent_response
from app.db.models import Don, FractionnementRecette, Poche, ProductRule
from app.db.session import get_db
from app.schemas.stock import (
    FractionnementComposant,
    FractionnementCreate,
    FractionnementDepuisRecetteCreate,
    FractionnementOut,
    PocheOut,
    RecetteFractionnementOut,
    RecetteFractionnementUpsert,
    RecetteComposant,
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
def fractionner(payload: FractionnementCreate, db: Session = Depends(get_db)) -> JSONResponse | dict:
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
def disable_recette(code: str, db: Session = Depends(get_db)) -> dict:
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
