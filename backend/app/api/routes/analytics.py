import datetime as dt
import io
from enum import Enum
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, case, and_, distinct
from sqlalchemy.orm import Session

from app.db.models import Commande, Don, Donneur, Poche, Analyse
from app.db.session import get_db

router = APIRouter(prefix="/analytics")


class TimeGranularity(str, Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"


@router.get("/dashboard")
def get_dashboard_stats(
    start_date: dt.date | None = None,
    end_date: dt.date | None = None,
    db: Session = Depends(get_db),
):
    """
    Récupérer les statistiques agrégées pour le tableau de bord analytique.
    """
    if not end_date:
        end_date = dt.date.today()
    if not start_date:
        start_date = end_date - dt.timedelta(days=30)

    # 1. Tendance des dons par jour
    dons_trend = (
        db.query(
            func.date(Don.date_don).label("date"), func.count(Don.id).label("count")
        )
        .filter(Don.date_don >= start_date, Don.date_don <= end_date)
        .group_by(func.date(Don.date_don))
        .order_by("date")
        .all()
    )

    # 2. Répartition par groupe sanguin (sur le stock disponible)
    stock_by_blood_type = (
        db.query(Poche.groupe_sanguin, func.count(Poche.id).label("count"))
        .filter(Poche.statut_distribution == "DISPONIBLE")
        .group_by(Poche.groupe_sanguin)
        .all()
    )

    # 3. Commandes par statut
    commandes_status = (
        db.query(Commande.statut, func.count(Commande.id).label("count"))
        .filter(Commande.created_at >= start_date)
        .group_by(Commande.statut)
        .all()
    )

    return {
        "period": {"start": start_date, "end": end_date},
        "dons_trend": [{"date": d.date, "count": d.count} for d in dons_trend],
        "stock_distribution": [
            {"groupe": s.groupe_sanguin or "INCONNU", "count": s.count}
            for s in stock_by_blood_type
        ],
        "commandes_status": [
            {"statut": c.statut, "count": c.count} for c in commandes_status
        ],
    }


# ==================== TREND ENDPOINTS ====================

@router.get("/trend/dons")
def get_dons_trend(
    start_date: dt.date = Query(...),
    end_date: dt.date = Query(...),
    granularity: TimeGranularity = Query(TimeGranularity.DAY),
    db: Session = Depends(get_db),
):
    """
    Récupérer les tendances de collecte de dons avec granularité configurable.
    """
    # Déterminer la fonction de troncature PostgreSQL
    if granularity == TimeGranularity.DAY:
        trunc_func = func.date_trunc('day', Don.date_don)
    elif granularity == TimeGranularity.WEEK:
        trunc_func = func.date_trunc('week', Don.date_don)
    else:  # MONTH
        trunc_func = func.date_trunc('month', Don.date_don)

    trend = (
        db.query(
            trunc_func.label("period"),
            func.count(Don.id).label("value"),
        )
        .filter(Don.date_don >= start_date, Don.date_don <= end_date)
        .group_by("period")
        .order_by("period")
        .all()
    )

    return {
        "data": [{"date": str(t.period.date()) if t.period else None, "value": t.value} for t in trend],
        "granularity": granularity.value,
    }


@router.get("/trend/stock")
def get_stock_trend(
    start_date: dt.date = Query(...),
    end_date: dt.date = Query(...),
    product_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """
    Récupérer les tendances du stock par type de produit.
    """
    query = db.query(
        func.date_trunc('day', Poche.created_at).label("period"),
        func.count(Poche.id).label("value"),
    ).filter(
        Poche.created_at >= start_date,
        Poche.created_at <= end_date,
    )

    if product_type:
        query = query.filter(Poche.type_produit == product_type)

    trend = query.group_by("period").order_by("period").all()

    return {
        "data": [{"date": str(t.period.date()) if t.period else None, "value": t.value} for t in trend],
        "product_type": product_type,
    }


@router.get("/trend/distribution")
def get_distribution_trend(
    start_date: dt.date = Query(...),
    end_date: dt.date = Query(...),
    db: Session = Depends(get_db),
):
    """
    Récupérer les tendances de distribution (commandes servies).
    """
    trend = (
        db.query(
            func.date_trunc('day', Commande.updated_at).label("period"),
            func.count(Commande.id).label("value"),
        )
        .filter(
            Commande.statut == "SERVIE",
            Commande.updated_at >= start_date,
            Commande.updated_at <= end_date,
        )
        .group_by("period")
        .order_by("period")
        .all()
    )

    return {
        "data": [{"date": str(t.period.date()) if t.period else None, "value": t.value} for t in trend],
    }


# ==================== KPI ENDPOINTS ====================

@router.get("/kpi/collection-rate")
def get_collection_rate_kpi(db: Session = Depends(get_db)):
    """
    Calculer le taux de collecte (dons par jour) avec tendance.
    """
    today = dt.date.today()
    current_period_start = today - dt.timedelta(days=30)
    previous_period_start = current_period_start - dt.timedelta(days=30)

    # Période actuelle
    current_count = (
        db.query(func.count(Don.id))
        .filter(Don.date_don >= current_period_start, Don.date_don <= today)
        .scalar() or 0
    )

    # Période précédente
    previous_count = (
        db.query(func.count(Don.id))
        .filter(
            Don.date_don >= previous_period_start,
            Don.date_don < current_period_start,
        )
        .scalar() or 0
    )

    current_rate = current_count / 30 if current_count > 0 else 0
    previous_rate = previous_count / 30 if previous_count > 0 else 0

    change_percent = (
        ((current_rate - previous_rate) / previous_rate * 100)
        if previous_rate > 0
        else 0
    )

    trend = "up" if change_percent > 5 else "down" if change_percent < -5 else "stable"

    return {
        "name": "Taux de Collecte",
        "value": round(current_rate, 2),
        "unit": "dons/jour",
        "trend": trend,
        "change_percent": round(change_percent, 1),
        "previous_value": round(previous_rate, 2),
    }


@router.get("/kpi/wastage-rate")
def get_wastage_rate_kpi(db: Session = Depends(get_db)):
    """
    Calculer le taux de gaspillage (poches périmées / total).
    """
    today = dt.date.today()

    # Total de poches créées dans les 90 derniers jours
    total_poches = (
        db.query(func.count(Poche.id))
        .filter(Poche.created_at >= today - dt.timedelta(days=90))
        .scalar() or 0
    )

    # Poches périmées (date_peremption passée et non distribuées)
    expired_poches = (
        db.query(func.count(Poche.id))
        .filter(
            Poche.date_peremption < today,
            Poche.statut_distribution.in_(["DISPONIBLE", "NON_DISTRIBUABLE"]),
            Poche.created_at >= today - dt.timedelta(days=90),
        )
        .scalar() or 0
    )

    wastage_rate = (expired_poches / total_poches * 100) if total_poches > 0 else 0

    # Période précédente (90 jours avant)
    previous_period_start = today - dt.timedelta(days=180)
    previous_period_end = today - dt.timedelta(days=90)

    previous_total = (
        db.query(func.count(Poche.id))
        .filter(
            Poche.created_at >= previous_period_start,
            Poche.created_at < previous_period_end,
        )
        .scalar() or 0
    )

    previous_expired = (
        db.query(func.count(Poche.id))
        .filter(
            Poche.date_peremption < previous_period_end,
            Poche.statut_distribution.in_(["DISPONIBLE", "NON_DISTRIBUABLE"]),
            Poche.created_at >= previous_period_start,
            Poche.created_at < previous_period_end,
        )
        .scalar() or 0
    )

    previous_rate = (
        (previous_expired / previous_total * 100) if previous_total > 0 else 0
    )

    change_percent = wastage_rate - previous_rate
    trend = "down" if change_percent < -1 else "up" if change_percent > 1 else "stable"

    return {
        "name": "Taux de Gaspillage",
        "value": round(wastage_rate, 2),
        "unit": "%",
        "trend": trend,  # Pour wastage, "down" est bon
        "change_percent": round(change_percent, 1),
        "previous_value": round(previous_rate, 2),
    }


@router.get("/kpi/liberation-rate")
def get_liberation_rate_kpi(db: Session = Depends(get_db)):
    """
    Calculer le taux de libération biologique (dons libérés / total dons).
    """
    today = dt.date.today()
    period_start = today - dt.timedelta(days=30)

    total_dons = (
        db.query(func.count(Don.id))
        .filter(Don.date_don >= period_start, Don.date_don <= today)
        .scalar() or 0
    )

    liberated_dons = (
        db.query(func.count(Don.id))
        .filter(
            Don.date_don >= period_start,
            Don.date_don <= today,
            Don.statut_qualification == "LIBERE",
        )
        .scalar() or 0
    )

    liberation_rate = (liberated_dons / total_dons * 100) if total_dons > 0 else 0

    # Période précédente
    previous_period_start = period_start - dt.timedelta(days=30)
    previous_total = (
        db.query(func.count(Don.id))
        .filter(
            Don.date_don >= previous_period_start, Don.date_don < period_start
        )
        .scalar() or 0
    )

    previous_liberated = (
        db.query(func.count(Don.id))
        .filter(
            Don.date_don >= previous_period_start,
            Don.date_don < period_start,
            Don.statut_qualification == "LIBERE",
        )
        .scalar() or 0
    )

    previous_rate = (
        (previous_liberated / previous_total * 100) if previous_total > 0 else 0
    )

    change_percent = liberation_rate - previous_rate
    trend = "up" if change_percent > 1 else "down" if change_percent < -1 else "stable"

    return {
        "name": "Taux de Libération",
        "value": round(liberation_rate, 2),
        "unit": "%",
        "trend": trend,
        "change_percent": round(change_percent, 1),
        "previous_value": round(previous_rate, 2),
    }


@router.get("/kpi/stock-available")
def get_stock_available_kpi(db: Session = Depends(get_db)):
    """
    Nombre de poches disponibles en stock.
    """
    current_stock = (
        db.query(func.count(Poche.id))
        .filter(Poche.statut_distribution == "DISPONIBLE")
        .scalar() or 0
    )

    # Comparaison avec il y a 7 jours (approximatif)
    seven_days_ago = dt.date.today() - dt.timedelta(days=7)
    # On ne peut pas vraiment retrouver le stock d'il y a 7 jours sauf si on a un historique
    # Pour simplifier, on compare avec le stock total créé récemment
    previous_stock = (
        db.query(func.count(Poche.id))
        .filter(
            Poche.statut_distribution == "DISPONIBLE",
            Poche.created_at < seven_days_ago,
        )
        .scalar() or 0
    )

    change_percent = (
        ((current_stock - previous_stock) / previous_stock * 100)
        if previous_stock > 0
        else 0
    )

    trend = "up" if change_percent > 5 else "down" if change_percent < -5 else "stable"

    return {
        "name": "Stock Disponible",
        "value": current_stock,
        "unit": "poches",
        "trend": trend,
        "change_percent": round(change_percent, 1),
        "previous_value": previous_stock,
    }


# ==================== STOCK BREAKDOWN ====================

@router.get("/stock/breakdown")
def get_stock_breakdown(db: Session = Depends(get_db)):
    """
    Répartition du stock par type de produit et statut.
    """
    breakdown = (
        db.query(
            Poche.type_produit,
            Poche.statut_distribution,
            func.count(Poche.id).label("count"),
        )
        .group_by(Poche.type_produit, Poche.statut_distribution)
        .all()
    )

    # Restructurer les données
    result = {}
    for item in breakdown:
        product = item.type_produit or "INCONNU"
        if product not in result:
            result[product] = {
                "type_produit": product,
                "available": 0,
                "reserved": 0,
                "distributed": 0,
                "non_distribuable": 0,
            }

        if item.statut_distribution == "DISPONIBLE":
            result[product]["available"] = item.count
        elif item.statut_distribution == "RESERVE":
            result[product]["reserved"] = item.count
        elif item.statut_distribution == "DISTRIBUE":
            result[product]["distributed"] = item.count
        elif item.statut_distribution == "NON_DISTRIBUABLE":
            result[product]["non_distribuable"] = item.count

    return {"breakdown": list(result.values())}


@router.get("/export")
def export_report(
    format: str = Query(..., pattern=r"^(csv|excel|pdf)$"),
    report_type: str = Query(..., pattern=r"^(activity|stock)$"),
    db: Session = Depends(get_db),
):
    """
    Exporter un rapport au format spécifié.
    """
    import pandas as pd

    # Génération des données
    if report_type == "activity":
        # Exemple: Liste des dons récents
        stmt = select(Don.din, Don.date_don, Don.type_don, Don.statut_qualification).limit(1000)
        data = db.execute(stmt).all()
        df = pd.DataFrame(data, columns=["DIN", "Date", "Type", "Statut"])
        filename = f"rapport_activite_{dt.date.today()}"
    
    elif report_type == "stock":
        stmt = select(Poche.code_produit_isbt, Poche.type_produit, Poche.groupe_sanguin, Poche.date_peremption).where(Poche.statut_distribution == "DISPONIBLE")
        data = db.execute(stmt).all()
        df = pd.DataFrame(data, columns=["Code Produit", "Type", "Groupe", "Expiration"])
        filename = f"rapport_stock_{dt.date.today()}"
    
    else:
        raise HTTPException(status_code=400, detail="Type de rapport inconnu")

    # Export selon format
    buffer = io.BytesIO()

    if format == "csv":
        df.to_csv(buffer, index=False)
        media_type = "text/csv"
        filename += ".csv"
    
    elif format == "excel":
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Rapport")
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename += ".xlsx"
    
    elif format == "pdf":
        # Utilisation basique de reportlab
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet

        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        elements.append(Paragraph(f"Rapport: {report_type.upper()}", styles['Title']))
        elements.append(Paragraph(f"Généré le: {dt.datetime.now()}", styles['Normal']))
        elements.append(Paragraph(" ", styles['Normal'])) # Spacer

        # Conversion DataFrame en liste de listes pour Table
        data_list = [df.columns.tolist()] + df.values.tolist()
        
        # Table
        t = Table(data_list)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(t)
        
        doc.build(elements)
        media_type = "application/pdf"
        filename += ".pdf"

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
