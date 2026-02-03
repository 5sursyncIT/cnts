
import sys
import os
import random
import uuid
import datetime as dt
from sqlalchemy import text

# Add backend to path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), "../backend"))

from app.db.session import SessionLocal
from app.db.models import Donneur, Don, Poche, Analyse
from app.core.din import generate_din

def generate_donations():
    db = SessionLocal()
    try:
        print("Récupération des donneurs...")
        donneurs = db.query(Donneur).all()
        print(f"{len(donneurs)} donneurs trouvés.")
        
        don_count = 0
        
        for i, donneur in enumerate(donneurs):
            # Generate random donations for all donors, even if they don't have 'dernier_don' set in DB
            # We'll simulate 0 to 3 donations per donor
            
            num_dons = random.randint(0, 3)
            if num_dons == 0:
                continue
                
            # Assume last donation was recent (within last 2 years)
            days_ago = random.randint(1, 730)
            date_don = dt.date.today() - dt.timedelta(days=days_ago)
            
            # Update donor's last donation date
            if not donneur.dernier_don or date_don > donneur.dernier_don:
                donneur.dernier_don = date_don
            
            dates = []
            current_date = date_don
            for _ in range(num_dons):
                dates.append(current_date)
                # Go back 3-6 months
                days_back = random.randint(90, 180)
                current_date = current_date - dt.timedelta(days=days_back)
                if current_date.year < 2023:
                    break
            
            for d_date in dates:
                # Mock DIN: YY-123456
                # We use a large random number to avoid collision in this script
                # Increase range and retry logic
                for _ in range(5):
                    seq = random.randint(100000, 999999)
                    din = f"{str(d_date.year)[2:]}-{seq}"
                    existing = db.query(Don).filter(Don.din == din).first()
                    if not existing:
                        break
                else:
                    print(f"Skipping donation for {donneur.id} due to DIN collision")
                    continue

                don = Don(
                    id=uuid.uuid4(),
                    donneur_id=donneur.id,
                    din=din,
                    date_don=d_date,
                    type_don="SANG_TOTAL",
                    statut_qualification="EN_ATTENTE"
                )
                db.add(don)
                
                # Create associated Poche
                poche = Poche(
                    id=uuid.uuid4(),
                    don_id=don.id,
                    type_produit="ST", # Sang Total
                    groupe_sanguin=donneur.groupe_sanguin,
                    volume_ml=450,
                    date_peremption=d_date + dt.timedelta(days=42), # 42 days for red blood cells usually
                    emplacement_stock="BANQUE_SANG",
                    statut_stock="EN_STOCK",
                    statut_distribution="NON_DISTRIBUABLE"
                )
                db.add(poche)
                
                don_count += 1
            
            if i % 100 == 0:
                print(f"Traitement... {i}/{len(donneurs)} donneurs traités ({don_count} dons créés)", end="\r")
                db.commit()

        db.commit()
        print(f"\nTerminé. {don_count} dons créés.")
        
    except Exception as e:
        print(f"Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_donations()
