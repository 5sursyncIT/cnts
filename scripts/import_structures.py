#!/usr/bin/env python3
"""Génère portal/src/components/cnts/structures-data.ts depuis l'export Excel
« Cartographie des structures de transfusion sanguine — Sénégal » (KoboToolbox).

Usage :
    python3 scripts/import_structures.py [chemin.xlsx]

Par défaut lit portal/data/cartographie-structures.xlsx. Écrit aussi
cms/data/structures.json (contenu initial de Strapi). Une fois le CMS en place,
c'est Strapi qui fait foi : structures-data.ts ne sert plus que de repli. Aucune dépendance
(lecture du .xlsx via zipfile + XML). Relancer après chaque nouvel envoi de la
Direction, puis vérifier le diff et reconstruire le portail.
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "portal/data/cartographie-structures.xlsx"
OUT = ROOT / "portal/src/components/cnts/structures-data.ts"
# Contenu initial de la collection Strapi « Structure » (importé une seule fois au démarrage du CMS).
CMS_OUT = ROOT / "cms/data/structures.json"

# Le siège n'est pas dans la cartographie : ajouté pour le CMS (côté portail : structures.ts).
# Structures signalées par la Direction mais absentes de l'export Excel (même format que les
# lignes importées). Hôpital Dalal Jamm : coordonnées de l'arrêt « Dalal Jamm » (OSM), à ~100 m.
EXTRA = [
    {"id": "pts-hopital-dalal-jamm", "name": "PTS de l’Hôpital Dalal Jamm", "kind": "pts", "region": "SNDK",
     "departement": "Guédiawaye", "commune": "Golf Sud", "hote": "Hôpital", "adresse": "Golf Sud (Cité Aliou Sow)",
     "repere": None, "lat": 14.771973, "lng": -17.408179},
]

SIEGE_CMS = {
    "name": "CNTS — Siège national", "kind": "siege", "commune": "Fann", "departement": "Dakar",
    "hote": "Centre National de Transfusion Sanguine", "adresse": "Avenue Cheikh Anta Diop, Fann-Résidence",
    "horaires": "Lun–Ven · 08h00–17h00 · Sam · 08h00–13h00", "latitude": 14.6957, "longitude": -17.4657,
}

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

# Codes région du formulaire -> codes ISO utilisés par la carte (senegal-map.tsx).
REGION = {
    "r01": "SNDK", "r02": "SNTH", "r03": "SNDB", "r04": "SNFK", "r05": "SNKL",
    "r06": "SNKA", "r07": "SNLG", "r08": "SNSL", "r09": "SNMT", "r10": "SNTC",
    "r11": "SNKE", "r12": "SNKD", "r13": "SNSE", "r14": "SNZG",
}

KIND = {"crts": "crts", "banque": "banque", "pts": "pts", "dépôt de sang": "depot", "depot de sang": "depot"}

HOTE = {"hopital": "Hôpital", "hôpital": "Hôpital"}

# Corrections de saisie (fautes de frappe, casse) — clé : valeur brute.
FIX = {
    "Centre hospitalier régional koldaa": "Centre hospitalier régional de Kolda",
    "Centre régional de transfusion sanguine de Kaolack": "CRTS de Kaolack",
    "Centre de santé de nioro": "Centre de santé de Nioro",
    "Centre hospitalier regional Amath Dansokho de Kedougou": "Centre hospitalier régional Amath Dansokho de Kédougou",
    "Centre Hospitalier national mathlaboul fawzeyni de touba": "Centre hospitalier national Matlaboul Fawzeyni de Touba",
    "Centre Hôpital Régional de Tambacounda": "Centre hospitalier régional de Tambacounda",
    "Poste de transfusion sanguine de Roi Baudoin": "Poste de transfusion sanguine de Roi Baudouin",
    "Saint LOUIS": "Saint-Louis",
    "Saint Louis": "Saint-Louis",
    "Touba mosquée": "Touba Mosquée",
    "Guediawaye": "Guédiawaye",
    "Sam notaire": "Sam Notaire",
    "KADIOR": "Kadior",
    "DIALLO BOUGOU": "Diallo Bougou",
    "Keury kao": "Keury Kao",
    "Banque de sang de Saint Louis": "Banque de sang de Saint-Louis",
    "Medina gounass": "Médina Gounass",
    "Dianatou mahwa": "Dianatou Mahwa",
    "S’en’ eau de Saint Louis": "Sen'Eau de Saint-Louis",
    "Linguere/ Quartier Thiélly Nord": "Quartier Thiélly Nord",
    "À côté du trésor public de Linguere et du tribunal": "À côté du Trésor public et du tribunal",
    "Thierno kandji/Diourbel": "Thierno Kandji",
    "Stade De Football/ hôpital lubke": "Stade de football",
    "Pres conseil départemental": "Près du Conseil départemental",
    "Près du marché centrale": "Près du marché central",
    "Camp sapeur de koungheul": "Camp des sapeurs-pompiers",
    "Camp sapeur de bakel": "Camp des sapeurs-pompiers",
    "Route diourbel kaolack": "Route Diourbel–Kaolack",
    "Leona": "Léona",
    "Hôpital Elhadji Ibrahima Niass": "Hôpital El Hadji Ibrahima Niass",
    "Bambali/ Km1 Route de Marsassoum": "Bambali, km 1 route de Marsassoum",
    "Camp Militaire de Tambacounda, en face de l'armée de l'air": "Camp militaire, en face de l'armée de l'air",
    "32 ème Bataillon": "32ᵉ Bataillon",
    "Lekku fi": "Lekku Fi",
    "Koungheul ville": "Koungheul Ville",
    "Keur khar": "Keur Khar",
    "Route Nationale angle Touba Toul": "Route nationale, angle Touba Toul",
    "La poste finance": "La Poste Finances",
}


def fix(v: str) -> str:
    v = re.sub(r"\s+", " ", (v or "").strip())
    return FIX.get(v, v)


def slug(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def rows(path: Path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")))
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    out = []
    for row in sheet.iter(f"{{{NS['m']}}}row"):
        vals = {}
        for c in row.findall("m:c", NS):
            col = re.match(r"[A-Z]+", c.get("r")).group()
            v = c.find("m:v", NS)
            if v is None:
                inl = c.find("m:is", NS)
                vals[col] = "".join(t.text or "" for t in inl.iter(f"{{{NS['m']}}}t")) if inl is not None else ""
            else:
                vals[col] = shared[int(v.text)] if c.get("t") == "s" else v.text
        out.append(vals)
    header = out[0]
    return [{header[k]: r.get(k, "") for k in header} for r in out[1:] if any(r.values())]


def main():
    data = []
    seen = set()
    for r in rows(SRC):
        name = fix(r["nom_structure"])
        kind = KIND.get(r["type_structure"].strip().lower())
        region = REGION.get(r["region"].strip().lower())
        if not (name and kind and region):
            sys.exit(f"Ligne invalide : {r}")
        sid = slug(name)
        while sid in seen:
            sid += "-2"
        seen.add(sid)
        hote = fix(r["etablissement_hote"])
        data.append({
            "id": sid,
            "name": name,
            "kind": kind,
            "region": region,
            "departement": fix(r["departement"]),
            "commune": fix(r["commune"]),
            "hote": HOTE.get(hote.lower(), hote),
            "adresse": fix(r.get("adresse", "")) or None,
            "repere": fix(r.get("point_repere", "")) or None,
            "lat": round(float(r["_gps_latitude"]), 6),
            "lng": round(float(r["_gps_longitude"]), 6),
        })
    data += EXTRA
    order = {"crts": 0, "banque": 1, "pts": 2, "depot": 3}
    data.sort(key=lambda s: (s["region"], order[s["kind"]], s["name"]))

    lines = [
        "// Fichier GÉNÉRÉ par scripts/import_structures.py — ne pas modifier à la main.",
        f"// Source : {SRC.name} (cartographie des structures de transfusion sanguine, Direction du CNTS).",
        'import type { Structure } from "./structures";',
        "",
        "export const STRUCTURES_DATA: Structure[] = [",
    ]
    for s in data:
        clean = {k: v for k, v in s.items() if v is not None}
        lines.append("  " + json.dumps(clean, ensure_ascii=False) + ",")
    lines += ["];", ""]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"{len(data)} structures -> {OUT.relative_to(ROOT)}")

    cms = [SIEGE_CMS] + [
        {k: v for k, v in {
            "name": s["name"], "kind": s["kind"], "commune": s["commune"], "departement": s["departement"],
            "hote": s["hote"], "adresse": s["adresse"], "repere": s["repere"],
            "latitude": s["lat"], "longitude": s["lng"],
        }.items() if v is not None}
        for s in data
    ]
    CMS_OUT.write_text(json.dumps(cms, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(cms)} structures -> {CMS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
