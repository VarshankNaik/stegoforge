import os
import shutil
import uuid

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/data/uploads")


def create_session() -> str:
    """Create a new UUID session and its temp directory."""
    session_id = str(uuid.uuid4())
    session_dir = get_session_dir(session_id)
    os.makedirs(session_dir, exist_ok=True)
    return session_id


def get_session_dir(session_id: str) -> str:
    """Return the temp directory path for a session."""
    return os.path.join(UPLOAD_DIR, session_id)


def get_session_file(session_id: str) -> str | None:
    """Return the uploaded file path for a session."""
    session_dir = get_session_dir(session_id)
    if not os.path.isdir(session_dir):
        return None
    files = [
        f for f in os.listdir(session_dir)
        if not f.startswith(".") and os.path.isfile(os.path.join(session_dir, f))
    ]
    if not files:
        return None
    return os.path.join(session_dir, files[0])


def cleanup_session(session_id: str) -> bool:
    """Delete a session directory and all its files."""
    session_dir = get_session_dir(session_id)
    if os.path.isdir(session_dir):
        shutil.rmtree(session_dir)
        return True
    return False


def get_session_files(session_id: str) -> list[dict]:
    """List all files in a session directory."""
    session_dir = get_session_dir(session_id)
    results = []
    if not os.path.isdir(session_dir):
        return results
    for root, dirs, files in os.walk(session_dir):
        for fname in files:
            fpath = os.path.join(root, fname)
            rel_path = os.path.relpath(fpath, session_dir)
            results.append({
                "name": fname,
                "path": rel_path,
                "size": os.path.getsize(fpath),
            })
    return results
