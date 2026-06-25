# MdForge

Ein leichtgewichtiger, eigenständiger Markdown-Editor und -Viewer, der nach den offiziellen **HEIMDALL-Standards** entwickelt wurde. Dieses Projekt ermöglicht das sichere Verwalten, Schreiben und Vorschauen von Markdown-Dateien auf lokalen Systemen sowie auf Rocky Linux Servern.

---

## Features

- **Echtzeit-Markdown-Vorschau:** Live-Rendering von Markdown-Inhalten mit Syntax-Highlighting via Prism.
- **Sicheres CRUD:** Dateien können über die API gelistet, gelesen, erstellt, gespeichert und gelöscht werden. 
- **Path-Traversal-Schutz:** Streng validierte Pfad-Auflösung verhindert den Zugriff auf sensible Systembereiche außerhalb des konfigurierten Verzeichnisses.
- **Zentrale Konfiguration:** Alle Einstellungen werden über `core/config.py` geladen (Heimdall-Standard).
- **Strukturiertes Logging:** Vollständig integriertes, rotierendes JSON/Console-Logging via `structlog`.
- **Port-Sicherung:** Automatisches Freigeben blockierter Ports beim Server-Start.
- **AI Assist (Gemini Integration):** Optionale Anbindung an die Gemini API für automatische Textoptimierung und Berichte (Makro-Analyse, Sentiment, Risiko-Szenarien).

---

## Verzeichnisstruktur

```
MdForge/
├── .env                  # Lokale Konfigurationsvariablen
├── .gitignore            # Git-Ausschlüsse
├── requirements.txt      # Python-Paketabhängigkeiten
├── README.md             # Diese Anleitung
├── api.py                # Haupteinstiegspunkt (FastAPI)
├── core/                 # HEIMDALL Core-Module
│   ├── __init__.py
│   ├── config.py         # Zentrales Config-Objekt & Logging
│   ├── auth.py           # Optionale JWT-Authentifizierung
│   └── utils.py          # Hilfsfunktionen (Portfreigabe)
├── routes/               # API-Router
│   ├── __init__.py
│   ├── docs.py           # Dokumenten-Verwaltung & AI-Endpunkte
│   └── ui.py             # Serving des UI Frontends
└── static/               # Statische Web-Assets
    ├── index.html        # Der Markdown Studio Editor
    └── vendor/           # JavaScript/CSS Bibliotheken (marked, prism)
```

---

## Installation & Einrichtung

### 1. Repository-Vorbereitung

Erstelle eine virtuelle Python-Umgebung und installiere die Abhängigkeiten:

```bash
# In das Projektverzeichnis wechseln
cd /Users/stephan/developer/MdForge

# Virtuelle Umgebung erstellen
python3 -m venv .venv

# Virtuelle Umgebung aktivieren
source .venv/bin/activate

# Abhängigkeiten installieren
pip install -r requirements.txt
```

### 2. Konfiguration anpassen (`.env`)

Kopiere oder bearbeite die `.env`-Datei. Hier kannst du einstellen, in welchem Ordner nach Markdown-Dateien gesucht werden soll (`DOCS_DIR`):

```ini
PROJECT_NAME=MdForge
HOST=127.0.0.1
PORT=5005
DEBUG=true

# Ändere diesen Pfad auf das Verzeichnis deiner Wahl
DOCS_DIR=/Users/stephan/developer

# Optionale Authentifizierung
AUTH_ENABLED=false

# Google Gemini API Key (für AI Assist)
GEMINI_API_KEY=dein_api_key_hier
```

---

## Server starten

Starte die Anwendung einfach über den Haupteinstiegspunkt:

```bash
python api.py
```

Der Server ist danach unter [http://localhost:5005/](http://localhost:5005/) erreichbar.
