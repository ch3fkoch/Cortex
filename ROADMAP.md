# Cortex // Strategische Release-Roadmap

Dieses Dokument definiert die strategische Entwicklungsplanung für **Cortex – Sovereign Local-First Markdown Studio**.
Hier werden geplante Meilensteine, Architekturentscheidungen und Prioritäten festgehalten.

---

## 🚀 Release v2.5: The Productivity & Knowledge Sprint

**Fokus:** Multi-Dokumenten-Handling, visuelle Diagramme, professioneller Export und vollständige Air-Gap-Autarkie.

### Meilenstein 1: Multi-Tab-Workspace & Sync-Scroll
* **Dokumenten-Tabs:** Paralleles Öffnen und Bearbeiten mehrerer `.md`-Dateien über eine intuitive Tab-Leiste oberhalb des Editors.
* **Proportionales Sync-Scrolling:** Präzise Scroll-Kopplung zwischen Editor und Vorschau-Fenster für nahtloses Arbeiten in langen Dokumenten.
* **Collapsible Sidebars:** Ein- und Ausklappen der Seitenleisten per Tastaturkürzel (`Cmd+B` / `Strg+B`) für einen ablenkungsfreien Zen-Schreibmodus.
* *Lead:* **Ben Novak & Jane** (UI/UX & Frontend Systems)

### Meilenstein 2: Professionelle Export-Engine (Print & PDF)
* **Druckfertiges `@media print`-Styling:** 1-Klick-Export oder Direktdruck (`Strg+P`) im hochauflösenden Stephans_Hub Design (mit sauberen Seitenumbrüchen, Kopf-/Fußzeilen und optimierten Kontrasten).
* **Standalone HTML-Export:** Exportieren formatierter Notizen als autarke Einzelseite inklusive integrierter Styles zur Weitergabe ohne Server.
* *Lead:* **Alex & Sophia Chen** (Engineering & QA)

### Meilenstein 3: Visuelle Intelligenz (Mermaid.js)
* **Diagramm-Rendering:** Unterstützung nativer ```mermaid Code-Blöcke zur Darstellung von Flussdiagrammen, Architektur-Skizzen, Sequenzdiagrammen und Gantt-Charts direkt in der Vorschau.
* **Offline-Integration:** Bündelung der `mermaid.min.js` im lokalen `vendor/`-Verzeichnis unter Beibehaltung der Zero-Trust-Vorgaben.
* *Lead:* **Alan & Viktor Stahl** (Data Analytics & Cyber Security)

### Meilenstein 4: Knowledge Management & Frontmatter (YAML)
* **YAML-Frontmatter Parser:** Auslesen und Validieren strukturierter Metadatenblöcke (`title`, `tags`, `author`, `date`) am Beginn der Markdown-Datei.
* **Interaktive Metadaten-Chips:** Visualisierung von Tags als anklickbare Filter-Chips über dem Text.
* **Tag-basierte Suche:** Schnelle Filterung der Dateiliste in der Sidebar anhand verknüpfter Tags.
* *Lead:* **Janine & Marie Laurent** (Requirements & Information Architecture)

### Meilenstein 5: 100% Offline-Font-Autarkie (Air-Gap Ready)
* **Lokale Webfonts:** Vollständige Bereitstellung aller Schriftfamilien (`Outfit`, `Inter`, `JetBrains Mono`) als lokale WOFF2-Dateien in `vendor/fonts/`.
* **Zero External Calls:** Komplette Unabhängigkeit von externen CDNs für uneingeschränkten Offline-Betrieb in isolierten Netzen.
* *Lead:* **Viktor Stahl & Jane** (Cyber Security & Frontend)

---

## 🔮 Zukünftige Ausblicke (v3.0+)

* **Interaktive Wissensgraph-Visualisierung:** Visuelle Knoten-Verknüpfung von Notizen anhand von Wikilinks (`[[Notizname]]`).
* **Erweiterte Code-Ausführung / REPL:** Clientseitige Code-Runner für JavaScript/Python (via WebAssembly/Pyodide) direkt im Dokument.
* **Verschlüsselte Vaults:** Optionale Client-Side AES-256-GCM Verschlüsselung für sensible Notizen vor dem Schreiben auf die Festplatte.

---

## 📋 Release-Matrix v2.5

| Meilenstein | Komponente | Priorität | Ziel |
| :--- | :--- | :--- | :--- |
| **M1** | Multi-Tabs & Sync-Scroll | 🔴 Hoch | Schneller Dokumentenwechsel & flüssiges Lesen |
| **M2** | Print/PDF & Standalone-HTML | 🔴 Hoch | Konvertierung in publikationsreife Berichte |
| **M3** | Mermaid.js Diagramme | 🟡 Mittel | Visuelle Skizzen direkt im Markdown |
| **M4** | YAML-Frontmatter & Tags | 🟡 Mittel | Semantische Organisation des Wissensarchivs |
| **M5** | Offline-Fonts (`vendor/fonts/`) | 🟢 Feinschliff | 100% Autarkie ohne CDN-Zugriffe |

---

© 2026 by Stephan Koch
