from pathlib import Path
import uuid

from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter(prefix="/upload")

MAX_IMAGE_BYTES = 5 * 1024 * 1024
CHUNK_SIZE = 64 * 1024
IMAGE_TYPES = {
    "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
    "image/webp": (".webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
}


@router.post("", response_model=dict[str, str])
async def upload_file(file: UploadFile = File(...)) -> dict[str, str]:
    """Accepte uniquement une petite image reconnue par sa signature."""
    image_type = IMAGE_TYPES.get(file.content_type or "")
    if image_type is None:
        raise HTTPException(status_code=415, detail="Format d'image non pris en charge")

    extension, has_signature = image_type
    first_chunk = await file.read(CHUNK_SIZE)
    if not has_signature(first_chunk):
        raise HTTPException(status_code=415, detail="Contenu de l'image invalide")

    upload_dir = Path("static/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_name = f"{uuid.uuid4()}{extension}"
    file_path = upload_dir / file_name
    total = 0
    try:
        with file_path.open("xb") as target:
            chunk = first_chunk
            while chunk:
                total += len(chunk)
                if total > MAX_IMAGE_BYTES:
                    raise HTTPException(status_code=413, detail="Image trop volumineuse")
                target.write(chunk)
                chunk = await file.read(CHUNK_SIZE)
    except Exception:
        file_path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    return {"url": f"/static/uploads/{file_name}"}
