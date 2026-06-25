# ==============================================================================
# DATEI: core/utils.py
# ZIEL: Hilfsfunktionen für System-Management (z.B. Portfreigabe)
# Rocky Linux kompatibel – HEIMDALL Standard
# ==============================================================================
import logging
from pathlib import Path
from logging.handlers import TimedRotatingFileHandler
import psutil
from core.config import cfg

def setup_logger(name: str, log_file: Path, level: int = logging.INFO) -> logging.Logger:
    """Erstellt einen Standard-Python-Logger mit rotierenden Logdateien."""
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Verhindert doppelte Handler
    if not logger.handlers:
        handler = TimedRotatingFileHandler(
            log_file,
            when="midnight",
            interval=1,
            backupCount=3,
            encoding='utf-8'
        )
        handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
        logger.addHandler(handler)
        
    return logger

def release_port(port: int) -> None:
    """
    Sucht nach Prozessen, die den angegebenen Port blockieren,
    und beendet diese (Rocky Linux / macOS kompatibel).
    """
    for proc in psutil.process_iter(attrs=['pid', 'name']):
        try:
            connections = proc.connections(kind='inet')
            for conn in connections:
                if conn.laddr.port == port:
                    cfg.logger.info(
                        "port_blocked_release_attempt",
                        port=port,
                        pid=proc.info['pid'],
                        process_name=proc.info['name']
                    )
                    proc.terminate()
                    try:
                        proc.wait(timeout=2)
                        cfg.logger.info("port_released_success", port=port, pid=proc.info['pid'])
                    except psutil.TimeoutExpired:
                        proc.kill()
                        cfg.logger.warning("port_released_forced", port=port, pid=proc.info['pid'])
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
        except Exception:
            # Kein logger-Call hier falls logger noch nicht bereit ist, aber wir loggen es vorsichtshalber
            pass
