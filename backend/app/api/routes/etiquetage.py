from datetime import date, datetime
from typing import Any

from fastapi import APIRouter

from app.core.isbt128.generator import (
    calculate_checksum,
    generate_datamatrix_content,
    validate_din_structure,
)
from app.schemas import etiquettes as schemas

router = APIRouter()


@router.post("/validate", response_model=dict)
async def validate_label_data(
    data: schemas.LabelGenerationRequest,
) -> Any:
    """
    Validate label data against ISBT 128 standards.
    Returns validation status and the generated DataMatrix string.
    """
    # 1. Validate DIN
    din_validation = validate_din_structure(data.din)
    if not din_validation["valid"]:
        return {"valid": False, "message": din_validation["message"]}
    
    # 2. Parse Expiration Date
    try:
        # Support both YYYY-MM-DD and ISO datetime strings
        if "T" in data.expiration:
            exp_date = datetime.fromisoformat(data.expiration).date()
        else:
            exp_date = date.fromisoformat(data.expiration)
    except ValueError:
        return {"valid": False, "message": "Date d'expiration invalide (format attendu: YYYY-MM-DD)"}
    
    # 3. Generate DataMatrix Content (validates other fields implicitly)
    try:
        datamatrix = generate_datamatrix_content(
            din=data.din,
            product_code=data.product_code,
            expiration_date=exp_date,
            blood_group=data.abo_rh,
        )
    except ValueError as e:
        return {"valid": False, "message": str(e)}
    
    return {
        "valid": True,
        "message": "Données conformes au standard ISBT 128",
        "datamatrix": datamatrix,
        "normalized_din": din_validation.get("normalized_din"),
    }


@router.get("/next-din", response_model=dict)
async def get_next_din() -> Any:
    """
    Get next available DIN (Mock with valid checksum).
    Structure: =<Country><Center><Year><Seq><Flag><Check>
    Ex: =A00012600000100K
    """
    # Mock sequence for preview: Year from current date, Seq 123456, Flag 00
    from app.core.config import settings
    
    year = datetime.now().strftime("%y")
    # Use the configured site code
    base_din = f"{settings.din_site_code}{year}12345600"
    check_char = calculate_checksum(base_din)
    full_din = f"={base_din}{check_char}"
    
    return {"din": full_din}
