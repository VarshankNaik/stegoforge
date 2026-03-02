"""
Flags Router — manage custom flag format patterns.
GET    /api/flags/patterns           → list all patterns
POST   /api/flags/patterns           → add custom prefix
DELETE /api/flags/patterns/{prefix}  → remove custom prefix
POST   /api/flags/test               → test text against all patterns
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.output_parser import (
    add_custom_pattern,
    remove_custom_pattern,
    get_all_patterns,
    find_flags,
)

router = APIRouter()


class AddPatternRequest(BaseModel):
    prefix: str   # e.g. "HiO" → matches HiO{...}


class TestFlagRequest(BaseModel):
    text: str


# ─── GET /api/flags/patterns ──────────────────────────────────────────────────
@router.get("/flags/patterns")
async def list_patterns():
    """List all built-in and custom flag patterns."""
    return get_all_patterns()


# ─── POST /api/flags/patterns ─────────────────────────────────────────────────
@router.post("/flags/patterns")
async def add_pattern(body: AddPatternRequest):
    """Add a custom flag prefix. e.g. prefix='HiO' matches HiO{...}"""
    if not body.prefix:
        raise HTTPException(status_code=400, detail="Prefix cannot be empty")

    result = add_custom_pattern(body.prefix)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


# ─── DELETE /api/flags/patterns/{prefix} ─────────────────────────────────────
@router.delete("/flags/patterns/{prefix}")
async def remove_pattern(prefix: str):
    """Remove a custom flag pattern by prefix."""
    result = remove_custom_pattern(prefix)

    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


# ─── POST /api/flags/test ─────────────────────────────────────────────────────
@router.post("/flags/test")
async def test_patterns(body: TestFlagRequest):
    """Test a string against all flag patterns — useful for debugging."""
    if not body.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    found = find_flags(body.text)
    return {
        "input":      body.text,
        "flags_found": found,
        "count":      len(found),
        "matched":    len(found) > 0,
    }
