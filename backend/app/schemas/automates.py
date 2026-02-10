import uuid
from datetime import datetime

from pydantic import BaseModel


class InterfaceAutomateCreate(BaseModel):
    code: str
    nom: str
    type_automate: str | None = None
    protocole: str
    host: str | None = None
    port: int | None = None
    mapping_config: dict | None = None


class InterfaceAutomateUpdate(BaseModel):
    nom: str | None = None
    host: str | None = None
    port: int | None = None
    mapping_config: dict | None = None
    is_active: bool | None = None


class InterfaceAutomateOut(BaseModel):
    id: uuid.UUID
    code: str
    nom: str
    type_automate: str | None = None
    protocole: str
    host: str | None = None
    port: int | None = None
    mapping_config: dict | None = None
    is_active: bool
    last_communication: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageAutomateOut(BaseModel):
    id: uuid.UUID
    interface_id: uuid.UUID
    direction: str
    contenu_brut: str | None = None
    statut: str
    erreur: str | None = None
    analyse_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
