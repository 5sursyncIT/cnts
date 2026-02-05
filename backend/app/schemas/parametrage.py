from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ExpirationRuleBase(BaseModel):
    product_type: str
    preservation_type: str
    min_temp: float
    max_temp: float
    shelf_life_value: int
    shelf_life_unit: str
    is_active: bool = True
    modified_by: str | None = None


class ExpirationRuleCreate(ExpirationRuleBase):
    pass


class ExpirationRuleUpdate(ExpirationRuleBase):
    pass


class ExpirationRule(ExpirationRuleBase):
    id: UUID
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
