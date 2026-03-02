# 🔐 StegoForge — CTF Steganography Analysis Platform

A browser-based steganography analysis platform built for CTF (Capture The Flag) competitions. Upload any file, run 40+ forensics and steganography tools in real-time, and detect hidden flags — all from your browser.

---

## 📸 Overview

StegoForge provides a clean hacker-themed UI where you can:

- Upload any file (image, audio, PDF, binary, zip, etc.)
- Run 40+ steganography and forensics tools with one click
- See live streaming output in a real terminal (xterm.js)
- Auto-detect CTF flags in any format (including custom ones)
- View hex dumps, extracted files, and audio spectrograms
- Add custom flag formats for your specific CTF competition

---

## 🛠️ Technologies Used

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| Vite | 5.3 | Build tool + dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| xterm.js | 5.5 | Real terminal emulator in browser |
| Zustand | 4.5 | Global state management |
| Axios | 1.7 | HTTP client for API calls |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Runtime |
| FastAPI | 0.111 | REST API + WebSocket framework |
| Uvicorn | 0.29 | ASGI server with hot reload |
| aiofiles | 23.2 | Async file I/O for uploads |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Container runtime |
| Docker Compose | Multi-container orchestration |
| Ubuntu 24.04 | Tools container base image |
| Node 20 Alpine | Frontend container base image |
| Python 3.11 Slim | Backend container base image |

---

## 🚀 How to Run

### Prerequisites
- Kali Linux / Ubuntu 2024.x
- Docker 24+
- Docker Compose v2.x

### Step 1 — Clone the project
```bash
git clone https://github.com/VarshankNaik/stegoforge.git
cd stegoforge
```

### Step 2 — Build Docker images
```bash
docker compose build
```
> ⏳ First build takes 5–15 minutes — installing all 40+ stego tools.

### Step 3 — Launch
```bash
docker compose up
```
Or run in background:
```bash
docker compose up -d
```

### Step 4 — Open in browser
```
http://localhost:5173
```

### Step 5 — Stop
```bash
docker compose down
```

---

## 🎮 How to Use

### 1. Upload a File
- Drag and drop any file onto the drop zone in the left sidebar
- Or click the drop zone to browse files
- Supports: PNG, JPG, BMP, GIF, MP3, WAV, PDF, ZIP, any binary
- Max size: 50MB

### 2. Run a Tool

**Quick Tools** (top of sidebar) — one click:
```
file  strings  exiftool  binwalk  zsteg
```

**Single tool:**
- Browse by category in the tool list
- Click the ▶ play button next to any tool

**Batch run:**
- Check boxes next to tools you want
- Click Run Selected or Run All

### 3. Read the Terminal
- Output streams live in the xterm.js terminal
- 🚩 Flags are highlighted in yellow automatically
- Use Pause to freeze output while reading
- Use Copy to copy all output
- Press Ctrl+K to clear

### 4. Custom Flag Formats
- Click the Flag Formats tab
- Type your prefix (e.g. myctf) — detects myctf{...} everywhere
- Use Test to verify it works
- Click 🗑 to remove when done

---

## 🐛 Troubleshooting

### Permission denied on docker socket
```bash
sudo chmod 666 /var/run/docker.sock
sudo usermod -aG docker $USER && newgrp docker
```

### Tools container not found
```bash
docker compose ps
docker compose down && docker compose up
```

### Rebuild everything from scratch
```bash
docker compose down -v
docker compose build --no-cache
docker compose up
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/upload | Upload file → returns session_id |
| GET | /api/session/{id} | Get session info + files |
| DELETE | /api/session/{id} | Delete session + files |
| GET | /api/tools | List all tools + categories |
| GET | /api/tools/{key} | Get single tool info |
| POST | /api/analyze/{session}/{tool} | Run tool (streaming) |
| POST | /api/analyze/{session}/batch | Run multiple tools |
| WS | /ws/{session}/{tool} | WebSocket tool stream |
| WS | /ws/{session}/batch | WebSocket batch stream |
| GET | /api/flags/patterns | List all flag patterns |
| POST | /api/flags/patterns | Add custom flag prefix |
| DELETE | /api/flags/patterns/{prefix} | Remove custom flag prefix |
| POST | /api/flags/test | Test text against all patterns |

Interactive API docs: http://localhost:8000/docs

---

## 📜 License

MIT License — free to use, modify, and distribute.