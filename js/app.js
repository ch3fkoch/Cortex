/* ==============================================================================
   CORTEX // CLIENT-SEITIGE ENGINE
   - File System Access API mit Fallbacks
   - DOMPurify XSS-Absicherung
   - Industrial Theme Management (Light / Dark)
   - Notion-Style Slash-Commands mit Ghost-Div Koordinaten
   ============================================================================== */

let currentDirHandle = null;
let activeHandle = null;
const openedFilesMap = new Map();
let hasChanges = false;
let fileFilterQuery = '';

// 1. Initialisierung bei Seitenaufbau
document.addEventListener("DOMContentLoaded", () => {
    // 1.1 Theme-Initialisierung aus localStorage
    initTheme();

    // 1.2 Marked.js Konfiguration
    marked.setOptions({
        highlight: (code, lang) => {
            if (window.Prism && Prism.languages[lang]) {
                return Prism.highlight(code, Prism.languages[lang], lang);
            }
            return code;
        },
        breaks: true,
        gfm: true
    });

    // 1.3 Event-Listeners für den Editor
    const mdInput = document.getElementById("md-input");
    mdInput.addEventListener("input", () => {
        hasChanges = true;
        document.getElementById("save-status").style.display = "flex";
        updatePreview();
    });

    // 1.4 Shortcuts (Strg+S / Cmd+S speichert Datei)
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            saveActiveDoc();
        }
    });

    // 1.5 Vor Verlassen warnen wenn ungespeichert
    window.addEventListener("beforeunload", (e) => {
        if (hasChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // 1.6 API-Status anzeigen
    updateApiStatus();
});

// ── Theme Management (Industrial Light & Dark Mode) ─────────────────────────

function initTheme() {
    const savedTheme = localStorage.getItem("cortex_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeButton(savedTheme);

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme") || "dark";
            const next = current === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("cortex_theme", next);
            updateThemeButton(next);
        });
    }
}

function updateThemeButton(theme) {
    const btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.textContent = theme === "dark" ? "THEME // DARK" : "THEME // LIGHT";
    }
}

// ── Dateiverwaltung (Browser File System Access API) ─────────────────────────

function updateApiStatus() {
    const statusText = document.getElementById("sys-api-status");
    if ('showDirectoryPicker' in window) {
        statusText.innerText = "Lokal & Direkt (File System API)";
        statusText.className = "status-val-active";
    } else {
        statusText.innerText = "Modus: Manuelle Downloads";
        statusText.style.color = "var(--accent-amber)";
    }
}

async function openDirectory() {
    if (!('showDirectoryPicker' in window)) {
        alert("Hinweis zur System-Kompatibilität:\n\nDein Browser unterstützt die native HTML5 File System Access API derzeit nicht vollständig.\nFür die nahtlose Ordner-Synchronisation und direktes lokales Speichern empfehlen wir Chromium-basierte Browser (Chrome, Brave, Edge).");
        return;
    }

    try {
        currentDirHandle = await window.showDirectoryPicker();
        openedFilesMap.clear();

        for await (const entry of currentDirHandle.values()) {
            if (entry.kind === 'file' && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
                openedFilesMap.set(entry.name, entry);
            }
        }

        renderFileList();

        // Erste Datei automatisch laden falls vorhanden
        if (openedFilesMap.size > 0) {
            const firstFileName = openedFilesMap.keys().next().value;
            openFile(firstFileName);
        } else {
            alert("Verzeichnis-Scan abgeschlossen:\n\nIn diesem Ordner wurden keine Markdown- (.md) oder Textdateien (.txt) gefunden. Du kannst oben über das Plus-Symbol direkt ein neues Dokument anlegen.");
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error("Verzeichniszugriff fehlgeschlagen:", e);
        }
    }
}

function filterFileList() {
    const searchInput = document.getElementById("doc-search");
    fileFilterQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    renderFileList();
}

function renderFileList() {
    const container = document.getElementById("doc-list");
    if (openedFilesMap.size === 0) {
        container.innerHTML = `<div style="padding: 16px 12px; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); text-align: center; line-height: 1.5;">KEIN ORDNER GEWÄHLT<br><span style="font-size: 0.68rem; opacity: 0.7;">Klicke oben auf das Ordner-Icon</span></div>`;
        return;
    }

    let files = Array.from(openedFilesMap.keys());
    if (fileFilterQuery) {
        files = files.filter(name => name.toLowerCase().includes(fileFilterQuery));
    }

    if (files.length === 0) {
        container.innerHTML = `<div style="padding: 12px; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); text-align: center;">KEINE TREFFER</div>`;
        return;
    }

    container.innerHTML = files.map(name => `
        <div class="doc-item ${activeHandle && activeHandle.name === name ? 'active' : ''}" onclick="openFile('${name}')">
            <span title="${name}">${name}</span>
            <span class="delete-file" title="Datei löschen" onclick="deleteFile(event, '${name}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </span>
        </div>
    `).join('');
}

async function openFile(name) {
    if (hasChanges && !confirm("Achtung: Ungespeicherte Änderungen im aktuellen Dokument gehen beim Wechsel verloren.\n\nMöchtest du trotzdem fortfahren?")) return;

    const handle = openedFilesMap.get(name);
    if (!handle) return;

    activeHandle = handle;
    try {
        const file = await handle.getFile();
        const content = await file.text();

        document.getElementById("md-input").value = content;
        document.getElementById("file-title").innerText = name.toUpperCase();
        document.getElementById("save-status").style.display = "none";
        hasChanges = false;

        updatePreview();
        renderFileList();
    } catch (e) {
        alert("Fehler beim Lesen der Datei: " + e.message);
    }
}

async function saveActiveDoc() {
    const content = document.getElementById("md-input").value;

    if (activeHandle && typeof activeHandle.createWritable === 'function') {
        try {
            const writable = await activeHandle.createWritable();
            await writable.write(content);
            await writable.close();
            hasChanges = false;
            document.getElementById("save-status").style.display = "none";
        } catch (e) {
            console.warn("Direktspeichern fehlgeschlagen, nutze Fallback-Download:", e);
            triggerDownload(content);
        }
    } else {
        triggerDownload(content);
    }
}

function triggerDownload(content) {
    const filename = activeHandle ? activeHandle.name : "dokument.md";
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    hasChanges = false;
    document.getElementById("save-status").style.display = "none";
}

async function createNewDoc() {
    if (hasChanges && !confirm("Nicht gespeicherte Änderungen gehen verloren. Fortfahren?")) return;

    if ('showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: "neue_notiz.md",
                types: [{
                    description: 'Markdown-Dateien',
                    accept: { 'text/markdown': ['.md'] }
                }]
            });

            const writable = await handle.createWritable();
            await writable.write("# Neues Dokument\n\nWillkommen in **Cortex**. Beginne direkt mit deinen Notizen oder tippe '/' für Schnellbefehle (Überschriften, Tabellen, Code, Checklisten)...\n");
            await writable.close();

            openedFilesMap.set(handle.name, handle);
            activeHandle = handle;

            renderFileList();
            openFile(handle.name);
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error("Datei erstellen abgebrochen:", e);
            }
        }
    } else {
        const name = prompt("Name der neuen Datei (z.B. notiz.md):");
        if (!name) return;

        const fileName = name.endsWith('.md') ? name : name + '.md';
        const mockHandle = {
            name: fileName,
            getFile: async () => new File(["# Neues Dokument\n\nWillkommen in **Cortex**. Beginne direkt mit deinen Notizen oder tippe '/' für Schnellbefehle...\n"], fileName),
            createWritable: null
        };

        openedFilesMap.set(mockHandle.name, mockHandle);
        activeHandle = mockHandle;

        renderFileList();
        openFile(mockHandle.name);
    }
}

async function deleteFile(e, name) {
    e.stopPropagation();
    if (!confirm(`Dokument unwiderruflich löschen:\n\nMöchtest du "${name}" wirklich dauerhaft von deinem Dateisystem entfernen?`)) return;

    try {
        if (currentDirHandle) {
            await currentDirHandle.removeEntry(name);
            openedFilesMap.delete(name);

            if (activeHandle && activeHandle.name === name) {
                activeHandle = null;
                document.getElementById("md-input").value = "";
                document.getElementById("preview-content").innerHTML = "";
                document.getElementById("file-title").innerText = "KEINE DATEI GEWÄHLT";
                resetStats();
            }

            renderFileList();
        } else {
            openedFilesMap.delete(name);
            if (activeHandle && activeHandle.name === name) {
                activeHandle = null;
                document.getElementById("md-input").value = "";
                document.getElementById("preview-content").innerHTML = "";
                document.getElementById("file-title").innerText = "KEINE DATEI GEWÄHLT";
                resetStats();
            }
            renderFileList();
        }
    } catch (e) {
        alert("Löschen fehlgeschlagen: " + e.message);
    }
}

// ── Markdown-Rendering mit DOMPurify XSS-Schutz & Bild-Resolution ─────────────

const imageCache = new Map();

async function updatePreview() {
    const text = document.getElementById("md-input").value;
    const rawHtml = marked.parse(text);

    // 🔒 Viktor Stahl Sicherheits-Gate: XSS Desinfektion via DOMPurify
    const cleanHtml = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(rawHtml) : rawHtml;

    // Lokale Bilder auflösen
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');
    const images = doc.querySelectorAll('img');

    if (currentDirHandle && images.length > 0) {
        for (const img of images) {
            const src = img.getAttribute('src');
            if (src && !src.match(/^(http|https|data|blob|file):/i)) {
                try {
                    if (imageCache.has(src)) {
                        img.setAttribute('src', imageCache.get(src));
                    } else {
                        const parts = src.split('/').filter(p => p && p !== '.');
                        let handle = currentDirHandle;

                        for (let i = 0; i < parts.length - 1; i++) {
                            handle = await handle.getDirectoryHandle(parts[i]);
                        }

                        const fileHandle = await handle.getFileHandle(parts[parts.length - 1]);
                        const file = await fileHandle.getFile();
                        const blobUrl = URL.createObjectURL(file);

                        imageCache.set(src, blobUrl);
                        img.setAttribute('src', blobUrl);
                    }
                } catch (e) {
                    console.warn('Lokales Bild konnte nicht aufgelöst werden:', src, e);
                }
            }
        }
    }

    document.getElementById("preview-content").innerHTML = doc.body.innerHTML;
    if (window.Prism) {
        Prism.highlightAll();
    }
    updateStats(text);
}

function updateStats(text) {
    const charCount = text.length;
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const lineCount = text === "" ? 0 : text.split("\n").length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    document.getElementById("stat-chars").innerText = charCount;
    document.getElementById("stat-words").innerText = wordCount;
    document.getElementById("stat-lines").innerText = lineCount;
    document.getElementById("stat-readtime").innerText = `${readTime} Min`;
}

function resetStats() {
    document.getElementById("stat-chars").innerText = "0";
    document.getElementById("stat-words").innerText = "0";
    document.getElementById("stat-lines").innerText = "0";
    document.getElementById("stat-readtime").innerText = "0 Min";
}

function setMode(mode) {
    document.body.classList.remove('mode-editor', 'mode-split', 'mode-preview');
    document.body.classList.add(`mode-${mode}`);
    document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(`btn-${mode}`).classList.add("active");
}

function toggleFullscreen() {
    document.body.classList.toggle("fullscreen-active");
}

function insertAtCursor(before, after) {
    const area = document.getElementById("md-input");
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const text = area.value;
    area.value = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);
    area.focus();
    area.selectionStart = start + before.length;
    area.selectionEnd = end + before.length;

    hasChanges = true;
    document.getElementById("save-status").style.display = "flex";
    updatePreview();
}

function insertTable() {
    const table = "\n| Metrik | Wert | Status |\n| ------ | ---- | ------ |\n| Alpha  | 0.05 | Valid  |\n| Latenz | 12ms | OK     |\n";
    insertAtCursor(table, '');
}

// ── Notion-Style Slash Commands (/) ─────────────────────────────────────────

let slashMenuVisible = false;
let slashSearchText = '';
let slashSelectedIndex = 0;
let slashStartPosition = -1;

function getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    div.className = 'ghost-div';

    const style = window.getComputedStyle(element);
    ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom', 'border', 'borderWidth', 'boxSizing'].forEach(prop => {
        div.style[prop] = style[prop];
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.width = element.clientWidth + 'px';
    div.style.height = element.clientHeight + 'px';

    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    document.body.appendChild(div);

    const x = span.offsetLeft;
    const y = span.offsetTop;

    document.body.removeChild(div);
    return { top: y, left: x };
}

function setupSlashMenu() {
    const mdInput = document.getElementById("md-input");
    const slashMenu = document.getElementById("slash-menu");
    const items = Array.from(slashMenu.querySelectorAll(".slash-item"));

    function closeMenu() {
        slashMenuVisible = false;
        slashMenu.classList.remove("visible");
        slashSearchText = '';
        slashStartPosition = -1;
    }

    function filterItems() {
        let visibleCount = 0;
        const query = slashSearchText.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.trim().toLowerCase();
            if (text.includes(query) || item.dataset.cmd.includes(query)) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
            item.classList.remove("active");
        });

        if (visibleCount === 0) {
            closeMenu();
        } else {
            slashSelectedIndex = 0;
            updateSelection();
        }
    }

    function updateSelection() {
        const visibleItems = items.filter(item => item.style.display !== 'none');
        visibleItems.forEach((item, index) => {
            if (index === slashSelectedIndex) {
                item.classList.add("active");
                item.scrollIntoView({ block: "nearest" });
            } else {
                item.classList.remove("active");
            }
        });
    }

    function executeCommand(cmd) {
        const value = mdInput.value;
        const before = value.substring(0, slashStartPosition);
        const after = value.substring(mdInput.selectionStart);

        let insertText = "";
        let cursorOffset = 0;

        switch (cmd) {
            case "h1": insertText = "# "; break;
            case "h2": insertText = "## "; break;
            case "h3": insertText = "### "; break;
            case "ul": insertText = "- "; break;
            case "ol": insertText = "1. "; break;
            case "check": insertText = "- [ ] "; break;
            case "quote": insertText = "> "; break;
            case "code": insertText = "```python\n# Code hier einfügen\n```"; cursorOffset = -4; break;
            case "table": insertText = "| Spalte 1 | Spalte 2 |\n| -------- | -------- |\n| Wert 1   | Wert 2   |"; break;
        }

        mdInput.value = before + insertText + after;
        mdInput.focus();
        mdInput.selectionStart = mdInput.selectionEnd = before.length + insertText.length + cursorOffset;

        hasChanges = true;
        document.getElementById("save-status").style.display = "flex";
        updatePreview();
        closeMenu();
    }

    mdInput.addEventListener("input", (e) => {
        if (!slashMenuVisible && e.data === '/') {
            slashMenuVisible = true;
            slashStartPosition = mdInput.selectionStart - 1;
            slashSearchText = '';

            const coords = getCaretCoordinates(mdInput, mdInput.selectionStart);
            const rect = mdInput.getBoundingClientRect();

            slashMenu.style.top = (rect.top + coords.top + 26 - mdInput.scrollTop) + 'px';
            slashMenu.style.left = (rect.left + coords.left) + 'px';
            slashMenu.classList.add("visible");
            filterItems();
        } else if (slashMenuVisible) {
            const currentPos = mdInput.selectionStart;
            if (currentPos <= slashStartPosition) {
                closeMenu();
            } else {
                const textSinceSlash = mdInput.value.substring(slashStartPosition, currentPos);
                if (textSinceSlash.startsWith('/')) {
                    slashSearchText = textSinceSlash.substring(1);
                    filterItems();
                } else {
                    closeMenu();
                }
            }
        }
    });

    mdInput.addEventListener("keydown", (e) => {
        if (!slashMenuVisible) return;

        const visibleItems = items.filter(item => item.style.display !== 'none');

        if (e.key === "ArrowDown") {
            e.preventDefault();
            slashSelectedIndex = (slashSelectedIndex + 1) % visibleItems.length;
            updateSelection();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            slashSelectedIndex = (slashSelectedIndex - 1 + visibleItems.length) % visibleItems.length;
            updateSelection();
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (visibleItems.length > 0) {
                executeCommand(visibleItems[slashSelectedIndex].dataset.cmd);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            closeMenu();
        }
    });

    items.forEach(item => {
        item.addEventListener("mousedown", (e) => {
            e.preventDefault();
            executeCommand(item.dataset.cmd);
        });
        item.addEventListener("mouseenter", () => {
            const visibleItems = items.filter(i => i.style.display !== 'none');
            slashSelectedIndex = visibleItems.indexOf(item);
            updateSelection();
        });
    });

    mdInput.addEventListener("blur", () => {
        setTimeout(closeMenu, 160);
    });
}

// 2. Initialisiere Slash Menu
setupSlashMenu();
