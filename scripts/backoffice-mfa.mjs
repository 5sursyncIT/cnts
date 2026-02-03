import { authenticator } from "otplib";

const email = process.env.BACKOFFICE_ADMIN_EMAIL ?? "admin@cnts.local";
const issuer = process.env.BACKOFFICE_MFA_ISSUER ?? "SGI-CNTS";

const rawSecret = process.env.BACKOFFICE_ADMIN_TOTP_SECRET;
const secret =
  rawSecret && rawSecret.trim().length > 0 ? rawSecret.replace(/\s+/g, "") : authenticator.generateSecret();

const token = authenticator.generate(secret);
const uri = authenticator.keyuri(email, issuer, secret);

const timeRemainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);

process.stdout.write(
  [
    "Back Office MFA (TOTP)",
    `- BACKOFFICE_ADMIN_EMAIL: ${email}`,
    `- Secret (base32): ${secret}`,
    `- Code (actuel): ${token}`,
    `- Valide encore: ~${timeRemainingSeconds}s`,
    `- OTPAuth URI: ${uri}`,
    "",
    "Astuce: ajoutez le secret dans votre app d’authentification (Google Authenticator, Authy, etc.).",
    "Ensuite, exportez BACKOFFICE_ADMIN_TOTP_SECRET=<secret> et redémarrez le serveur Next.js."
  ].join("\n")
);

