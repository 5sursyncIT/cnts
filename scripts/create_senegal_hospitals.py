import sys
import os
import uuid

# Add the backend directory to sys.path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), "../backend"))

from sqlalchemy import select
from app.db.session import SessionLocal
from app.db.models import Hopital

def create_hospitals():
    db = SessionLocal()
    try:
        hopitaux_data = [
            {
                "nom": "Hôpital Principal de Dakar",
                "adresse": "1 Avenue Nelson Mandela, Dakar",
                "contact": "+221 33 839 50 50",
                "convention_actif": True
            },
            {
                "nom": "Hôpital Aristide Le Dantec",
                "adresse": "Avenue Pasteur, Dakar",
                "contact": "+221 33 889 38 00",
                "convention_actif": True
            },
            {
                "nom": "Hôpital Général Idrissa Pouye (Grand Yoff)",
                "adresse": "Route des Niayes, Grand Yoff, Dakar",
                "contact": "+221 33 869 40 40",
                "convention_actif": True
            },
            {
                "nom": "Centre Hospitalier National de Fann",
                "adresse": "Avenue Cheikh Anta Diop, Dakar",
                "contact": "+221 33 869 18 18",
                "convention_actif": True
            },
            {
                "nom": "Hôpital d'Enfants Albert Royer",
                "adresse": "Avenue Cheikh Anta Diop, Fann, Dakar",
                "contact": "+221 33 825 04 88",
                "convention_actif": True
            },
            {
                "nom": "Hôpital Militaire de Ouakam",
                "adresse": "Km 8, Route de Ouakam, Dakar",
                "contact": "+221 33 860 20 20",
                "convention_actif": True
            },
            {
                "nom": "Centre Hospitalier Régional de Saint-Louis",
                "adresse": "Rue de France, Saint-Louis",
                "contact": "+221 33 961 11 22",
                "convention_actif": True
            },
            {
                "nom": "Hôpital de Pikine",
                "adresse": "Camp Thiaroye, Pikine",
                "contact": "+221 33 834 23 23",
                "convention_actif": True
            },
            {
                "nom": "Centre Hospitalier Régional de Thiès",
                "adresse": "Quartier Escale, Thiès",
                "contact": "+221 33 951 10 10",
                "convention_actif": True
            },
            {
                "nom": "Hôpital Régional de Ziguinchor",
                "adresse": "Boulevard des 54m, Ziguinchor",
                "contact": "+221 33 991 12 12",
                "convention_actif": True
            },
            {
                "nom": "Hôpital Ndamatou de Touba",
                "adresse": "Touba Mosquée, Touba",
                "contact": "+221 33 976 00 00",
                "convention_actif": True
            },
            {
                "nom": "Hôpital de la Paix de Ziguinchor",
                "adresse": "Quartier Kadior, Ziguinchor",
                "contact": "+221 33 991 50 50",
                "convention_actif": True
            }
        ]

        print(f"Début de la création de {len(hopitaux_data)} hôpitaux...")
        created_count = 0
        skipped_count = 0

        for data in hopitaux_data:
            # Check if exists
            stmt = select(Hopital).where(Hopital.nom == data["nom"])
            existing = db.execute(stmt).scalar_one_or_none()
            
            if existing:
                print(f"L'hôpital '{data['nom']}' existe déjà. Ignoré.")
                skipped_count += 1
                continue

            hopital = Hopital(
                id=uuid.uuid4(),
                nom=data["nom"],
                adresse=data["adresse"],
                contact=data["contact"],
                convention_actif=data["convention_actif"]
            )
            db.add(hopital)
            created_count += 1
            print(f"Hôpital '{data['nom']}' ajouté.")

        db.commit()
        print(f"\nTerminé. {created_count} hôpitaux créés, {skipped_count} ignorés (déjà existants).")

    except Exception as e:
        print(f"Erreur lors de la création des hôpitaux: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_hospitals()
