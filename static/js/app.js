/* ==============================================================================
   DATEI: static/js/app.js
   ZIEL: Client-seitige Logik (API-Requests, MD-Parsing, UI-Zustand, Text-Metriken)
   ============================================================================== */

const API_BASE = "/api";
let activeFile = null;
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

    // Initialen Datenabruf starten
    loadDocList();
    fetchSystemStatus();
});

// ── API-Dokumentenverwaltung ─────────────────────────────────────────────────

async function loadDocList() {
    try {
        const res = await fetch(`${API_BASE}/docs/list`);
        if (!res.ok) throw new Error("API-Fehler beim Listen");
        const data = await res.json();
        const container = document.getElementById("doc-list");
        
        container.innerHTML = data.documents.map(doc => `
            <div class="doc-item ${activeFile === doc.path ? 'active' : ''}" onclick="openFile('${doc.path}')">
                <span>${doc.name}</span>
                <span class="delete-file" onclick="deleteFile(event, '${doc.path}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </span>
            </div>
        `).join('');
    } catch(e) {
        console.error("Fehler beim Laden der Dokumentenliste:", e);
    }
}

async function openFile(path) {
    if (hasChanges && !confirm("Nicht gespeicherte Änderungen gehen verloren. Fortfahren?")) return;
    activeFile = path;
    try {
        const res = await fetch(`${API_BASE}/docs/read?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error("API-Fehler beim Lesen");
        const data = await res.json();
        
        document.getElementById("md-input").value = data.content;
        document.getElementById("file-title").innerText = data.filename.toUpperCase();
        document.getElementById("save-status").style.display = "none";
        hasChanges = false;
        
        updatePreview();
        loadDocList();
    } catch (e) {
        alert("Fehler beim Öffnen der Datei.");
    }
}

async function saveActiveDoc() {
    if (!activeFile) return;
    const content = document.getElementById("md-input").value;
    try {
        const res = await fetch(`${API_BASE}/docs/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: activeFile, content })
        });
        if(res.ok) {
            hasChanges = false;
            document.getElementById("save-status").style.display = "none";
            console.log("Speichern erfolgreich.");
        } else {
            alert("Fehler beim Speichern der Datei.");
        }
    } catch(e) {
        alert("Speichern fehlgeschlagen.");
    }
}

async function createNewDoc() {
    const name = prompt("Name der neuen Datei (z.B. Notizen.md):");
    if (!name) return;
    try {
        const res = await fetch(`${API_BASE}/docs/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        if(res.ok) {
            const data = await res.json();
            await loadDocList();
            openFile(data.path);
        } else {
            const err = await res.json();
            alert("Fehler: " + err.detail);
        }
    } catch(e) {
        alert("Erstellen fehlgeschlagen.");
    }
}

async function deleteFile(e, path) {
    e.stopPropagation();
    if(!confirm(`Datei "${path}" wirklich löschen?`)) return;
    try {
        const res = await fetch(`${API_BASE}/docs/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path })
        });
        if(res.ok) {
            if(activeFile === path) {
                activeFile = null;
                document.getElementById("md-input").value = "";
                document.getElementById("preview-content").innerHTML = "";
                document.getElementById("file-title").innerText = "KEINE DATEI GEWÄHLT";
                resetStats();
            }
            loadDocList();
        } else {
            alert("Löschen fehlgeschlagen.");
        }
    } catch(e) {
        alert("Fehler beim Löschen.");
    }
}

// ── AI Assist (Gemini Integration) ───────────────────────────────────────────

async function runAiAssist(e) {
    const agent = document.getElementById("ai-agent-select").value;
    const content = document.getElementById("md-input").value;
    const btn = e.currentTarget;
    const oldHtml = btn.innerHTML;
    
    const statusDot = document.getElementById("ai-status-dot");
    const statusText = document.getElementById("ai-status-text");
    
    try {
        // Ladezustand aktivieren
        btn.innerHTML = "LÄDT...";
        btn.disabled = true;
        statusDot.className = "status-dot loading";
        statusText.innerText = "KI rechnet...";
        
        const res = await fetch(`${API_BASE}/docs/ai_assist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agent, content })
        });
        
        const data = await res.json();
        if (res.ok) {
            const aiText = `\n\n### 🤖 KI-ANALYSE (${data.agent})\n${data.content}\n\n`;
            insertAtCursor(aiText, "");
            statusText.innerText = "KI bereit";
        } else {
            alert("KI-Fehler: " + data.detail);
            statusText.innerText = "Fehler";
        }
    } catch (err) {
        alert("Verbindungsfehler zur KI.");
        statusText.innerText = "Verbindungsfehler";
    } finally {
        btn.innerHTML = oldHtml;
        btn.disabled = false;
        statusDot.className = "status-dot";
        if (statusText.innerText === "KI rechnet...") {
            statusText.innerText = "KI bereit";
        }
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

async function fetchSystemStatus() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById("sys-api-status").innerText = "Verbunden";
            document.getElementById("sys-project").innerText = data.project;
        } else {
            document.getElementById("sys-api-status").innerText = "Fehler";
        }
    } catch (e) {
        document.getElementById("sys-api-status").innerText = "Offline";
    }
}
