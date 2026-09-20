# Cortex // Sovereign Markdown Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-38BDF8.svg)](LICENSE)
[![Architecture: Serverless](https://img.shields.io/badge/Architecture-100%25%20Serverless%20%7C%20Local--First-10B981.svg)](#)
[![Security: DOMPurify](https://img.shields.io/badge/Security-DOMPurify%20Hardened-F59E0B.svg)](#)
[![Design: Industrial Precision](https://img.shields.io/badge/Design-Stephans__Hub%20System-818CF8.svg)](#)
[![Zero Build Overhead](https://img.shields.io/badge/Build-Zero%20Dependencies%20%28Vanilla%29-38BDF8.svg)](#)

> **Cortex** ist ein hochpräziser, serverloser und lokaler Markdown-Editor im **Industrial Precision & High-Tech Data Science** Design. Entwickelt für Entwickler, Forscher und Autoren, die maximale Datensouveränität, blitzschnelle Ladezeiten und kompromisslose Ästhetik fordern.

---

## ⚡ Das Wichtigste auf einen Blick

* **100% Local-First & Autark:** Keine Hintergrund-Daemons, kein Node.js-Build, kein Python-Backend, keine offenen Ports. Ein Klick auf `index.html` genügt.
* **Native Dateisystem-Integration:** Öffne lokale Verzeichnisse über die moderne HTML5 *File System Access API*. Änderungen werden mit `Strg+S` direkt auf die Festplatte geschrieben.
* **Notion-Style Slash-Commands (`/`):** Formatierungsmenü direkt am Cursor für Überschriften, Tabellen, Code-Blöcke und Checklisten – ganz ohne Kontextwechsel.
* **Dual-Theme Engine (Stephans_Hub):** Nahtloses Umschalten zwischen **Industrial Slate** (Dark Mode) und **Precision Titanium** (Light Mode) inklusive Blueprint-Dot-Grid.
* **Sicherheits-Gate (Viktor Stahl Standard):** Vorbeugender Schutz vor DOM-basiertem XSS durch vollständige Bereinigung mit **DOMPurify** (vollständig offline gebündelt).

---

## 🎨 Design-System & Interface

Cortex basiert auf den UI-Tokens von **Stephans_Hub**:

| Feature | Industrial Slate (Dark) | Precision Titanium (Light) |
| :--- | :--- | :--- |
| **Canvas** | `#090D14` (Matte Obsidian) | `#F8FAFC` (Clean Paper) |
| **Surface** | `#0F1623` (Deep Navy) | `#FFFFFF` (Pure Slate) |
| **Accent Primary** | `#38BDF8` (Precision Cobalt) | `#0284C7` (Electric Cobalt) |
| **Status Highlights** | `#10B981` (Emerald) / `#F59E0B` (Amber) | `#059669` (Emerald) / `#D97706` (Amber) |
| **Blueprint Raster** | 28px technisches Dot-Grid | 28px technisches Dot-Grid |
| **Typografie** | Outfit (Headings) · Inter (UI) · JetBrains Mono (Code) | Outfit · Inter · JetBrains Mono |

---

## 🛠️ Funktionsübersicht

### 1. Lokales Dokumenten-Management
- **Ordner-Mounting:** Wähle deinen Notizen- oder Projektordner. Alle `.md`- und `.txt`-Dateien werden übersichtlich in der Sidebar gelistet.
- **Echtzeit-Suchfilter:** Blitzschnelles Durchsuchen großer Dateimengen über das integrierte Suchfeld.
- **Hierarchische Bildauflösung:** Relative Bildpfade (z. B. `![Screenshot](assets/img.png)`) werden rekursiv aufgelöst und als speicher-effiziente Blob-URLs dargestellt.
- **Sichere Dateiverwaltung:** Neue Notizen erstellen, bestehende Dokumente bearbeiten oder unwiderruflich löschen.

### 2. Fokus-Editor mit Slash-Commands
Drücke im Textbereich einfach `/`, um das dynamisch positionierte Aktionsmenü zu öffnen:
- `#` **Hauptüberschrift (H1)** · Großer Dokumententitel
- `##` **Abschnitt (H2)** · Strukturierte Zwischenüberschrift
- `###` **Unterabschnitt (H3)** · Feingliedrige Gliederung
- `•` **Aufzählungsliste** · Stichpunkte und Sammlungen
- `1.` **Nummerierte Sequenz** · Chronologische Abläufe
- `☑` **Task-Checkliste** · Interaktive Aufgaben
- `"` **Callout & Zitat** · Hervorgehobener Notizblock
- `</>` **Code-Segment** · Syntax-Highlighting (Python, Bash, JS, etc.)
- `▦` **Datentabelle** · Strukturierte Matrix mit Spalten

### 3. Quick Controls & Tastatur-Kürzel

| Tastenkombination | Aktion |
| :--- | :--- |
| `Strg + S` / `Cmd + S` | Aktives Dokument sofort auf der Festplatte speichern |
| `/` | Notion-Style Slash-Command Menü an Cursor-Position öffnen |
| `Pfeiltasten` + `Enter` | Navigation und Auswahl im Slash-Menü |
| `Escape` | Slash-Menü schließen |
| `Vollbild-Button` | Ablenkungsfreier Zen-Modus (Sidebars ausblenden) |

---

## 🛡️ Cyber-Security & Offline-Garantie

* **Kein Tracking, keine Telemetrie:** Cortex sendet zu keinem Zeitpunkt Daten an externe Server.
* **XSS-Desinfektion:** Jedes gerenderte Markdown-Element durchläuft die `DOMPurify.sanitize()` Pipeline. Schädliche `<script>`-Tags, unerwünschte `<iframe>`-Einbindungen oder bösartige `onload`/`onerror`-Attribute in heruntergeladenen Fremddokumenten werden neutralisiert.
* **Offline-Assets:** Alle Core-Bibliotheken (`marked.js`, `purify.min.js`, `prism.js`) liegen lokal im Ordner `vendor/`.

---

## 🚀 Schnellstart

Es ist keine Installation von Node.js, Python oder Paketmanagern erforderlich.

### Option A: Direktstart
Öffne die Datei `index.html` mit einem Doppelklick in deinem Webbrowser (vorzugsweise Chrome, Brave oder Edge für native File System Access API Unterstützung).

### Option B: Lokaler Dev-Server (optional)
```bash
# Mit Python:
python3 -m http.server 8080

# Oder mit Node:
npx serve .
```
Rufe anschließend `http://localhost:8080` in deinem Browser auf.

---

## 📁 Repository-Struktur

```text
Cortex/
├── index.html            # Hauptanwendung (Semantisches HTML5 & Bento-Grid)
├── README.md             # Vollständige Projektdokumentation
├── LICENSE               # MIT Lizenz
├── css/
│   └── style.css         # Stephans_Hub Design-System (Dark & Light Tokens)
├── js/
│   └── app.js            # Engine (File System API, DOMPurify, Slash-Commands)
└── vendor/               # Lokale Offline-Bibliotheken
    ├── purify.min.js     # DOMPurify 3.1.6 XSS-Desinfektion
    ├── marked.min.js     # Markdown Parsing Engine
    ├── prism.min.js      # Syntax Highlighting Core
    ├── prism-python.min.js
    ├── prism-bash.min.js
    └── prism-tomorrow.min.css
```

---

## 📄 Lizenz

Dieses Projekt ist unter der **MIT-Lizenz** lizenziert – siehe die [LICENSE](LICENSE) Datei für Details.

```text
© 2026 by Stephan Koch
```
