# MdForge

**MdForge** ist ein moderner, serverloser (rein statischer) Markdown-Editor und -Viewer in edler Aero- und Glassmorphismus-Ästhetik mit einem fließenden Farbverlauf von **Neon-Cyan zu Violett**.

Die Anwendung läuft vollständig clientseitig im Webbrowser – es ist **kein Server, kein Python und keine Installation von Abhängigkeiten erforderlich**.

---

## Features

- **Reines Frontend (Serverless):** Keine Hintergrunddienste, keine offenen Netzwerkports. Öffne einfach die `index.html` direkt im Browser.
- **Lokaler Dateizugriff (HTML5 File System Access API):**
  *   **Ordner öffnen:** Wähle ein lokales Verzeichnis aus. MdForge scannt und listet alle `.md` und `.txt` Dateien direkt in der Sidebar auf.
  *   **Direktes Speichern:** Änderungen werden mit `Strg+S` oder Klick auf "Speichern" direkt zurück auf deine Festplatte geschrieben.
  *   **Neue Dateien:** Erstelle neue Dokumente direkt über das Interface auf deiner Festplatte.
  *   **Sicherer Löschvorgang:** Dateien können direkt aus der App von der Festplatte gelöscht werden (nach Bestätigung).
- **Universeller Fallback:** In Browsern ohne vollen API-Support (z. B. Firefox oder Safari) funktioniert die App im Fallback-Modus über manuelle Uploads/Downloads.
- **Echtzeit-Markdown-Vorschau:** Live-Rendering von Markdown-Inhalten mit Syntax-Highlighting via Prism.
- **Integriertes Text-Qualitätsbarometer:** Berechnet Zeichen, Wörter, Zeilen und geschätzte Lesezeit live beim Tippen.
- **Direct AI Assist (Gemini Integration):** Trage deinen Gemini API-Key direkt in der Oberfläche ein (wird sicher lokal im Browser-Speicher abgelegt), um direkt clientseitig Textanalysen und Berichte zu generieren.

---

## Verzeichnisstruktur

```
MdForge/
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

1. Navigiere in deinem Dateimanager zum Ordner `MdForge`.
2. Öffne die Datei [index.html](file:///Users/stephan/developer/MdForge/index.html) mit einem Doppelklick in deinem Webbrowser (am besten in einem Chromium-basierten Browser wie **Google Chrome**, **Microsoft Edge** oder **Opera**).

### Option B: Über einen einfachen Webserver (Optional)

Wenn du die App über eine lokale Webadresse laufen lassen möchtest, kannst du einen eingebauten Server nutzen:

```bash
cd /Users/stephan/developer/MdForge
python3 -m http.server 5005
```

Danach erreichst du die App unter [http://localhost:5005/](http://localhost:5005/).

---

## Lizenz

Das Projekt steht unter der [MIT Lizenz](file:///Users/stephan/developer/MdForge/LICENSE).
