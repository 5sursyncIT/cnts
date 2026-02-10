import uuid
from datetime import datetime

from pydantic import BaseModel


class DHIS2ExportCreate(BaseModel):
    periode: str
    org_unit: str
    data_set: str | None = None


class DHIS2ExportOut(BaseModel):
    id: uuid.UUID
    periode: str
    org_unit: str
    data_set: str | None = None
    payload: dict
    statut: str
    response_code: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
