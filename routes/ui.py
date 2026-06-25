# ==============================================================================
# DATEI: routes/ui.py
# ZIEL: Serving des Frontends
# Rocky Linux kompatibel – HEIMDALL Standard
# ==============================================================================
from fastapi import APIRouter
from fastapi.responses import FileResponse
from core.config import cfg

router = APIRouter()

@router.get("/")
async def read_root() -> FileResponse:
    """Serviert das Haupt-HTML-Interface."""
    return FileResponse(cfg.STATIC_DIR / "index.html")
