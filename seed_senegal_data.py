import uuid
import datetime
import random
import hashlib
import hmac
import base64
import os
import sys

# Add the current directory to sys.path to allow importing 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.db.models import (
    Base, Donneur, Don, Poche, Analyse, Site, Hopital, 
    CampagneCollecte, Article, UserAccount, CarteDonneur
)
from app.core.config import settings

# --- Helpers ---

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    iterations = 210_000
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations, dklen=32)
    return "pbkdf2_sha256${}${}${}".format(
        iterations,
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(dk).decode("ascii"),
    )

def mock_hash_cni(cni: str) -> str:
    # CNTS uses HMAC-SHA256 for CNI hashing
    key = settings.cni_hash_key.encode("utf-8")
    h = hmac.new(key, cni.encode("utf-8"), hashlib.sha256)
    return h.hexdigest()

# --- Data Sets ---

REGIONS = ["Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Diourbel", "Louga", "Tambacounda"]
NOM_SENEGAL = ["Diop", "Ndiaye", "Fall", "Sow", "Diallo", "Ba", "Wade", "Gueye", "Sy", "Faye", "Cissé", "Dramé", "Sarr", "Mbow", "Beye"]
PRENOM_HOMME = ["Moussa", "Ibrahima", "Modou", "Youssouph", "Ousmane", "Abdoulaye", "Cheikh", "Babacar", "Omar", "Seydou"]
PRENOM_FEMME = ["Fatou", "Aissatou", "Mariama", "Khadija", "Nogaye", "Aminata", "Ramata", "Coumba", "Astou", "Binetou"]
GROUPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

# --- Seed Logic ---

def seed():
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    print("Cleaning up some old data for fresh presentation...")
    # Optional: db.query(Article).delete()
    # For a demo, it's better to just add if not present or clear specific ones
    
    # 1. Sites
    sites_data = [
        {"code": "DKR-01", "nom": "CNTS Dakar - Fann", "type_site": "FIXE", "region": "Dakar"},
        {"code": "THS-01", "nom": "CNTS Thiès", "type_site": "FIXE", "region": "Thiès"},
        {"code": "SLB-01", "nom": "CNTS Saint-Louis", "type_site": "FIXE", "region": "Saint-Louis"},
    ]
    
    sites = []
    for s in sites_data:
        site = db.query(Site).filter_by(code=s["code"]).first()
        if not site:
            site = Site(**s)
            db.add(site)
            db.flush()
        sites.append(site)
    
    # 2. Hopitaux
    hospitals_data = [
        {"nom": "Hôpital Principal de Dakar", "adresse": "Plateau, Dakar"},
        {"nom": "Hôpital Le Dantec", "adresse": "Avenue Pasteur, Dakar"},
        {"nom": "Hôpital de Fann", "adresse": "Fann, Dakar"},
        {"nom": "Hôpital de Grand Yoff (HOGGY)", "adresse": "Grand Yoff, Dakar"},
        {"nom": "Hôpital Dalal Jamm", "adresse": "Guédiawaye, Dakar"},
    ]
    for h in hospitals_data:
        if not db.query(Hopital).filter_by(nom=h["nom"]).first():
            db.add(Hopital(**h))
    
    # 3. Donneurs (~50)
    print("Seeding Donors...")
    for i in range(50):
        sexe = random.choice(["M", "F"])
        nom = random.choice(NOM_SENEGAL)
        prenom = random.choice(PRENOM_HOMME if sexe == "M" else PRENOM_FEMME)
        cni = f"{random.randint(1, 2)}{random.randint(100, 999)}{datetime.datetime.now().year}{random.randint(10000, 99999)}"
        cni_h = mock_hash_cni(cni)
        
        if db.query(Donneur).filter_by(cni_hash=cni_h).first():
            continue
            
        donneur = Donneur(
            nom=nom,
            prenom=prenom,
            sexe=sexe,
            cni_hash=cni_h,
            date_naissance=datetime.date(random.randint(1970, 2004), random.randint(1, 12), random.randint(1, 28)),
            groupe_sanguin=random.choice(GROUPES),
            region=random.choice(REGIONS),
            telephone=f"77{random.randint(1000000, 9999999)}",
            email=f"{prenom.lower()}.{nom.lower()}{i}@example.sn",
            profession=random.choice(["Enseignant", "Commerçant", "Étudiant", "Ingénieur", "Médecin", "Chauffeur"])
        )
        db.add(donneur)
        db.flush()
        
        # Add a Loyalty Card
        nb_dons = random.randint(0, 15)
        points = nb_dons * 100
        niveau = "BRONZE"
        if nb_dons > 10: niveau = "PLATINE"
        elif nb_dons > 7: niveau = "OR"
        elif nb_dons > 3: niveau = "ARGENT"
        
        carte = CarteDonneur(
            donneur_id=donneur.id,
            numero_carte=f"CARD-{donneur.id.hex[:8].upper()}",
            niveau=niveau,
            points=points,
            total_dons=nb_dons,
            is_active=True
        )
        db.add(carte)
        
        # Add some historical donations
        for j in range(random.randint(0, 3)):
            date_don = datetime.date.today() - datetime.timedelta(days=random.randint(30, 730))
            din = f"SN-{site.code}-{date_don.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            don = Don(
                donneur_id=donneur.id,
                din=din,
                date_don=date_don,
                type_don="SANG_TOTAL",
                statut_qualification="QUALIFIE"
            )
            db.add(don)
            db.flush()
            
            # Add Analyses
            analyses_types = ["VIH", "VHB", "VHC", "SYPHILIS"]
            for t in analyses_types:
                db.add(Analyse(don_id=don.id, type_test=t, resultat="NEGATIF"))
            
            # Add a Poche
            db.add(Poche(
                don_id=don.id,
                type_produit="CGR", # Concentré de Globules Rouges
                groupe_sanguin=donneur.groupe_sanguin,
                date_peremption=date_don + datetime.timedelta(days=42),
                emplacement_stock=f"FRIGO-{random.randint(1, 5)}",
                statut_stock="EN_STOCK",
                statut_distribution="DISPONIBLE",
                volume_ml=450
            ))

    # 4. Articles for Portal
    print("Seeding Articles...")
    articles = [
        {
            "slug": "importance-don-sang-senegal",
            "title": "L'importance du don de sang au Sénégal",
            "excerpt": "Chaque don compte pour sauver des vies dans nos hôpitaux.",
            "content": "Le don de sang est un acte citoyen et solidaire. Au Sénégal, les besoins sont constants, notamment pour les maternités et les urgences...",
            "category": "Sensibilisation",
            "image_url": "https://images.unsplash.com/photo-1615461066841-6116ecaaba30?q=80&w=2000"
        },
        {
            "slug": "journee-mondiale-donneur",
            "title": "Célébration de la Journée Mondiale du Donneur",
            "excerpt": "Le CNTS organise une grande collecte nationale ce 14 juin.",
            "content": "À l'occasion de la journée mondiale, rejoignez-nous sur la Place de l'Obélisque pour une journée de solidarité exceptionnelle...",
            "category": "Événement",
            "image_url": "https://images.unsplash.com/photo-1536856407039-dc3bc3306bc3?q=80&w=2000"
        },
        {
            "slug": "conseils-apres-don",
            "title": "Que faire après votre don de sang ?",
            "excerpt": "Nos conseils pour une récupération optimale.",
            "content": "Après avoir donné votre sang, il est important de bien s'hydrater et d'éviter les efforts physiques intenses pendant 24h...",
            "category": "Conseils",
            "image_url": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2000"
        }
    ]
    for a in articles:
        if not db.query(Article).filter_by(slug=a["slug"]).first():
            db.add(Article(**a))

    # 5. Mobile Collections
    print("Seeding Campagnes...")
    campagnes = [
        {
            "code": "COLL-UCAD-2026",
            "nom": "Collecte Mobile UCAD",
            "type_campagne": "UNIVERSITE",
            "lieu": "Campus Social UCAD",
            "date_debut": datetime.datetime.now() + datetime.timedelta(days=2),
            "date_fin": datetime.datetime.now() + datetime.timedelta(days=3),
            "objectif_dons": 500,
            "statut": "PLANIFIEE"
        },
        {
            "code": "COLL-PLACE-OBELISQUE",
            "nom": "Grande Collecte de l'Indépendance",
            "type_campagne": "MOBILE",
            "lieu": "Place de l'Obélisque",
            "date_debut": datetime.datetime.now() - datetime.timedelta(days=1),
            "date_fin": datetime.datetime.now() + datetime.timedelta(days=1),
            "objectif_dons": 1000,
            "statut": "EN_COURS"
        }
    ]
    for c in campagnes:
        if not db.query(CampagneCollecte).filter_by(code=c["code"]).first():
            db.add(CampagneCollecte(**c))

    db.commit()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
