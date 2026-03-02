"""
Runner — executes whitelisted tools inside the stegoforge-tools Docker container.
NEVER runs anything on the host. All execution goes through docker exec.
"""

import os
import asyncio
import shlex
from typing import AsyncGenerator

from tools.registry import TOOLS, get_tool
from utils.security import is_safe_session_id, is_whitelisted_tool

TOOLS_CONTAINER = os.getenv("TOOLS_CONTAINER", "stegoforge-tools")
UPLOAD_DIR      = os.getenv("UPLOAD_DIR", "/data/uploads")


class ToolRunner:

    def _build_command(self, tool_key: str, session_id: str) -> list[str] | None:
        """
        Build the full docker exec command for a tool.
        Substitutes {file} and {session_dir} placeholders safely.
        Returns None if tool is not whitelisted.
        """
        tool = get_tool(tool_key)
        if not tool:
            return None

        session_dir  = os.path.join(UPLOAD_DIR, session_id)
        session_file = self._get_session_file(session_id)

        if not session_file:
            return None

        # Substitute placeholders — no shell interpolation, pure list args
        cmd = []
        for part in tool["cmd"]:
            part = part.replace("{file}",        session_file)
            part = part.replace("{session_dir}", session_dir)
            cmd.append(part)

        # Wrap in docker exec
        docker_cmd = [
            "docker", "exec",
            TOOLS_CONTAINER,
        ] + cmd

        return docker_cmd

    def _get_session_file(self, session_id: str) -> str | None:
        """Find the uploaded file in the session directory."""
        session_dir = os.path.join(UPLOAD_DIR, session_id)
        if not os.path.isdir(session_dir):
            return None
        files = [
            f for f in os.listdir(session_dir)
            if not f.startswith(".")
            and os.path.isfile(os.path.join(session_dir, f))
        ]
        if not files:
            return None
        return os.path.join(session_dir, files[0])

    async def stream_tool(
        self,
        tool_key: str,
        session_id: str,
    ) -> AsyncGenerator[str, None]:
        """
        Run a tool via docker exec and yield output lines as they arrive.
        This is an async generator — yields one line at a time.
        """
        # ── Security checks ───────────────────────────────────────────────────
        if not is_safe_session_id(session_id):
            yield "[ERROR] Invalid session ID\n"
            return

        if not is_whitelisted_tool(tool_key, TOOLS):
            yield f"[ERROR] Tool '{tool_key}' is not whitelisted\n"
            return

        tool    = get_tool(tool_key)
        cmd     = self._build_command(tool_key, session_id)

        if not cmd:
            yield f"[ERROR] Could not build command for '{tool_key}' — file not found?\n"
            return

        # ── Header ────────────────────────────────────────────────────────────
        yield f"\033[1;36m{'='*60}\033[0m\n"
        yield f"\033[1;36m🔧 Tool: {tool['name']}\033[0m\n"
        yield f"\033[0;37m   {tool['description']}\033[0m\n"
        yield f"\033[1;36m{'='*60}\033[0m\n\n"

        # ── Execute via docker exec ────────────────────────────────────────────
        timeout = tool.get("timeout", 30)

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,  # merge stderr into stdout
            )

            # Stream output line by line
            async def read_with_timeout():
                try:
                    async with asyncio.timeout(timeout):
                        async for line in process.stdout:
                            decoded = line.decode("utf-8", errors="replace")
                            yield decoded
                        await process.wait()
                except asyncio.TimeoutError:
                    process.kill()
                    yield f"\n\033[1;31m[TIMEOUT] Tool exceeded {timeout}s limit\033[0m\n"

            async for line in read_with_timeout():
                yield line

            # ── Footer ────────────────────────────────────────────────────────
            returncode = process.returncode or 0
            if returncode == 0:
                yield f"\n\033[1;32m✅ Completed (exit 0)\033[0m\n"
            else:
                yield f"\n\033[1;33m⚠️  Completed (exit {returncode})\033[0m\n"

        except FileNotFoundError:
            yield "\033[1;31m[ERROR] docker not found — is Docker running?\033[0m\n"
        except Exception as e:
            yield f"\033[1;31m[ERROR] {str(e)}\033[0m\n"

        yield f"\033[1;36m{'='*60}\033[0m\n\n"


# ── Singleton instance ────────────────────────────────────────────────────────
runner = ToolRunner()
