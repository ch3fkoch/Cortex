/* ==============================================================================
   DATEI: js/app.js
   ZIEL: Client-seitige Logik für den serverlosen Markdown-Editor (File System API)
   ============================================================================== */

let currentDirHandle = null;
let activeHandle = null;
const openedFilesMap = new Map();
let hasChanges = false;

// 1. Initialisierung bei Seitenaufbau
document.addEventListener("DOMContentLoaded", () => {
    // Marked Einstellungen
    marked.setOptions({
        highlight: (code, lang) => {
            if (Prism.languages[lang]) {
                return Prism.highlight(code, Prism.languages[lang], lang);
            }
            return code;
        },
        breaks: true,
        gfm: true
    });

    // Event-Listeners registrieren
    const mdInput = document.getElementById("md-input");
    mdInput.addEventListener("input", () => {
        hasChanges = true;
        document.getElementById("save-status").style.display = "block";
        updatePreview();
    });

    // Shortcuts (Strg+S / Cmd+S speichert Datei)
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            saveActiveDoc();
        }
    });

    // Unterstützung für File System API prüfen und anzeigen
    updateApiStatus();
});

// ── Dateiverwaltung (Browser File System Access API) ─────────────────────────

function updateApiStatus() {
    const statusText = document.getElementById("sys-api-status");
    if ('showDirectoryPicker' in window) {
        statusText.innerText = "Aktiv (File System API)";
        statusText.style.color = "var(--cyan)";
    } else {
        statusText.innerText = "Fallback (Downloads)";
        statusText.style.color = "#ffb703";
    }
}

async function openDirectory() {
    if (!('showDirectoryPicker' in window)) {
        alert("Dein Browser unterstützt die File System Access API nicht. Bitte verwende Chrome oder Edge.");
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
        
        // Erste Datei laden falls vorhanden
        if (openedFilesMap.size > 0) {
            const firstFileName = openedFilesMap.keys().next().value;
            openFile(firstFileName);
        } else {
            alert("Keine .md oder .txt Dateien in diesem Ordner gefunden.");
        }
    } catch (e) {
        console.error("Verzeichniszugriff abgebrochen oder fehlgeschlagen:", e);
    }
}

function renderFileList() {
    const container = document.getElementById("doc-list");
    if (openedFilesMap.size === 0) {
        container.innerHTML = `<div style="padding: 10px; font-size: 0.8rem; color: var(--text-secondary);">Keine Dateien geladen.</div>`;
        return;
    }

    container.innerHTML = Array.from(openedFilesMap.keys()).map(name => `
        <div class="doc-item ${activeHandle && activeHandle.name === name ? 'active' : ''}" onclick="openFile('${name}')">
            <span>${name}</span>
            <span class="delete-file" onclick="deleteFile(event, '${name}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </span>
        </div>
    `).join('');
}

async function openFile(name) {
    if (hasChanges && !confirm("Nicht gespeicherte Änderungen gehen verloren. Fortfahren?")) return;
    
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
            console.log("Speichern erfolgreich.");
        } catch (e) {
            console.warn("Fehler beim Direktspeichern, nutze Fallback-Download:", e);
            triggerDownload(content);
        }
    } else {
        // Fallback: Als Datei herunterladen
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
                suggestedName: "neue_datei.md",
                types: [{
                    description: 'Markdown-Dateien',
                    accept: { 'text/markdown': ['.md'] }
                }]
            });
            
            // Leere Datei erstellen
            const writable = await handle.createWritable();
            await writable.write("# Neue Datei\n\nBeginne mit dem Schreiben...");
            await writable.close();
            
            openedFilesMap.set(handle.name, handle);
            activeHandle = handle;
            
            renderFileList();
            openFile(handle.name);
        } catch (e) {
            console.error("Datei erstellen abgebrochen:", e);
        }
    } else {
        // Fallback für Browser ohne API
        const name = prompt("Name der neuen Datei (z.B. datei.md):");
        if (!name) return;
        
        const mockHandle = {
            name: name.endsWith('.md') ? name : name + '.md',
            getFile: async () => new File(["# Neue Datei\n\nBeginne mit dem Schreiben..."], mockHandle.name),
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
    if (!confirm(`Datei "${name}" wirklich löschen? (Wird von der Festplatte gelöscht!)`)) return;

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
            // Fallback: Nur aus Sidebar-Liste entfernen
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



// ── UI-States, Text-Metriken & Helpers ────────────────────────────────────────

const imageCache = new Map();

async function updatePreview() {
    const text = document.getElementById("md-input").value;
    const rawHtml = marked.parse(text);
    
    // HTML parsen, um Bilder zu finden
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const images = doc.querySelectorAll('img');
    
    if (currentDirHandle && images.length > 0) {
        for (const img of images) {
            const src = img.getAttribute('src');
            // Nur relative Pfade auflösen (keine URLs oder Data-URIs)
            if (src && !src.match(/^(http|https|data|blob|file):/i)) {
                try {
                    if (imageCache.has(src)) {
                        img.setAttribute('src', imageCache.get(src));
                    } else {
                        // Pfad in Verzeichnisse und Dateinamen aufteilen
                        const parts = src.split('/').filter(p => p && p !== '.');
                        let handle = currentDirHandle;
                        
                        // Durch die Ordnerhierarchie navigieren
                        for (let i = 0; i < parts.length - 1; i++) {
                            handle = await handle.getDirectoryHandle(parts[i]);
                        }
                        
                        // Datei-Handle holen und als Blob-URL lesen
                        const fileHandle = await handle.getFileHandle(parts[parts.length - 1]);
                        const file = await fileHandle.getFile();
                        const blobUrl = URL.createObjectURL(file);
                        
                        imageCache.set(src, blobUrl);
                        img.setAttribute('src', blobUrl);
                    }
                } catch (e) {
                    console.warn('Konnte lokales Bild nicht laden:', src, e);
                }
            }
        }
    }
    
    document.getElementById("preview-content").innerHTML = doc.body.innerHTML;
    Prism.highlightAll();
    updateStats(text);
}

function updateStats(text) {
    const charCount = text.length;
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const lineCount = text === "" ? 0 : text.split("\n").length;
    
    // Annahme: ~200 Wörter pro Minute Lesezeit
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
    document.getElementById("save-status").style.display = "block";
    updatePreview();
}

function insertTable() {
    const table = `\n| Spalte 1 | Spalte 2 |\n| -------- | -------- |\n| Wert 1   | Wert 2   |\n`;
    insertAtCursor(table, '');
}

// ==========================================
// SLASH COMMANDS (NOTION STYLE)
// ==========================================
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
            case "code": insertText = "```\n\n```"; cursorOffset = -4; break;
            case "table": insertText = "| Spalte 1 | Spalte 2 |\n| -------- | -------- |\n| Wert 1   | Wert 2   |"; break;
        }
        
        mdInput.value = before + insertText + after;
        mdInput.focus();
        mdInput.selectionStart = mdInput.selectionEnd = before.length + insertText.length + cursorOffset;
        
        hasChanges = true;
        document.getElementById("save-status").style.display = "block";
        updatePreview();
        closeMenu();
    }
    
    mdInput.addEventListener("input", (e) => {
        if (!slashMenuVisible && e.data === '/') {
            slashMenuVisible = true;
            slashStartPosition = mdInput.selectionStart - 1;
            slashSearchText = '';
            
            // Calculate coordinates
            const coords = getCaretCoordinates(mdInput, mdInput.selectionStart);
            const rect = mdInput.getBoundingClientRect();
            
            // Position menu
            slashMenu.style.top = (rect.top + coords.top + 24 - mdInput.scrollTop) + 'px';
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
        setTimeout(closeMenu, 150);
    });
}

// Initialize components
setupSlashMenu();
