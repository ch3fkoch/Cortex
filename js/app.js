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

function updatePreview() {
    const text = document.getElementById("md-input").value;
    document.getElementById("preview-content").innerHTML = marked.parse(text);
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
    document.body.className = `mode-${mode}`;
    document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(`btn-${mode}`).classList.add("active");
}

function insertAtCursor(before, after) {
    const area = document.getElementById("md-input");
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const val = area.value;
    const selected = val.substring(start, end);
    
    area.value = val.substring(0, start) + before + selected + after + val.substring(end);
    area.focus();
    area.selectionStart = start + before.length;
    area.selectionEnd = start + before.length + selected.length;
    
    hasChanges = true;
    document.getElementById("save-status").style.display = "block";
    updatePreview();
}

function insertTable() {
    const table = "\n| Spalte 1 | Spalte 2 |\n| :--- | :--- |\n| Wert 1 | Wert 2 |\n";
    insertAtCursor(table, "");
}
