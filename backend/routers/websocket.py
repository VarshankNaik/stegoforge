"""
WebSocket Router — real-time streaming of tool output to xterm.js frontend.
WS /ws/{session_id}/{tool_key}  → connect and receive live output
WS /ws/{session_id}/batch       → run multiple tools, stream all output
"""

import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from tools.registry import TOOLS, QUICK_TOOLS
from tools.runner import runner
from utils.security import is_safe_session_id, is_whitelisted_tool
from utils.output_parser import find_flags, parse_output_line

router = APIRouter()


# ─── WS /ws/{session_id}/{tool_key} ──────────────────────────────────────────
@router.websocket("/ws/{session_id}/{tool_key}")
async def websocket_run_tool(
    websocket: WebSocket,
    session_id: str,
    tool_key: str,
):
    """
    WebSocket endpoint — streams tool output line by line to xterm.js.
    Each message is a JSON object:
      { "type": "line",  "data": "..output line.." }
      { "type": "flag",  "data": "CTF{...}" }
      { "type": "done",  "data": "Tool finished" }
      { "type": "error", "data": "Error message" }
    """
    await websocket.accept()

    # ── Validate ──────────────────────────────────────────────────────────────
    if not is_safe_session_id(session_id):
        await websocket.send_text(json.dumps({
            "type": "error",
            "data": "Invalid session ID"
        }))
        await websocket.close()
        return

    if not is_whitelisted_tool(tool_key, TOOLS):
        await websocket.send_text(json.dumps({
            "type": "error",
            "data": f"Tool '{tool_key}' is not whitelisted"
        }))
        await websocket.close()
        return

    # ── Send start signal ─────────────────────────────────────────────────────
    tool_info = TOOLS[tool_key]
    await websocket.send_text(json.dumps({
        "type": "start",
        "data": {
            "tool":        tool_key,
            "name":        tool_info["name"],
            "description": tool_info["description"],
            "category":    tool_info["category"],
        }
    }))

    # ── Stream output ─────────────────────────────────────────────────────────
    all_flags = []
    try:
        async for line in runner.stream_tool(tool_key, session_id):
            # Parse line for flags
            parsed = parse_output_line(line)

            # Send line to terminal
            await websocket.send_text(json.dumps({
                "type": "line",
                "data": parsed["line"],
            }))

            # If flag found — send separate flag event
            if parsed["has_flag"]:
                for flag in parsed["flags"]:
                    if flag not in all_flags:
                        all_flags.append(flag)
                        await websocket.send_text(json.dumps({
                            "type": "flag",
                            "data": flag,
                        }))

    except WebSocketDisconnect:
        return
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "data": str(e),
        }))

    # ── Send done signal ──────────────────────────────────────────────────────
    await websocket.send_text(json.dumps({
        "type": "done",
        "data": {
            "tool":   tool_key,
            "flags":  all_flags,
            "message": f"Tool '{tool_info['name']}' completed",
        }
    }))

    await websocket.close()


# ─── WS /ws/{session_id}/batch ───────────────────────────────────────────────
@router.websocket("/ws/{session_id}/batch")
async def websocket_batch(
    websocket: WebSocket,
    session_id: str,
):
    """
    WebSocket batch — client sends list of tool keys,
    server streams all tools in sequence.

    Client sends:  { "tools": ["file", "strings", "exiftool"] }
    Server streams: same JSON protocol as single tool WS
    """
    await websocket.accept()

    if not is_safe_session_id(session_id):
        await websocket.send_text(json.dumps({
            "type": "error", "data": "Invalid session ID"
        }))
        await websocket.close()
        return

    # ── Wait for tool list from client ────────────────────────────────────────
    try:
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
        payload   = json.loads(raw)
        tool_keys = payload.get("tools", QUICK_TOOLS)
    except (asyncio.TimeoutError, json.JSONDecodeError):
        tool_keys = QUICK_TOOLS

    valid_keys = [k for k in tool_keys if is_whitelisted_tool(k, TOOLS)]

    await websocket.send_text(json.dumps({
        "type": "batch_start",
        "data": {"tools": valid_keys, "count": len(valid_keys)}
    }))

    # ── Run each tool ─────────────────────────────────────────────────────────
    all_flags = []
    for tool_key in valid_keys:
        tool_info = TOOLS[tool_key]

        await websocket.send_text(json.dumps({
            "type": "tool_start",
            "data": {"tool": tool_key, "name": tool_info["name"]}
        }))

        try:
            async for line in runner.stream_tool(tool_key, session_id):
                parsed = parse_output_line(line)
                await websocket.send_text(json.dumps({
                    "type": "line",
                    "data": parsed["line"],
                }))
                if parsed["has_flag"]:
                    for flag in parsed["flags"]:
                        if flag not in all_flags:
                            all_flags.append(flag)
                            await websocket.send_text(json.dumps({
                                "type": "flag",
                                "data": flag,
                            }))
        except WebSocketDisconnect:
            return

        await websocket.send_text(json.dumps({
            "type": "tool_done",
            "data": {"tool": tool_key}
        }))

    # ── All done ──────────────────────────────────────────────────────────────
    await websocket.send_text(json.dumps({
        "type": "batch_done",
        "data": {
            "tools_run": valid_keys,
            "flags":     all_flags,
            "message":   f"Batch complete — {len(valid_keys)} tools ran",
        }
    }))

    await websocket.close()
