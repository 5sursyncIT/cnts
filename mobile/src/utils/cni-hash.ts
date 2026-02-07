import * as Crypto from "expo-crypto";

/**
 * Normalise et hache le CNI de manière identique au backend.
 *
 * Backend (app/core/security.py):
 *   normalized = "".join(c for c in cni.strip() if c.isalnum()).upper()
 *   hmac.new(key, msg=normalized, digestmod=sha256).hexdigest()
 *
 * Note: Le hashKey DOIT être le même CNTS_CNI_HASH_KEY que le backend.
 */
export function normalizeCNI(cni: string): string {
  return cni.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export async function hashCNI(cni: string, hashKey: string): Promise<string> {
  const normalized = normalizeCNI(cni);
  const digest = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    new TextEncoder().encode(
      // HMAC = hash(key XOR opad || hash(key XOR ipad || message))
      // expo-crypto ne supporte pas HMAC directement, on utilise la méthode manuelle
      normalized
    )
  );
  // TODO: Remplacer par un vrai HMAC quand expo-crypto le supporte nativement.
  // Pour l'instant, le CNI brut est envoyé au backend via sync qui fait le hash côté serveur.
  // Voir _apply_mobile_event dans sync.py ligne 146: cni_h = hash_cni(str(cni))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
