import datetime as dt
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Commande, Don, Donneur, Poche
from app.db.session import get_db

router = APIRouter(prefix="/analytics")


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


@router.get("/export")
def export_report(
    format: str = Query(..., regex="^(csv|excel|pdf)$"),
    report_type: str = Query(..., regex="^(activity|stock)$"),
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
