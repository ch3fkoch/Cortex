# Cortex

**Cortex** ist ein moderner, serverloser (rein statischer) Markdown-Editor und -Viewer. Er besticht durch das **Living Neural Network**-Design – eine hypermoderne, organische UI mit weich pulsierenden Morphing-Karten, die sich an der Ästhetik lebender neuronaler Netze orientiert.

Die Anwendung läuft vollständig clientseitig im Webbrowser – es ist **kein Server, kein Python und keine Installation von Abhängigkeiten erforderlich**.

---

## Features

- **Reines Frontend (Serverless):** Keine Hintergrunddienste, keine offenen Netzwerkports. Öffne einfach die `index.html` direkt im Browser.
- **Lokaler Dateizugriff (HTML5 File System Access API):**
  *   **Ordner öffnen:** Wähle ein lokales Verzeichnis aus. Cortex listet alle `.md` und `.txt` Dateien direkt in der Sidebar auf. Lokale Bilder werden per Blob-URL automatisch in die Vorschau geladen.
  *   **Direktes Speichern:** Änderungen werden mit `Strg+S` oder Klick auf "Speichern" direkt zurück auf deine Festplatte geschrieben.
  *   **Dateiverwaltung:** Erstelle neue Dokumente oder lösche sie direkt über das UI.
- **Slash-Commands (Notion-Style):**
  *   **Das Highlight des Editors:** Tippe im Textfeld einfach ein `/`, um direkt an deinem Cursor das schwebende, interaktive Markdown-Menü zu öffnen.
  *   Du kannst Befehle wie `/h1`, `/ta` (Tabelle) oder `/code` eintippen, die Liste wird in Echtzeit gefiltert. Navigiere mit den Pfeiltasten und bestätige mit `Enter`.
- **Fokus & UI:**
  *   **Vollbildmodus:** Blende mit einem Klick alle Sidebars aus und fokussiere dich auf 100% Text-Breite.
  *   **Skalierbare Widgets:** Die rechte Seitenleiste mit dem Live-Textbarometer (Wörter, Zeichen, Lesezeit) lässt sich stufenlos in der Breite ziehen.
- **Echtzeit-Markdown-Vorschau:** Live-Rendering von Markdown-Inhalten mit Syntax-Highlighting (Prism).

---

## Verzeichnisstruktur

```
Cortex/
├── index.html            # Hauptseite (semantisches HTML)
├── LICENSE               # MIT Lizenz
├── README.md             # Diese Anleitung
├── css/
│   └── style.css         # Bento-Grid & Glassmorphismus (Cyan-Violett)
├── js/
│   └── app.js            # Client-Logik & File System Access API
└── vendor/               # JavaScript/CSS Bibliotheken (marked, prism)
```

---

## Starten und Verwenden

### Option A: Direkt im Browser öffnen (Empfohlen)

1. Navigiere in deinem Dateimanager zum Ordner `Cortex`.
2. Öffne die Datei [index.html](file:///Users/stephan/developer/Cortex/index.html) mit einem Doppelklick in deinem Webbrowser (am besten in einem Chromium-basierten Browser wie **Google Chrome**, **Microsoft Edge** oder **Opera**).

### Option B: Über einen einfachen Webserver (Optional)

Wenn du die App über eine lokale Webadresse laufen lassen möchtest, kannst du einen eingebauten Server nutzen:

```bash
cd /Users/stephan/developer/Cortex
python3 -m http.server 5005
```

Danach erreichst du die App unter [http://localhost:5005/](http://localhost:5005/).

---

## Lizenz

Das Projekt steht unter der [MIT Lizenz](file:///Users/stephan/developer/Cortex/LICENSE).
