"""
Tool Registry — Single source of truth for all whitelisted tools.
To add a new tool: add one entry to TOOLS dict.
"""

TOOLS: dict = {

    # ─── Basic File Analysis ──────────────────────────────────────────────────
    "file": {
        "name": "file",
        "cmd": ["file", "{file}"],
        "description": "Detect real file type regardless of extension",
        "category": "basic",
        "timeout": 10,
    },
    "strings": {
        "name": "strings",
        "cmd": ["strings", "-n", "6", "{file}"],
        "description": "Extract printable strings (min length 6)",
        "category": "basic",
        "timeout": 15,
    },
    "strings_all": {
        "name": "strings (all encodings)",
        "cmd": ["strings", "-a", "-n", "6", "{file}"],
        "description": "Extract strings from entire file including data sections",
        "category": "basic",
        "timeout": 15,
    },
    "xxd": {
        "name": "xxd",
        "cmd": ["xxd", "-l", "512", "{file}"],
        "description": "Hex dump — first 512 bytes, spot magic bytes",
        "category": "basic",
        "timeout": 10,
    },
    "xxd_full": {
        "name": "xxd (full)",
        "cmd": ["xxd", "{file}"],
        "description": "Full hex dump of file",
        "category": "basic",
        "timeout": 30,
    },
    "hexdump": {
        "name": "hexdump",
        "cmd": ["hexdump", "-C", "{file}"],
        "description": "Hex dump with ASCII column",
        "category": "basic",
        "timeout": 30,
    },
    "stat": {
        "name": "stat",
        "cmd": ["stat", "{file}"],
        "description": "File size, timestamps, inode info",
        "category": "basic",
        "timeout": 10,
    },
    "wc": {
        "name": "wc",
        "cmd": ["wc", "-c", "{file}"],
        "description": "Byte count",
        "category": "basic",
        "timeout": 10,
    },
    "head_hex": {
        "name": "head (hex)",
        "cmd": ["bash", "-c", "head -c 256 {file} | xxd"],
        "description": "First 256 bytes as hex",
        "category": "basic",
        "timeout": 10,
    },
    "tail_hex": {
        "name": "tail (hex)",
        "cmd": ["bash", "-c", "tail -c 256 {file} | xxd"],
        "description": "Last 256 bytes as hex",
        "category": "basic",
        "timeout": 10,
    },

    # ─── Metadata & EXIF ──────────────────────────────────────────────────────
    "exiftool": {
        "name": "exiftool",
        "cmd": ["exiftool", "-a", "-u", "{file}"],
        "description": "Read ALL metadata fields including custom/vendor",
        "category": "metadata",
        "timeout": 15,
    },
    "identify": {
        "name": "identify (ImageMagick)",
        "cmd": ["identify", "-verbose", "{file}"],
        "description": "ImageMagick: image dimensions, format, depth",
        "category": "metadata",
        "timeout": 15,
    },
    "mediainfo": {
        "name": "mediainfo",
        "cmd": ["mediainfo", "{file}"],
        "description": "Detailed media metadata (video/audio/image)",
        "category": "metadata",
        "timeout": 15,
    },
    "pngcheck": {
        "name": "pngcheck",
        "cmd": ["pngcheck", "-v", "{file}"],
        "description": "Validate PNG structure, list all chunks",
        "category": "metadata",
        "timeout": 10,
    },

    # ─── File Extraction & Carving ────────────────────────────────────────────
    "binwalk": {
        "name": "binwalk",
        "cmd": ["binwalk", "{file}"],
        "description": "Scan for embedded files (no extraction)",
        "category": "extraction",
        "timeout": 30,
    },
    "binwalk_extract": {
        "name": "binwalk (extract)",
        "cmd": ["binwalk", "-e", "-M", "--directory", "{session_dir}", "{file}"],
        "description": "Extract all embedded files recursively",
        "category": "extraction",
        "timeout": 60,
    },
    "foremost": {
        "name": "foremost",
        "cmd": ["foremost", "-T", "-i", "{file}", "-o", "{session_dir}/foremost_out"],
        "description": "File carving by magic bytes + footers",
        "category": "extraction",
        "timeout": 60,
    },
    "bulk_extractor": {
        "name": "bulk_extractor",
        "cmd": ["bulk_extractor", "{file}", "-o", "{session_dir}/bulk_out"],
        "description": "Extract emails, URLs, credit cards etc.",
        "category": "extraction",
        "timeout": 60,
    },
    "unzip_list": {
        "name": "unzip (list)",
        "cmd": ["unzip", "-l", "{file}"],
        "description": "List contents of ZIP archive",
        "category": "extraction",
        "timeout": 10,
    },
    "7z_list": {
        "name": "7z (list)",
        "cmd": ["7z", "l", "{file}"],
        "description": "List contents of any archive (ZIP/RAR/7z)",
        "category": "extraction",
        "timeout": 10,
    },

    # ─── Image Steganography ──────────────────────────────────────────────────
    "zsteg": {
        "name": "zsteg",
        "cmd": ["zsteg", "-a", "{file}"],
        "description": "Detect LSB in PNG/BMP — tries all channels",
        "category": "image_stego",
        "timeout": 60,
    },
    "zsteg_verbose": {
        "name": "zsteg (verbose)",
        "cmd": ["zsteg", "-v", "-a", "{file}"],
        "description": "zsteg verbose — detailed channel analysis",
        "category": "image_stego",
        "timeout": 60,
    },
    "steghide_info": {
        "name": "steghide (info)",
        "cmd": ["steghide", "info", "-sf", "{file}", "-p", ""],
        "description": "Check steghide embedding info (no password)",
        "category": "image_stego",
        "timeout": 15,
    },
    "outguess": {
        "name": "outguess",
        "cmd": ["outguess", "-r", "{file}", "/tmp/outguess_out.txt"],
        "description": "Statistical JPEG steganography extract",
        "category": "image_stego",
        "timeout": 30,
    },
    "stegdetect": {
        "name": "stegdetect",
        "cmd": ["stegdetect", "-s", "1.0", "{file}"],
        "description": "Statistical JPEG stego detector",
        "category": "image_stego",
        "timeout": 15,
    },

    # ─── Audio Steganography ──────────────────────────────────────────────────
    "sox_stat": {
        "name": "sox (stats)",
        "cmd": ["sox", "{file}", "-n", "stat"],
        "description": "Audio stats: clipping, silence, dynamic range",
        "category": "audio_stego",
        "timeout": 15,
    },
    "sox_spectrogram": {
        "name": "sox (spectrogram)",
        "cmd": ["sox", "{file}", "-n", "spectrogram", "-o", "{session_dir}/spectrogram.png"],
        "description": "Generate spectrogram PNG — images hidden in audio",
        "category": "audio_stego",
        "timeout": 30,
    },
    "ffprobe": {
        "name": "ffprobe",
        "cmd": ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", "{file}"],
        "description": "Video/audio stream analysis and metadata",
        "category": "audio_stego",
        "timeout": 15,
    },
    "ffmpeg_convert": {
        "name": "ffmpeg (to wav)",
        "cmd": ["ffmpeg", "-i", "{file}", "-y", "{session_dir}/converted.wav"],
        "description": "Convert audio to WAV format",
        "category": "audio_stego",
        "timeout": 30,
    },

    # ─── PDF & Document ───────────────────────────────────────────────────────
    "pdfinfo": {
        "name": "pdfinfo",
        "cmd": ["pdfinfo", "{file}"],
        "description": "PDF metadata and info",
        "category": "document",
        "timeout": 10,
    },
    "pdfimages": {
        "name": "pdfimages",
        "cmd": ["pdfimages", "-all", "{file}", "{session_dir}/pdfimg"],
        "description": "Extract all embedded images from PDF",
        "category": "document",
        "timeout": 30,
    },
    "pdftotext": {
        "name": "pdftotext",
        "cmd": ["pdftotext", "{file}", "-"],
        "description": "Extract all text content from PDF",
        "category": "document",
        "timeout": 15,
    },
    "qpdf": {
        "name": "qpdf",
        "cmd": ["qpdf", "--qdf", "{file}", "{session_dir}/qpdf_out.pdf"],
        "description": "Decompress PDF for manual inspection",
        "category": "document",
        "timeout": 15,
    },

    # ─── Encoding & Ciphers ───────────────────────────────────────────────────
    "base64_decode": {
        "name": "base64 (decode)",
        "cmd": ["base64", "-d", "{file}"],
        "description": "Decode base64 encoded file",
        "category": "encoding",
        "timeout": 10,
    },
    "base32_decode": {
        "name": "base32 (decode)",
        "cmd": ["base32", "-d", "{file}"],
        "description": "Decode base32 encoded file",
        "category": "encoding",
        "timeout": 10,
    },
    "zbarimg": {
        "name": "zbarimg (QR/barcode)",
        "cmd": ["zbarimg", "{file}"],
        "description": "Decode QR codes and barcodes",
        "category": "encoding",
        "timeout": 15,
    },

    # ─── Password Cracking ────────────────────────────────────────────────────
    "fcrackzip": {
        "name": "fcrackzip",
        "cmd": ["fcrackzip", "-u", "-D", "-p", "/usr/share/wordlists/rockyou.txt", "{file}"],
        "description": "ZIP password cracking with rockyou",
        "category": "cracking",
        "timeout": 120,
    },
    "pdfcrack": {
        "name": "pdfcrack",
        "cmd": ["pdfcrack", "-f", "{file}"],
        "description": "Brute-force password-protected PDFs",
        "category": "cracking",
        "timeout": 120,
    },
    "stegcracker": {
        "name": "stegcracker",
        "cmd": ["stegcracker", "{file}", "/usr/share/wordlists/rockyou.txt"],
        "description": "Steghide brute-force with rockyou wordlist",
        "category": "cracking",
        "timeout": 120,
    },
}


# ─── Category Metadata ────────────────────────────────────────────────────────
CATEGORIES: dict = {
    "basic":       {"label": "Basic Analysis",        "icon": "🔍", "color": "blue"},
    "metadata":    {"label": "Metadata & EXIF",       "icon": "📋", "color": "purple"},
    "extraction":  {"label": "File Extraction",       "icon": "📦", "color": "orange"},
    "image_stego": {"label": "Image Steganography",   "icon": "🖼️",  "color": "green"},
    "audio_stego": {"label": "Audio Steganography",   "icon": "🎵", "color": "pink"},
    "document":    {"label": "Documents & PDF",       "icon": "📄", "color": "yellow"},
    "encoding":    {"label": "Encoding & Ciphers",    "icon": "🔐", "color": "red"},
    "cracking":    {"label": "Password Cracking",     "icon": "💥", "color": "gray"},
}


# ─── Quick Tools (pinned shortcuts in UI) ─────────────────────────────────────
QUICK_TOOLS = ["file", "strings", "exiftool", "binwalk", "zsteg"]


def get_tools_by_category() -> dict:
    """Return tools grouped by category."""
    grouped = {cat: [] for cat in CATEGORIES}
    for key, tool in TOOLS.items():
        cat = tool.get("category", "basic")
        if cat in grouped:
            grouped[cat].append({**tool, "key": key})
    return grouped


def get_tool(key: str) -> dict | None:
    """Get a single tool definition by key."""
    return TOOLS.get(key)
