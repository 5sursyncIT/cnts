import datetime as dt
import re

def calculate_checksum(data: str) -> str:
    """
    Calcule le checksum ISBT 128 (modulo 37-2) pour une chaîne donnée.
    Utilisé pour les DIN et les codes produits.
    """
    iso7064_map = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*"
    checksum = 0
    for char in data:
        if char not in iso7064_map:
            raise ValueError(f"Caractère invalide pour ISBT 128: {char}")
        value = iso7064_map.index(char)
        checksum = ((checksum + value) * 2) % 37
    
    check_char_value = (38 - checksum) % 37
    return iso7064_map[check_char_value]

def validate_din_structure(din: str) -> dict:
    """
    Valide la structure d'un DIN ISBT 128.
    Accepte le format avec ou sans préfixe '='.
    Retourne un dict avec 'valid', 'message' et 'normalized_din' (sans '=' et sans checksum).
    """
    clean_din = din.strip().upper()
    if clean_din.startswith("="):
        clean_din = clean_din[1:]
    
    # Structure attendue: 13 chars (Country+Center+Year+Seq) + 2 chars (Flag) + optional 1 char (Check)
    # Total data length without check: 15 chars.
    # Total data length with check: 16 chars.
    
    if not (15 <= len(clean_din) <= 16):
        return {"valid": False, "message": "Longueur DIN invalide (attendu 15 ou 16 caractères hors préfixe)"}
    
    # Regex pour A9999YYNNNNNNFF (15 chars)
    # A: [A-Z0-9]
    # 9999: [A-Z0-9]{4}
    # YY: [0-9]{2}
    # NNNNNN: [0-9]{6}
    # FF: [0-9]{2} (Flags)
    pattern = r"^[A-Z0-9][A-Z0-9]{4}[0-9]{2}[0-9]{6}[0-9]{2}"
    if len(clean_din) == 16:
        pattern += r"[A-Z0-9*]$" # Check char
    else:
        pattern += r"$"
        
    if not re.match(pattern, clean_din):
         return {"valid": False, "message": "Format DIN invalide (Country/Center/Year/Seq/Flag)"}

    # Validation checksum si présent
    if len(clean_din) == 16:
        data_part = clean_din[:15]
        check_digit = clean_din[15]
        expected_check = calculate_checksum(data_part)
        if check_digit != expected_check:
            return {
                "valid": False, 
                "message": f"Checksum invalide (attendu {expected_check}, reçu {check_digit})"
            }
        return {"valid": True, "message": "DIN valide", "normalized_din": data_part}
    
    return {"valid": True, "message": "DIN valide (sans checksum)", "normalized_din": clean_din}


def generate_datamatrix_content(
    din: str,
    product_code: str,
    expiration_date: dt.date,
    blood_group: str | None,
    collection_date: dt.date | None = None
) -> str:
    """
    Génère le contenu complet d'un DataMatrix ISBT 128 concaténé.
    """
    # 1. DIN
    # On s'assure que le DIN est propre (pas de =, pas de checksum car on va le recalculer ou l'utiliser tel quel?)
    # La norme demande souvent d'inclure le checksum dans le code-barres.
    
    validation = validate_din_structure(din)
    if not validation["valid"]:
        raise ValueError(f"DIN invalide: {validation['message']}")
    
    normalized_din = validation["normalized_din"]
    # Recalculer le checksum pour être sûr
    check_char = calculate_checksum(normalized_din)
    full_din = f"={normalized_din}{check_char}" # = + 15 data + 1 check
    
    data = full_din

    # 2. Product Code
    # Format: =<ProductCode> (ex: E0305V00)
    # product_code doit être standardisé (ex: E0305V00)
    if product_code:
        # Nettoyage
        clean_code = product_code.strip().upper()
        if clean_code.startswith("="):
            clean_code = clean_code[1:]
        data += f"={clean_code}"

    # 3. Expiration Date
    # Format: =><CYJJJ><HHMM>
    # C: 1 = 2000-2099
    year = expiration_date.year
    julian_day = expiration_date.timetuple().tm_yday
    
    # Century code logic for ISBT 128
    # 2000-2099 -> 1 (selon tableau ICCBBA)
    century_val = 1 
    y_val = year % 100
    
    # Expiration par défaut à 23:59 si pas d'heure
    date_str = f"{century_val}{y_val:02d}{julian_day:03d}2359"
    data += f"=>0{date_str}" 

    # 4. Blood Group (ABO/Rh)
    # Format: =%<GroupCode>
    group_map = {
        "A+": "5100", "A-": "0600",
        "B+": "5800", "B-": "1300",
        "AB+": "6500", "AB-": "2000",
        "O+": "4400", "O-": "9900"
    }
    # Normalisation groupe (ex: "A pos" -> "A+")
    bg_norm = blood_group.replace(" ", "").replace("pos", "+").replace("neg", "-") if blood_group else None
    
    if bg_norm and bg_norm in group_map:
        data += f"=%{group_map[bg_norm]}"

    return data
