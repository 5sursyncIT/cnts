import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Donneur, Poche, Analyse, Commande
from app.db.session import get_db

router = APIRouter(prefix="/fhir")


@router.get("/metadata")
def capability_statement() -> dict:
    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "kind": "instance",
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [
            {
                "mode": "server",
                "resource": [
                    {"type": "Patient", "interaction": [{"code": "read"}]},
                    {"type": "Substance", "interaction": [{"code": "read"}]},
                    {"type": "DiagnosticReport", "interaction": [{"code": "read"}]},
                    {"type": "ServiceRequest", "interaction": [{"code": "read"}]},
                ],
            }
        ],
    }


@router.get("/Patient/{patient_id}")
def get_patient(patient_id: uuid.UUID, db: Session = Depends(get_db)) -> dict:
    donneur = db.get(Donneur, patient_id)
    if donneur is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {
        "resourceType": "Patient",
        "id": str(donneur.id),
        "name": [{"family": donneur.nom, "given": [donneur.prenom]}],
        "gender": "male" if donneur.sexe == "M" else "female" if donneur.sexe == "F" else "unknown",
        "birthDate": donneur.date_naissance.isoformat() if donneur.date_naissance else None,
    }


@router.get("/Substance/{substance_id}")
def get_substance(substance_id: uuid.UUID, db: Session = Depends(get_db)) -> dict:
    poche = db.get(Poche, substance_id)
    if poche is None:
        raise HTTPException(status_code=404, detail="Substance not found")
    return {
        "resourceType": "Substance",
        "id": str(poche.id),
        "status": "active" if poche.statut_distribution == "DISPONIBLE" else "inactive",
        "code": {
            "coding": [
                {
                    "system": "urn:isbt128",
                    "code": poche.code_produit_isbt or poche.type_produit,
                    "display": poche.type_produit,
                }
            ]
        },
        "instance": [
            {
                "quantity": {"value": poche.volume_ml, "unit": "mL"} if poche.volume_ml else None,
                "expiry": poche.date_peremption.isoformat() if poche.date_peremption else None,
            }
        ],
    }


@router.get("/DiagnosticReport/{report_id}")
def get_diagnostic_report(report_id: uuid.UUID, db: Session = Depends(get_db)) -> dict:
    analyse = db.get(Analyse, report_id)
    if analyse is None:
        raise HTTPException(status_code=404, detail="DiagnosticReport not found")
    return {
        "resourceType": "DiagnosticReport",
        "id": str(analyse.id),
        "status": "final" if analyse.resultat != "EN_ATTENTE" else "registered",
        "code": {"coding": [{"system": "urn:cnts:analyses", "code": analyse.type_test}]},
        "conclusion": analyse.resultat,
    }


@router.get("/ServiceRequest/{request_id}")
def get_service_request(request_id: uuid.UUID, db: Session = Depends(get_db)) -> dict:
    commande = db.get(Commande, request_id)
    if commande is None:
        raise HTTPException(status_code=404, detail="ServiceRequest not found")
    return {
        "resourceType": "ServiceRequest",
        "id": str(commande.id),
        "status": commande.statut.lower(),
        "intent": "order",
        "authoredOn": commande.date_demande.isoformat() if commande.date_demande else None,
    }
