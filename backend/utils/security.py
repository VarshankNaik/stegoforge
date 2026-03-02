import os
import re
import unicodedata

SAFE_FILENAME_RE = re.compile(r"[^\w\.\-]")
MAX_FILENAME_LENGTH = 128


def sanitize_filename(filename: str) -> str:
    """Strip path traversal, unicode tricks, and unsafe characters."""
    filename = unicodedata.normalize("NFKD", filename)
    filename = os.path.basename(filename)
    filename = SAFE_FILENAME_RE.sub("_", filename)
    filename = filename[:MAX_FILENAME_LENGTH]
    if not filename or filename.startswith("."):
        filename = "uploaded_file"
    return filename


def is_safe_session_id(session_id: str) -> bool:
    """Session IDs must be valid UUIDs only — no injection possible."""
    uuid_re = re.compile(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        re.IGNORECASE,
    )
    return bool(uuid_re.match(session_id))


def is_whitelisted_tool(tool_key: str, registry: dict) -> bool:
    """Check if tool_key exists in the registry whitelist."""
    return tool_key in registry
