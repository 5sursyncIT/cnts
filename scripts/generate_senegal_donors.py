#!/usr/bin/env python3
"""
Script de génération de données de démonstration pour le SGI-CNTS.
Génère 2000 profils de donneurs sénégalais réalistes avec export CSV/JSON et statistiques.
"""

import csv
import json
import random
import datetime
import math
from typing import List, Dict, Any
from collections import Counter

# =============================================================================
# CONSTANTES ET DONNÉES DE RÉFÉRENCE
# =============================================================================

REGIONS_DEPARTEMENTS = {
    "Dakar": ["Dakar", "Pikine", "Rufisque", "Guédiawaye", "Keur Massar"],
    "Thiès": ["Thiès", "Mbour", "Tivaouane"],
    "Diourbel": ["Diourbel", "Bambey", "Mbacké"],
    "Fatick": ["Fatick", "Foundiougne", "Gossas"],
    "Kaolack": ["Kaolack", "Guinguinéo", "Nioro du Rip"],
    "Kaffrine": ["Kaffrine", "Birkelane", "Koungheul", "Malem Hodar"],
    "Kolda": ["Kolda", "Médina Yoro Foulah", "Vélingara"],
    "Sédhiou": ["Sédhiou", "Bounkiling", "Goudomp"],
    "Ziguinchor": ["Ziguinchor", "Bignona", "Oussouye"],
    "Tambacounda": ["Tambacounda", "Bakel", "Goudiry", "Koumpentoum"],
    "Kédougou": ["Kédougou", "Salémata", "Saraya"],
    "Matam": ["Matam", "Kanel", "Ranérou"],
    "Saint-Louis": ["Saint-Louis", "Dagana", "Podor"],
    "Louga": ["Louga", "Kébémer", "Linguère"]
}

NOMS_SENEGAL = [
    "Ndiaye", "Diop", "Fall", "Sow", "Gueye", "Diouf", "Faye", "Sy", "Camara", "Cisse",
    "Ba", "Diallo", "Mbaye", "Thiam", "Mbacke", "Ly", "Niang", "Ndoye", "Seck", "Kane",
    "Sarr", "Dia", "Diaw", "Sane", "Toure", "Gaye", "Samb", "Boye", "Wade", "Diagne"
]

PRENOMS_HOMMES = [
    "Mamadou", "Ibrahima", "Abdoulaye", "Ousmane", "Amadou", "Moussa", "Cheikh", "Babacar",
    "Alioune", "Mustapha", "Lamine", "Omar", "Samba", "Assane", "Pape", "Serigne", "Souleymane",
    "Djibril", "Abdou", "Boubacar", "Malick", "Daouda", "Demba", "El Hadji", "Youssoupha"
]

PRENOMS_FEMMES = [
    "Fatou", "Aminata", "Mariama", "Aissatou", "Ndeye", "Khady", "Mame", "Astou", "Coumba",
    "Sokhna", "Awa", "Bineta", "Seynabou", "Adama", "Oumou", "Rokhaya", "Dieynaba", "Fama",
    "Amy", "Salimata", "Bintou", "Khadija", "Maimouna", "Nafi", "Safietou"
]

GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
# Répartition approximative (simplifiée pour l'exemple)
POIDS_GROUPES = [0.28, 0.02, 0.23, 0.02, 0.04, 0.01, 0.38, 0.02]

PROFESSIONS = [
    "Etudiant", "Commerçant", "Enseignant", "Mécanicien", "Agriculteur", "Fonctionnaire",
    "Informaticien", "Infirmier", "Chauffeur", "Maçon", "Tailleur", "Comptable",
    "Électricien", "Journaliste", "Avocat", "Sans emploi", "Ingénieur", "Architecte"
]

OPERATEURS_TEL = ["77", "78", "70", "76", "75"]

# =============================================================================
# CLASSES ET FONCTIONS
# =============================================================================

class DonneurGenerator:
    def __init__(self, seed=None):
        if seed:
            random.seed(seed)
        self.generated_emails = set()
        self.generated_phones = set()

    def _generate_phone(self) -> str:
        while True:
            prefix = random.choice(OPERATEURS_TEL)
            suffix = f"{random.randint(1000000, 9999999)}"
            phone = f"+221 {prefix} {suffix[:3]} {suffix[3:5]} {suffix[5:]}"
            if phone not in self.generated_phones:
                self.generated_phones.add(phone)
                return phone

    def _generate_email(self, prenom: str, nom: str) -> str:
        base = f"{prenom.lower()}.{nom.lower()}"
        base = base.replace(" ", "")
        suffix = ""
        count = 1
        while True:
            email = f"{base}{suffix}@example.sn"
            if email not in self.generated_emails:
                self.generated_emails.add(email)
                return email
            suffix = str(count)
            count += 1

    def generate_profile(self) -> Dict[str, Any]:
        sexe = random.choice(["M", "F"])
        prenom = random.choice(PRENOMS_HOMMES if sexe == "M" else PRENOMS_FEMMES)
        nom = random.choice(NOMS_SENEGAL)
        
        region = random.choice(list(REGIONS_DEPARTEMENTS.keys()))
        departement = random.choice(REGIONS_DEPARTEMENTS[region])
        
        # Âge pondéré (plus de jeunes)
        age = int(random.triangular(18, 65, 25))
        
        # Groupe sanguin pondéré
        groupe = random.choices(GROUPES_SANGUINS, weights=POIDS_GROUPES, k=1)[0]
        
        # Date dernier don
        days_ago = random.randint(0, 730) # 2 ans max
        last_donation = datetime.date.today() - datetime.timedelta(days=days_ago)
        
        # Statut actif: si don < 6 mois
        is_active = days_ago < 180
        
        return {
            "id": f"DON-{random.randint(10000, 99999)}",
            "prenom": prenom,
            "nom": nom,
            "sexe": sexe,
            "age": age,
            "telephone": self._generate_phone(),
            "email": self._generate_email(prenom, nom),
            "adresse": f"Quartier {random.choice(['Escale', 'Médina', 'HLM', 'Plateau', 'Diamaguène'])}, {departement}",
            "region": region,
            "departement": departement,
            "groupe_sanguin": groupe,
            "profession": random.choice(PROFESSIONS),
            "date_dernier_don": last_donation.isoformat(),
            "frequence_annuelle": random.randint(1, 4) if is_active else random.randint(0, 2),
            "statut_actif": is_active
        }

    def generate_dataset(self, count: int) -> List[Dict[str, Any]]:
        print(f"Génération de {count} profils...")
        return [self.generate_profile() for _ in range(count)]

def analyze_data(data: List[Dict[str, Any]]):
    print("\n=== RAPPORT D'ANALYSE ===")
    total = len(data)
    
    # Répartition par Région
    regions = Counter(d["region"] for d in data)
    print("\n--- Répartition par Région ---")
    for reg, count in regions.most_common():
        print(f"{reg}: {count} ({count/total*100:.1f}%)")
        
    # Répartition par Groupe Sanguin
    groupes = Counter(d["groupe_sanguin"] for d in data)
    print("\n--- Répartition par Groupe Sanguin ---")
    for grp, count in groupes.most_common():
        print(f"{grp}: {count} ({count/total*100:.1f}%)")
        
    # Pyramide des âges
    ages = [d["age"] for d in data]
    avg_age = sum(ages) / total
    print(f"\nÂge moyen: {avg_age:.1f} ans")
    
    # Actifs vs Inactifs
    actifs = sum(1 for d in data if d["statut_actif"])
    print(f"\nDonneurs Actifs: {actifs} ({actifs/total*100:.1f}%)")

def export_data(data: List[Dict[str, Any]]):
    # JSON Export
    with open("donneurs_senegal_2000.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nFichier JSON généré: donneurs_senegal_2000.json")
    
    # CSV Export
    if not data:
        return
        
    keys = data[0].keys()
    with open("donneurs_senegal_2000.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)
    print(f"Fichier CSV généré: donneurs_senegal_2000.csv")

if __name__ == "__main__":
    generator = DonneurGenerator(seed=42)
    dataset = generator.generate_dataset(2000)
    
    analyze_data(dataset)
    export_data(dataset)
