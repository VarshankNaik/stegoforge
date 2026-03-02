import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import upload, analyze, websocket, flags


@asynccontextmanager
async def lifespan(app: FastAPI):
    upload_dir = os.getenv("UPLOAD_DIR", "/data/uploads")
    os.makedirs(upload_dir, exist_ok=True)
    print(f"[StegoForge] Upload directory ready: {upload_dir}")
    print(f"[StegoForge] Tools container: {os.getenv('TOOLS_CONTAINER', 'stegoforge-tools')}")
    yield
    print("[StegoForge] Shutting down...")


app = FastAPI(
    title="StegoForge API",
    description="CTF Steganography Analysis Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://0.0.0.0:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(upload.router,    prefix="/api", tags=["Upload"])
app.include_router(analyze.router,   prefix="/api", tags=["Analyze"])
app.include_router(websocket.router,               tags=["WebSocket"])
app.include_router(flags.router,     prefix="/api", tags=["Flags"])


@app.get("/api/health", tags=["Health"])
async def health():
    return {
        "status":          "ok",
        "service":         "StegoForge",
        "version":         "1.0.0",
        "tools_container": os.getenv("TOOLS_CONTAINER", "stegoforge-tools"),
        "upload_dir":      os.getenv("UPLOAD_DIR", "/data/uploads"),
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "StegoForge API is running",
        "docs":    "/docs",
        "health":  "/api/health",
    }
