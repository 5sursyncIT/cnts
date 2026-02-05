import shutil
from pathlib import Path
from typing import Any
import uuid

from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter(prefix="/upload")


@router.post("", response_model=dict[str, str])
async def upload_file(file: UploadFile = File(...)) -> Any:
    """
    Upload a file.
    """
    try:
        # Generate a unique filename
        file_ext = Path(file.filename).suffix
        file_name = f"{uuid.uuid4()}{file_ext}"
        upload_dir = Path("static/uploads")
        file_path = upload_dir / file_name

        # Ensure directory exists
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return the URL
        # Assuming the API is served at the root or /api, and static is mounted at /static
        # The frontend will construct the full URL
        return {"url": f"/static/uploads/{file_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not upload file: {str(e)}")
