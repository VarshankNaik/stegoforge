import re
import json
import os

# ─── Built-in CTF flag patterns ───────────────────────────────────────────────
DEFAULT_FLAG_PATTERNS = [
    r"CTF\{[^}]+\}",
    r"flag\{[^}]+\}",
    r"FLAG\{[^}]+\}",
    r"picoCTF\{[^}]+\}",
    r"htb\{[^}]+\}",
    r"HTB\{[^}]+\}",
    r"thm\{[^}]+\}",
    r"THM\{[^}]+\}",
    r"DUCTF\{[^}]+\}",
    r"darkCTF\{[^}]+\}",
    r"PCTF\{[^}]+\}",
    r"zer0pts\{[^}]+\}",
    r"corctf\{[^}]+\}",
    r"inctf\{[^}]+\}",
    r"INCTF\{[^}]+\}",
    r"csictf\{[^}]+\}",
    r"nahamcon\{[^}]+\}",
]

# ─── Custom patterns file (persisted on disk) ─────────────────────────────────
CUSTOM_PATTERNS_FILE = os.getenv("CUSTOM_PATTERNS_FILE", "/data/custom_flags.json")


def _load_custom_patterns() -> list[str]:
    """Load custom flag prefixes from disk."""
    try:
        if os.path.exists(CUSTOM_PATTERNS_FILE):
            with open(CUSTOM_PATTERNS_FILE, "r") as f:
                data = json.load(f)
                return data.get("patterns", [])
    except Exception:
        pass
    return []


def _save_custom_patterns(patterns: list[str]) -> bool:
    """Save custom flag prefixes to disk."""
    try:
        os.makedirs(os.path.dirname(CUSTOM_PATTERNS_FILE), exist_ok=True)
        with open(CUSTOM_PATTERNS_FILE, "w") as f:
            json.dump({"patterns": patterns}, f, indent=2)
        return True
    except Exception:
        return False


def add_custom_pattern(prefix: str) -> dict:
    """
    Add a custom flag prefix like 'HiO' → matches HiO{...}
    Returns status dict.
    """
    # Sanitize — only allow word chars
    prefix = prefix.strip()
    if not re.match(r'^[\w\-\.]+$', prefix):
        return {"success": False, "error": "Invalid prefix — only letters, numbers, dash, dot allowed"}

    # Build regex
    pattern = rf"{re.escape(prefix)}\{{[^}}]+\}}"

    existing = _load_custom_patterns()

    # Check duplicate
    if pattern in existing or pattern in DEFAULT_FLAG_PATTERNS:
        return {"success": False, "error": f"Pattern for '{prefix}' already exists"}

    existing.append(pattern)
    _save_custom_patterns(existing)

    return {
        "success": True,
        "prefix":  prefix,
        "pattern": pattern,
        "message": f"Custom flag format '{prefix}{{...}}' added successfully",
    }


def remove_custom_pattern(prefix: str) -> dict:
    """Remove a custom flag prefix."""
    prefix  = prefix.strip()
    pattern = rf"{re.escape(prefix)}\{{[^}}]+\}}"

    existing = _load_custom_patterns()
    if pattern not in existing:
        return {"success": False, "error": f"Pattern for '{prefix}' not found"}

    existing.remove(pattern)
    _save_custom_patterns(existing)

    return {"success": True, "message": f"Pattern '{prefix}{{...}}' removed"}


def get_all_patterns() -> dict:
    """Return all patterns — built-in + custom."""
    custom = _load_custom_patterns()
    return {
        "builtin": DEFAULT_FLAG_PATTERNS,
        "custom":  custom,
        "total":   len(DEFAULT_FLAG_PATTERNS) + len(custom),
    }


def _get_compiled_patterns() -> list:
    """Compile all patterns (builtin + custom) into regex objects."""
    all_raw = DEFAULT_FLAG_PATTERNS + _load_custom_patterns()
    compiled = []
    for raw in all_raw:
        try:
            compiled.append(re.compile(raw, re.IGNORECASE))
        except re.error:
            pass
    return compiled


def find_flags(text: str) -> list[str]:
    """Scan output text for all flag patterns (builtin + custom)."""
    flags = []
    for pattern in _get_compiled_patterns():
        matches = pattern.findall(text)
        flags.extend(matches)
    return list(set(flags))


def highlight_flags_ansi(text: str) -> str:
    """Wrap all flag matches in bright yellow ANSI for xterm.js."""
    YELLOW_BOLD = "\033[1;33m"
    RESET       = "\033[0m"
    for pattern in _get_compiled_patterns():
        text = pattern.sub(
            lambda m: f"{YELLOW_BOLD}🚩 {m.group(0)} {RESET}",
            text
        )
    return text


def parse_output_line(line: str) -> dict:
    """Parse a single line of tool output."""
    flags = find_flags(line)
    return {
        "line":     highlight_flags_ansi(line),
        "flags":    flags,
        "has_flag": len(flags) > 0,
    }
