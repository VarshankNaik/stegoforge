"""
Analyze Router — trigger tool runs and get tool metadata.
GET  /api/tools                          → list all tools + categories
GET  /api/tools/{category}               → list tools in a category
POST /api/analyze/{session_id}/{tool_key} → run a tool (non-streaming, full output)
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from tools.registry import TOOLS, CATEGORIES, QUICK_TOOLS, get_tools_by_category
from tools.runner import runner
from utils.security import is_safe_session_id, is_whitelisted_tool
from utils.output_parser import find_flags

router = APIRouter()


# ─── GET /api/tools ───────────────────────────────────────────────────────────
@router.get("/tools")
async def list_tools():
    """Return all tools grouped by category with metadata."""
    return {
        "tools":       TOOLS,
        "categories":  CATEGORIES,
        "quick_tools": QUICK_TOOLS,
        "by_category": get_tools_by_category(),
        "total":       len(TOOLS),
    }


# ─── GET /api/tools/category/{category} ──────────────────────────────────────
@router.get("/tools/category/{category}")
async def list_tools_by_category(category: str):
    """Return tools filtered by category."""
    if category not in CATEGORIES:
        raise HTTPException(
            status_code=404,
            detail=f"Category '{category}' not found. Available: {list(CATEGORIES.keys())}"
        )
    grouped = get_tools_by_category()
    return {
        "category": category,
        "meta":     CATEGORIES[category],
        "tools":    grouped.get(category, []),
    }


# ─── GET /api/tools/{tool_key} ───────────────────────────────────────────────
@router.get("/tools/{tool_key}")
async def get_tool_info(tool_key: str):
    """Return info about a single tool."""
    if tool_key not in TOOLS:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_key}' not found")
    return TOOLS[tool_key]


# ─── POST /api/analyze/{session_id}/{tool_key} ────────────────────────────────
@router.post("/analyze/{session_id}/{tool_key}")
async def run_tool(session_id: str, tool_key: str):
    """
    Run a single tool against the uploaded file.
    Returns a StreamingResponse — output lines streamed as plain text.
    Frontend Terminal.jsx reads this stream.
    """

    # ── Validate inputs ───────────────────────────────────────────────────────
    if not is_safe_session_id(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    if not is_whitelisted_tool(tool_key, TOOLS):
        raise HTTPException(
            status_code=400,
            detail=f"Tool '{tool_key}' is not whitelisted"
        )

    # ── Stream output from docker exec ────────────────────────────────────────
    async def generate():
        collected = []
        async for line in runner.stream_tool(tool_key, session_id):
            collected.append(line)
            yield line

        # After tool finishes — scan for flags and append summary
        full_output = "".join(collected)
        flags = find_flags(full_output)
        if flags:
            yield "\n\033[1;33m" + "─" * 40 + "\033[0m\n"
            yield "\033[1;33m🚩 FLAGS FOUND:\033[0m\n"
            for flag in flags:
                yield f"\033[1;33m   → {flag}\033[0m\n"
            yield "\033[1;33m" + "─" * 40 + "\033[0m\n"

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "X-Tool":       tool_key,
            "X-Session":    session_id,
            "Cache-Control": "no-cache",
        }
    )


# ─── POST /api/analyze/{session_id}/batch ─────────────────────────────────────
@router.post("/analyze/{session_id}/batch")
async def run_batch(session_id: str, body: dict):
    """
    Run multiple tools in sequence.
    Body: { "tools": ["file", "strings", "exiftool"] }
    Streams all output concatenated.
    """
    if not is_safe_session_id(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")

    tool_keys = body.get("tools", [])
    if not tool_keys:
        raise HTTPException(status_code=400, detail="No tools specified")

    # Filter to whitelisted only
    valid_keys = [k for k in tool_keys if is_whitelisted_tool(k, TOOLS)]
    invalid    = [k for k in tool_keys if k not in valid_keys]

    async def generate():
        if invalid:
            yield f"\033[1;31m[WARN] Skipping non-whitelisted tools: {invalid}\033[0m\n\n"

        all_flags = []

        for key in valid_keys:
            async for line in runner.stream_tool(key, session_id):
                yield line
            yield "\n"

        # Final flags summary
        if all_flags:
            yield "\n\033[1;33m" + "═" * 50 + "\033[0m\n"
            yield "\033[1;33m🚩 ALL FLAGS FOUND IN THIS RUN:\033[0m\n"
            for flag in set(all_flags):
                yield f"\033[1;33m   → {flag}\033[0m\n"
            yield "\033[1;33m" + "═" * 50 + "\033[0m\n"

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache"}
    )
