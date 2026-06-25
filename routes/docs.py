# ==============================================================================
# DATEI: routes/docs.py
# ZIEL: API-Endpunkte für das Dokumenten-Management (CRUD + AI Assist)
# Rocky Linux kompatibel – HEIMDALL Standard
# ==============================================================================
import urllib.request
import urllib.error
import json
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List
from core.config import cfg
from core.auth import get_current_user

router = APIRouter()

@router.get("/list")
def list_documents(current_user: dict = Depends(get_current_user)) -> Dict[str, List[dict]]:
    """Listet alle .md und .txt Dateien im Dokumentenverzeichnis auf."""
    docs = []
    try:
        # Dokumente im konfigurierten DOCS_DIR scannen
        for ext in ['*.md', '*.txt']:
            for p in cfg.DOCS_DIR.glob(ext):
                docs.append({
                    "name": p.name,
                    "path": p.name,
                    "type": "root"
                })
        
        # Logs scannen, falls sie existieren
        if cfg.LOG_DIR.exists():
            for p in cfg.LOG_DIR.glob("briefing_*.txt"):
                docs.append({
                    "name": p.name,
                    "path": f"logs/{p.name}",
                    "type": "log"
                })
                
        cfg.logger.info("docs_listed_successfully", count=len(docs), user=current_user.get("username"))
        return {"documents": docs}
    except Exception as e:
        cfg.logger.error("docs_list_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Fehler beim Auflisten der Dokumente.")

@router.get("/read")
def read_document(path: str, current_user: dict = Depends(get_current_user)) -> Dict[str, str]:
    """Liest ein Dokument sicher ein und verhindert Path-Traversal-Angriffe."""
    if not (path.endswith('.md') or path.endswith('.txt')):
        raise HTTPException(status_code=400, detail="Ungültiges Format (nur .md und .txt erlaubt)")
    
    try:
        base_path = cfg.DOCS_DIR.resolve()
        safe_path = (base_path / path).resolve()
        
        # Sicherheits-Check: Darf nicht außerhalb des Basisverzeichnisses liegen
        if not str(safe_path).startswith(str(base_path)):
            cfg.logger.warning("security_alert_path_traversal", user=current_user.get('username'), path=path)
            raise HTTPException(status_code=403, detail="Zugriff verweigert (Sicherheitsverletzung)")

        if not safe_path.exists():
            raise HTTPException(status_code=404, detail="Datei nicht gefunden")
            
        with open(safe_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        cfg.logger.info("doc_read_success", filename=safe_path.name, user=current_user.get("username"))
        return {"content": content, "filename": safe_path.name}
    except HTTPException:
        raise
    except Exception as e:
        cfg.logger.error("docs_read_failed", path=path, error=str(e))
        raise HTTPException(status_code=500, detail=f"Server-Fehler beim Lesen: {str(e)}")

@router.post("/save")
def save_document(data: Dict[str, str], current_user: dict = Depends(get_current_user)) -> Dict[str, str]:
    """Speichert ein Dokument sicher ab."""
    path = data.get("path")
    content = data.get("content")
    
    if not path or content is None:
        raise HTTPException(status_code=400, detail="Ungültige Parameter (Pfad und Inhalt erforderlich)")
        
    try:
        base_path = cfg.DOCS_DIR.resolve()
        safe_path = (base_path / path).resolve()
        
        # Sicherheits-Check
        if not str(safe_path).startswith(str(base_path)):
            cfg.logger.warning("security_alert_save_traversal", user=current_user.get('username'), path=path)
            raise HTTPException(status_code=403, detail="Zugriff verweigert (Sicherheitsverletzung)")

        # Sicherstellen, dass Unterordner (z.B. logs/) existieren
        safe_path.parent.mkdir(parents=True, exist_ok=True)

        with open(safe_path, "w", encoding="utf-8") as f:
            f.write(content)
            
        cfg.logger.info("doc_save_success", filename=safe_path.name, user=current_user.get("username"))
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        cfg.logger.error("docs_save_failed", path=path, error=str(e))
        raise HTTPException(status_code=500, detail=f"Server-Fehler beim Speichern: {str(e)}")

@router.post("/create")
def create_document(data: Dict[str, str], current_user: dict = Depends(get_current_user)) -> Dict[str, str]:
    """Erstellt eine neue leere Datei."""
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Dateiname fehlt")
        
    if not (name.endswith('.md') or name.endswith('.txt')):
        name += '.md'
        
    try:
        base_path = cfg.DOCS_DIR.resolve()
        safe_path = (base_path / name).resolve()
        
        # Sicherheits-Check
        if not str(safe_path).startswith(str(base_path)):
            cfg.logger.warning("security_alert_create_traversal", user=current_user.get('username'), name=name)
            raise HTTPException(status_code=403, detail="Zugriff verweigert (Sicherheitsverletzung)")
            
        if safe_path.exists():
            raise HTTPException(status_code=400, detail="Datei existiert bereits")
            
        with open(safe_path, "w", encoding="utf-8") as f:
            f.write(f"# {name[:-3]}\n\nErstellt am.")
            
        cfg.logger.info("doc_create_success", filename=safe_path.name, user=current_user.get("username"))
        return {"status": "success", "path": name}
    except HTTPException:
        raise
    except Exception as e:
        cfg.logger.error("docs_create_failed", name=name, error=str(e))
        raise HTTPException(status_code=500, detail=f"Server-Fehler beim Erstellen: {str(e)}")

@router.post("/delete")
def delete_document(data: Dict[str, str], current_user: dict = Depends(get_current_user)) -> Dict[str, str]:
    """Löscht eine Datei sicher."""
    path = data.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="Pfad fehlt")
        
    try:
        base_path = cfg.DOCS_DIR.resolve()
        safe_path = (base_path / path).resolve()
        
        # Sicherheits-Check
        if not str(safe_path).startswith(str(base_path)):
            cfg.logger.warning("security_alert_delete_traversal", user=current_user.get('username'), path=path)
            raise HTTPException(status_code=403, detail="Zugriff verweigert (Sicherheitsverletzung)")
            
        if not safe_path.exists():
            raise HTTPException(status_code=404, detail="Datei existiert nicht")
            
        safe_path.unlink()
        cfg.logger.info("doc_delete_success", filename=safe_path.name, user=current_user.get("username"))
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        cfg.logger.error("docs_delete_failed", path=path, error=str(e))
        raise HTTPException(status_code=500, detail=f"Server-Fehler beim Löschen: {str(e)}")

@router.post("/ai_assist")
def ai_assist(data: Dict[str, str], current_user: dict = Depends(get_current_user)) -> Dict[str, str]:
    """Nutzt die Gemini API, um Text zu generieren oder zu analysieren."""
    agent = data.get("agent", "BTC_Macro_Analyst")
    content = data.get("content", "")

    if not cfg.GEMINI_API_KEY:
        cfg.logger.warning("ai_assist_key_missing")
        return {
            "agent": agent,
            "content": f"[KONFIGURATION] Kein GEMINI_API_KEY in der .env hinterlegt. AI Assist für Agent '{agent}' kann nicht ausgeführt werden."
        }

    # System-Prompts für die verschiedenen Agenten-Rollen
    personas = {
        "BTC_Macro_Analyst": (
            "Du bist ein renommierter Bitcoin Makro-Analyst. Analysiere den folgenden Text und ergänze eine prägnante, "
            "datengetriebene makroökonomische Perspektive (z.B. Zinsumfeld, Inflation, globale Liquidität) bezüglich Bitcoin."
        ),
        "BTC_Sentiment_Oracle": (
            "Du bist das Bitcoin Sentiment-Orakel. Analysiere den folgenden Text und ergänze eine detaillierte "
            "Sentiment-Analyse (Fear & Greed Index, Social-Media-Stimmung, Derivate-Daten wie Funding Rates)."
        ),
        "BTC_Risk_Strategist": (
            "Du bist ein professioneller Bitcoin Risiko-Stratege. Analysiere den folgenden Text und ergänze konkrete "
            "Risiko-Metriken, Drawdown-Szenarien und Absicherungs-Strategien."
        )
    }

    prompt_prefix = personas.get(agent, personas["BTC_Macro_Analyst"])
    full_prompt = f"{prompt_prefix}\n\nAktueller Textinhalt:\n{content}" if content else f"{prompt_prefix}\n\nBitte erstelle einen kurzen Initialbericht für den heutigen Tag."

    try:
        # API-Call an Gemini 2.5 Flash via REST (kompatibel und ohne Paket-Abhängigkeit)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={cfg.GEMINI_API_KEY}"
        req_data = {
            "contents": [
                {
                    "parts": [
                        {"text": full_prompt}
                    ]
                }
            ]
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(req_data).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            
            # Text aus Gemini Response extrahieren
            candidates = res_json.get("candidates", [])
            if candidates:
                generated_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            else:
                generated_text = "Keine Antwort von der KI erhalten."

        cfg.logger.info("ai_assist_success", agent=agent, user=current_user.get("username"))
        return {"agent": agent, "content": generated_text}
        
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        cfg.logger.error("ai_assist_api_http_error", error=err_msg)
        raise HTTPException(status_code=502, detail=f"Fehler bei der Kommunikation mit Gemini: {e.reason}")
    except Exception as e:
        cfg.logger.error("ai_assist_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Server-Fehler bei AI Assist: {str(e)}")
