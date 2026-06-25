# ==============================================================================
# DATEI: api.py
# ZIEL: Web-Zentrale: FastAPI Backend für den Standalone Markdown Viewer
# Rocky Linux kompatibel – HEIMDALL Standard
# ==============================================================================
import os
import signal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import cfg
from core.utils import release_port
from routes import docs, ui

# ── Signal Handler für sauberes Beenden ──────────────────────────────────────
def signal_handler(sig, frame):
    cfg.logger.info("server_shutting_down_signals")
    os._exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# ── 1. App Initialisierung & Validierung ──────────────────────────────────────
errors = cfg.validate()
if errors:
    for err in errors:
        cfg.logger.warning("config_validation_warning", detail=err)

app = FastAPI(title=f"{cfg.PROJECT_NAME} API")

# ── 2. CORS Konfiguration ─────────────────────────────────────────────────────
origins = [
    f"http://localhost:{cfg.PORT}",
    f"http://127.0.0.1:{cfg.PORT}",
    "http://localhost",
    "http://127.0.0.1",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 3. Router-Registrierung ───────────────────────────────────────────────────
app.include_router(ui.router, tags=["UI"])
app.include_router(docs.router, prefix="/api/docs", tags=["Docs"])

# ── 4. Statische Dateien ──────────────────────────────────────────────────────
# WICHTIG: Muss nach den Routen gemountet werden, um Kollisionen zu vermeiden
app.mount("/static", StaticFiles(directory=cfg.STATIC_DIR), name="static")

# ── 5. System Health Check ────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "project": cfg.PROJECT_NAME,
        "docs_directory": str(cfg.DOCS_DIR),
        "auth_enabled": cfg.AUTH_ENABLED
    }

# ── 6. App-Start (Uvicorn) ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    cfg.logger.info("server_starting_up", host=cfg.HOST, port=cfg.PORT)
    try:
        release_port(cfg.PORT)
        uvicorn.run("api:app", host=cfg.HOST, port=cfg.PORT, reload=cfg.DEBUG)
    except Exception as e:
        cfg.logger.critical("server_startup_failed", error=str(e))
    finally:
        release_port(cfg.PORT)
