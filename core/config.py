# ==============================================================================
# DATEI: core/config.py
# ZIEL: Zentrale Konfiguration und Logging-Initialisierung
# Rocky Linux kompatibel – HEIMDALL Standard
# ==============================================================================
import os
import logging
from pathlib import Path
from typing import Any
from logging.handlers import TimedRotatingFileHandler
import structlog
from dotenv import load_dotenv

# ── Basis: .env laden (relativ zu dieser Datei) ──────────────────────────────
_BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=_BASE_DIR / ".env")

PROJECT_NAME = os.getenv("PROJECT_NAME", "MdForge")

class _Config:
    """
    Zentrale Konfigurationsklasse (Singleton).
    Alle Pfade und Einstellungen werden hier definiert.
    """
    PROJECT_NAME: str = PROJECT_NAME
    logger: Any = None  # Wird dynamisch initialisiert

    # ── Verzeichnisse ─────────────────────────────────────────────────────────
    BASE_DIR: Path = _BASE_DIR
    STATIC_DIR: Path = _BASE_DIR / "static"
    LOG_DIR: Path = _BASE_DIR / "logs"
    
    # Verzeichnis der anzuzeigenden/zu editierenden Markdown-Dateien
    # Kann per .env auf einen beliebigen Pfad gesetzt werden
    DOCS_DIR: Path = Path(os.getenv("DOCS_DIR", str(_BASE_DIR)))

    # Log-Dateien
    ACCESS_LOG: Path = _BASE_DIR / "logs" / "access.log"
    ERROR_LOG: Path = _BASE_DIR / "logs" / "error.log"

    # ── Server-Einstellungen ──────────────────────────────────────────────────
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "5005"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # ── Authentifizierung (Optional) ──────────────────────────────────────────
    AUTH_ENABLED: bool = os.getenv("AUTH_ENABLED", "false").lower() == "true"
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "heimdall_markdown_secret_key_12345")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Stunden

    # ── KI-Einstellungen (Optional) ───────────────────────────────────────────
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    def ensure_dirs(self) -> None:
        """Erstellt alle benötigten Verzeichnisse."""
        for directory in [self.LOG_DIR, self.DOCS_DIR]:
            directory.mkdir(parents=True, exist_ok=True)

    def validate(self) -> list[str]:
        """Validiert die Pflichtkonfigurationen."""
        errors = []
        if self.AUTH_ENABLED and not os.getenv("JWT_SECRET_KEY"):
            errors.append("[CONFIG-WARNUNG] AUTH_ENABLED ist aktiv, aber kein custom JWT_SECRET_KEY gesetzt.")
        return errors

# ── Singleton-Instanz ─────────────────────────────────────────────────────────
cfg = _Config()
cfg.ensure_dirs()



def create_rotating_handler(filename: str, backup_count: int = 3) -> TimedRotatingFileHandler:
    handler = TimedRotatingFileHandler(
        cfg.LOG_DIR / filename,
        when="midnight",
        interval=1,
        backupCount=backup_count,
        encoding='utf-8'
    )
    handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
    return handler

root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(create_rotating_handler("system.log"))

# Structlog Setup
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer() if cfg.DEBUG else structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

cfg.logger = structlog.get_logger("MdForge")
