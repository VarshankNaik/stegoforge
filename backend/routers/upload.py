"""
Upload Router — handles file uploads, session creation, and file info.
POST /api/upload        → upload a file, get back session_id
GET  /api/session/{id}  → get session info + uploaded file details
DELETE /api/session/{id} → cleanup session
"""

import os
import mimetypes
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import aiofiles

from utils.file_manager import (
    create_session,
    get_session_dir,
    get_session_file,
    get_session_files,
    cleanup_session,
)
from utils.security import sanitize_filename

router = APIRouter()

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "50")) * 1024 * 1024  # 50MB


# ─── POST /api/upload ─────────────────────────────���───────────────────────────
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file for analysis.
    Returns a session_id used for all subsequent tool runs.
    """

    # ── Validate filename ─────────────────────────────────────────────────────
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    safe_name = sanitize_filename(file.filename)

    # ── Create isolated session directory ─────────────────────────────────────
    session_id  = create_session()
    session_dir = get_session_dir(session_id)
    dest_path   = os.path.join(session_dir, safe_name)

    # ── Stream file to disk with size limit ───────────────────────────────────
    total_bytes = 0
    try:
        async with aiofiles.open(dest_path, "wb") as out:
            while chunk := await file.read(1024 * 64):  # 64KB chunks
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    # Clean up partial file
                    cleanup_session(session_id)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum is {os.getenv('MAX_UPLOAD_MB', '50')}MB"
                    )
                await out.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        cleanup_session(session_id)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    # ── Detect MIME type ──────────────────────────────────────────────────────
    mime_type, _ = mimetypes.guess_type(safe_name)
    if not mime_type:
        mime_type = "application/octet-stream"

    return JSONResponse(
        status_code=200,
        content={
            "session_id":  session_id,
            "filename":    safe_name,
            "size_bytes":  total_bytes,
            "size_human":  _human_size(total_bytes),
            "mime_type":   mime_type,
            "message":     "File uploaded successfully. Ready for analysis.",
        }
    )


# ─── GET /api/session/{session_id} ───────────────────────────────────────────
@router.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """Get info about an existing session and its files."""
    from utils.security import is_safe_session_id
    if not is_safe_session_id(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    file_path = get_session_file(session_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Session not found or no file uploaded")

    all_files = get_session_files(session_id)

    return {
        "session_id":    session_id,
        "primary_file":  os.path.basename(file_path),
        "all_files":     all_files,
        "file_count":    len(all_files),
    }


# ─── DELETE /api/session/{session_id} ────────────────────────────────────────
@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Clean up a session and delete all its files."""
    from utils.security import is_safe_session_id
    if not is_safe_session_id(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    cleaned = cleanup_session(session_id)
    if not cleaned:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session cleaned up", "session_id": session_id}


# ─── Helper ───────────────────────────────────────────────────────────────────
def _human_size(num_bytes: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if num_bytes < 1024:
            return f"{num_bytes:.1f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"
