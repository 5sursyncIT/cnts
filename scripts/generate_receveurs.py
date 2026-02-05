import sys
import os
import uuid
import random
import datetime as dt

# Add the backend directory to sys.path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), "../backend"))

from sqlalchemy import select
from app.db.session import SessionLocal
from app.db.models import Receveur, Hopital

def generate_receveurs():
    db = SessionLocal()
    try:
        # Récupérer les hôpitaux existants
        stmt = select(Hopital).where(Hopital.convention_actif.is_(True))
        hopitaux = list(db.execute(stmt).scalars().all())
        
        if not hopitaux:
            print("Aucun hôpital trouvé. Veuillez d'abord exécuter le script de création des hôpitaux.")
            return

        print(f"{len(hopitaux)} hôpitaux trouvés.")

        # Données de génération
        prenoms_h = [
            "Moussa", "Cheikh", "Abdoulaye", "Mamadou", "Ibrahima", "Babacar", "Ousmane", "Amadou", 
            "Serigne", "Alioune", "Modou", "Lamine", "Papa", "Omar", "Souleymane", "Malick", "Fallou"
        ]
        prenoms_f = [
            "Fatou", "Aminata", "Mariama", "Aissatou", "Khady", "Ndeye", "Mame", "Oumou", "Seynabou", 
            "Astou", "Sokhna", "Coumba", "Rokhaya", "Dieynaba", "Adama", "Binta", "Fama"
        ]
        noms = [
            "Diop", "Ndiaye", "Fall", "Faye", "Sow", "Gueye", "Ba", "Seck", "Diallo", "Cisse", 
            "Diagne", "Thiam", "Mbaye", "Sy", "Wade", "Ly", "Kane", "Dia", "Sarr", "Camara"
        ]
        
        groupes_sanguins = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        quartiers = [
            "Médina", "Grand Yoff", "Parcelles Assainies", "Ouakam", "Yoff", "Plateau", 
            "Fann", "Point E", "Mermoz", "Sacré-Cœur", "Liberté 6", "Dieuppeul", "HLM", 
            "Sicap", "Pikine", "Guédiawaye", "Thiaroye", "Rufisque"
        ]

        count = 50
        print(f"Génération de {count} receveurs...")

        created_count = 0
        for _ in range(count):
            sexe = random.choice(["H", "F"])
            prenom = random.choice(prenoms_h if sexe == "H" else prenoms_f)
            nom = random.choice(noms)
            
            # Date de naissance (entre 5 et 80 ans)
            age = random.randint(5, 80)
            date_naissance = dt.date.today() - dt.timedelta(days=age*365 + random.randint(0, 364))
            
            # Adresse et Téléphone
            quartier = random.choice(quartiers)
            adresse = f"Villa {random.randint(1, 9999)}, {quartier}, Dakar"
            telephone = f"7{random.choice(['7','8','0','6'])}{random.randint(1000000, 9999999)}"
            
            # Groupe sanguin (certains inconnus)
            groupe = random.choice(groupes_sanguins + [None, None])
            
            # Hôpital de suivi
            hopital = random.choice(hopitaux)

            receveur = Receveur(
                id=uuid.uuid4(),
                prenom=prenom,
                nom=nom,
                sexe=sexe,
                date_naissance=date_naissance,
                adresse=adresse,
                telephone=telephone,
                groupe_sanguin=groupe,
                hopital_id=hopital.id
            )
            
            db.add(receveur)
            created_count += 1

        db.commit()
        print(f"Terminé. {created_count} receveurs créés avec succès.")

    except Exception as e:
        print(f"Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_receveurs()
