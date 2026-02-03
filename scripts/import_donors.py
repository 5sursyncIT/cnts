import json
import time
import requests
import sys
import os

# Configuration
API_URL = "http://localhost:8000"
JSON_FILE = "donneurs_senegal_2000.json"

def import_donors():
    print(f"Lecture du fichier {JSON_FILE}...")
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            donors = json.load(f)
    except FileNotFoundError:
        print(f"Erreur: Le fichier {JSON_FILE} est introuvable.")
        sys.exit(1)

    print(f"{len(donors)} donneurs trouvés. Début de l'importation...")
    
    success_count = 0
    error_count = 0
    
    for i, d in enumerate(donors):
        # Mapping JSON keys to API schema
        payload = {
            "cni": f"CNI-{d['id']}", # Génération d'une CNI fictive basée sur l'ID
            "nom": d["nom"],
            "prenom": d["prenom"],
            "sexe": "H" if d["sexe"] == "M" else d["sexe"],
            "date_naissance": (
                # Estimation date naissance basée sur l'âge
                f"{2024 - d['age']}-01-01" 
            ),
            "groupe_sanguin": d["groupe_sanguin"],
            "adresse": d["adresse"],
            "region": d["region"],
            "departement": d["departement"],
            "telephone": d["telephone"],
            "email": d["email"],
            "profession": d["profession"]
        }
        
        try:
            # Check if donor exists (optional, skipping for speed in demo)
            # Create donor
            response = requests.post(f"{API_URL}/donneurs", json=payload)
            
            if response.status_code in (200, 201):
                success_count += 1
                print(f"[{i+1}/{len(donors)}] Importé: {d['prenom']} {d['nom']}", end="\r")
            elif response.status_code == 409:
                print(f"[{i+1}/{len(donors)}] Doublon ignoré: {d['prenom']} {d['nom']} (CNI déjà existante)", end="\r")
                error_count += 1
            else:
                print(f"\nErreur pour {d['prenom']} {d['nom']}: {response.status_code} - {response.text}")
                error_count += 1
                
        except Exception as e:
            print(f"\nException: {e}")
            error_count += 1

    print(f"\n\nImportation terminée.")
    print(f"Succès: {success_count}")
    print(f"Erreurs/Doublons: {error_count}")

if __name__ == "__main__":
    import_donors()
