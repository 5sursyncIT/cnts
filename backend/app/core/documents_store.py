"""Stockage privé des documents remis aux donneurs (attestations, certificats…).

Les fichiers sont hors de /static : ils ne sont servis que par les routes
authentifiées (donneur concerné ou personnel du module donneurs).
"""

import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings

MAX_BYTES = 10 * 1024 * 1024
CHUNK = 64 * 1024
# Type MIME → (extension, contrôle de la signature du fichier).
TYPES = {
    "application/pdf": (".pdf", lambda b: b.startswith(b"%PDF-")),
    "image/png": (".png", lambda b: b.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/jpeg": (".jpg", lambda b: b.startswith(b"\xff\xd8\xff")),
}


def _dir() -> Path:
    path = Path(settings.documents_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def chemin(cle: str) -> Path:
    # La clé est générée par nous (uuid + extension) ; on refuse tout séparateur par prudence.
    if "/" in cle or "\\" in cle or cle.startswith("."):
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    return _dir() / cle


async def enregistrer(fichier: UploadFile) -> tuple[str, str, int]:
    """Enregistre le fichier après contrôle du type et de la taille. Renvoie (clé, mime, taille)."""
    mime = fichier.content_type or ""
    if mime not in TYPES:
        raise HTTPException(status_code=415, detail="Formats acceptés : PDF, PNG ou JPEG")
    extension, signature_ok = TYPES[mime]
    premier = await fichier.read(CHUNK)
    if not signature_ok(premier):
        raise HTTPException(status_code=415, detail="Le contenu du fichier ne correspond pas à son format")

    cle = f"{uuid.uuid4().hex}{extension}"
    cible = chemin(cle)
    total = 0
    try:
        with cible.open("xb") as out:
            bloc = premier
            while bloc:
                total += len(bloc)
                if total > MAX_BYTES:
                    raise HTTPException(status_code=413, detail="Fichier trop volumineux (10 Mo maximum)")
                out.write(bloc)
                bloc = await fichier.read(CHUNK)
    except Exception:
        cible.unlink(missing_ok=True)
        raise
    finally:
        await fichier.close()
    return cle, mime, total


def supprimer(cle: str | None) -> None:
    if cle:
        chemin(cle).unlink(missing_ok=True)
