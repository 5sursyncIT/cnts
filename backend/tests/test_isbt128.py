"""
Tests pour le module ISBT 128 (Validation & Génération).
"""

import datetime as dt
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.isbt128.generator import (
    calculate_checksum,
    validate_din_structure,
    generate_datamatrix_content,
)

client = TestClient(app)

def test_calculate_checksum_iso7064():
    """
    Vérifie l'algorithme ISO 7064 Mod 37-2.
    Exemple simple: 'A' -> 'I'
    """
    # A = 10. Checksum = ((0+10)*2)%37 = 20. Check char = (38-20)%37 = 18 -> 'I'
    assert calculate_checksum("A") == "I"
    
    # Test avec une chaîne plus longue
    # ISBT 128 Example: A99991312345600 -> Check char ?
    # On vérifie la cohérence: calculate_checksum renvoie toujours le même résultat
    res = calculate_checksum("A99991312345600")
    assert isinstance(res, str)
    assert len(res) == 1

def test_validate_din_structure_valid():
    """Test d'un DIN valide."""
    # Créons un DIN valide
    base = "A99992612345600"
    check = calculate_checksum(base)
    din = f"={base}{check}"
    
    res = validate_din_structure(din)
    assert res["valid"] is True
    assert res["normalized_din"] == base

def test_validate_din_structure_invalid_length():
    """Test d'un DIN avec mauvaise longueur."""
    res = validate_din_structure("=A9999") # Trop court
    assert res["valid"] is False
    assert "Longueur DIN invalide" in res["message"]

def test_validate_din_structure_invalid_checksum():
    """Test d'un DIN avec mauvais checksum."""
    base = "A99992612345600"
    # Checksum correct
    correct_check = calculate_checksum(base)
    # Checksum incorrect (on prend un autre caractère)
    wrong_check = "0" if correct_check != "0" else "1"
    
    din = f"={base}{wrong_check}"
    res = validate_din_structure(din)
    assert res["valid"] is False
    assert "Checksum invalide" in res["message"]

def test_generate_datamatrix_content():
    """Test de génération du contenu DataMatrix."""
    din_base = "A99992612345600"
    check = calculate_checksum(din_base)
    din = f"={din_base}{check}"
    
    # Date: 2026-02-05 -> Julian day 36 (31+5)
    # Expiration: =>01260362359 (Century 1, Year 26, Day 036)
    exp_date = dt.date(2026, 2, 5)
    
    content = generate_datamatrix_content(
        din=din,
        product_code="E0305V00",
        expiration_date=exp_date,
        blood_group="A+"
    )
    
    # Vérifications
    assert content.startswith("=")
    assert f"={din_base}{check}" in content
    assert "=E0305V00" in content
    assert "=>01260362359" in content
    assert "=%5100" in content # A+ -> 5100

def test_api_validate_endpoint():
    """Test de l'endpoint /api/etiquetage/validate."""
    # 1. Obtenir un DIN valide via next-din
    res_din = client.get("/api/etiquetage/next-din")
    assert res_din.status_code == 200
    din = res_din.json()["din"]
    
    # 2. Valider ce DIN
    response = client.post(
        "/api/etiquetage/validate",
        json={
            "din": din,
            "product_code": "E0305V00",
            "abo_rh": "A+",
            "expiration": "2026-02-05"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert "datamatrix" in data
    assert data["datamatrix"].startswith("=")

def test_api_validate_endpoint_invalid():
    """Test de l'endpoint /api/etiquetage/validate avec données invalides."""
    response = client.post(
        "/api/etiquetage/validate",
        json={
            "din": "=INVALID",
            "product_code": "E0305V00",
            "abo_rh": "A+",
            "expiration": "2026-02-05"
        }
    )
    assert response.status_code == 200 # L'API renvoie 200 OK avec valid: False
    data = response.json()
    assert data["valid"] is False
    assert "message" in data
