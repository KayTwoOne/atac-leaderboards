// CONNECTED TO: Submissions Tab (gid=0)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qo5j17dEIfzFRUndSzZDaLYHyHBq-UHaVziSH3u5X4QD598YGNnOehyEA7lLPoRHZdJuAMUCNy2j/pub?gid=0&single=true&output=csv";

// CONNECTED TO: Archive Tab (gid=1947026137)
const ARCHIVE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qo5j17dEIfzFRUndSzZDaLYHyHBq-UHaVziSH3u5X4QD598YGNnOehyEA7lLPoRHZdJuAMUCNy2j/pub?gid=1947026137&single=true&output=csv";

const VIEWS = {
    global: { title: "GLOBAL LEADERBOARD", sub: "Ranked by combined session score across all team sizes", filterSize: null, columns: [ { label: "RANK", format: "rank" }, { label: "DIFFICULTY", format: "diff" }, { label: "TEAM", format: "size" }, { label: "TOTAL SCORE", format: "score" }, { label: "OPERATOR ROSTER", format: "roster" } ] },
    solo: { title: "SOLO LADDER", sub: "Top 50 Solo Operators", filterSize: 1, columns: [ { label: "RANK", format: "rank" }, { label: "DIFFICULTY", format: "diff" }, { label: "TOTAL SCORE", format: "score" }, { label: "OPERATOR", format: "roster" } ] },
    duo: { title: "DUO LADDER", sub: "Top 50 Operator Pairs", filterSize: 2, columns: [ { label: "RANK", format: "rank" }, { label: "DIFFICULTY", format: "diff" }, { label: "TOTAL SCORE", format: "score" }, { label: "OPERATOR ROSTER", format: "roster" } ] },
    trio: { title: "TRIO LADDER", sub: "Top 50 Operator Teams of Three", filterSize: 3, columns: [ { label: "RANK", format: "rank" }, { label: "DIFFICULTY", format: "diff" }, { label: "TOTAL SCORE", format: "score" }, { label: "OPERATOR ROSTER", format: "roster" } ] },
    squad: { title: "SQUAD LADDER", sub: "Top 50 Full Combat Squads (4+)", filterSize: 4, columns: [ { label: "RANK", format: "rank" }, { label: "DIFFICULTY", format: "diff" }, { label: "TOTAL SCORE", format: "score" }, { label: "OPERATOR ROSTER", format: "roster" } ] },
    accuracy: { title: "ACCURACY RECORDS", sub: "Ranked by team hit percentage", filterSize: null, columns: [ { label: "RANK", format: "rank" }, { label: "DIFFICULTY", format: "diff" }, { label: "ACCURACY %", format: "acc" }, { label: "OPERATOR ROSTER", format: "roster" } ] },
    pilots: { title: "PILOT KILLS", sub: "Ranked by confirmed rotary takedowns", filterSize: null, columns: [ { label: "RANK", format: "rank" }, { label: "DIFFICULTY", format: "diff" }, { label: "KILLS", format: "pilots" }, { label: "OPERATOR ROSTER", format: "roster" } ] },
    maxdist: { title: "MAX DISTANCE", sub: "Ranked by longest confirmed hit", filterSize: null, columns: [ { label: "RANK", format: "rank" }, { label: "DIFFICULTY", format: "diff" }, { label: "DISTANCE (m)", format: "maxdist" }, { label: "OPERATOR ROSTER", format: "roster" } ] }
};

let fullData = [];     // Active Season Data (For Leaderboards)
let careerData = [];   // All-Time Combined Data (For Service Records)
let currentView = "global";
let dataLoaded = false;
let currentSearchQuery = ""; 

document.addEventListener("DOMContentLoaded", () => {
    bindNav();
    fetchData();
    startCountdown(); 
    
    document.getElementById("operator-search").addEventListener("input", (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        applySearchHighlight();
    });

    // Close dossier if clicking the black background
    document.getElementById('dossier-modal').addEventListener('click', (e) => {
        if(e.target.id === 'dossier-modal') closeDossier();
    });
});

// --- 14-DAY WIPE TIMER LOGIC ---
function startCountdown() {
    const wipeEl = document.getElementById("next-reset-meta");
    function tick() {
        const now = new Date();
        const londonStr = now.toLocaleString("en-US", { timeZone: "Europe/London", hour12: false });
        if (!londonStr || !londonStr.includes(',')) return;
        const parts = londonStr.split(', ');
        const dateParts = parts[0].split('/');
        const timeParts = parts[1].match(/\d+/g);
        const londonNow = new Date(parseInt(dateParts[2], 10), parseInt(dateParts[0], 10) - 1, parseInt(dateParts[1], 10), parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), parseInt(timeParts[2], 10));

        let targetLondon = new Date(2026, 4, 1, 16, 30, 0); 
        while (londonNow.getTime() > targetLondon.getTime()) {
            targetLondon.setDate(targetLondon.getDate() + 14);
        }

        const diff = targetLondon.getTime() - londonNow.getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);

        const displayStr = `${d}D ${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
        if (wipeEl) wipeEl.textContent = `WIPE IN: ${displayStr}`;
    }
    tick(); 
    setInterval(tick, 1000);
}

function bindNav() {
    document.querySelectorAll(".nav-btn[data-view]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn[data-view]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentView = btn.getAttribute("data-view");
            renderView();
        });
    });
}

// Promise wrapper for PapaParse to handle multiple URLs cleanly
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url + "&_=" + new Date().getTime(), {
            download: true,
            header: true,
            skipEmptyLines: true,
            transformHeader: function(h) { return h.trim(); },
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
        });
    });
}

function parseRow(row) {
    return {
        difficulty: row.Difficulty || "UNKNOWN",
        teamSize: parseInt(row.TeamSize) || 1,
        score: parseInt(row.Score) || 0,
        roster: row.Roster || "UNKNOWN",
        acc: parseInt(row.Accuracy) || 0,
        pilots: parseInt(row.Pilots) || 0,
        maxdist: parseInt(row.MaxDist) || 0
    };
}

async function fetchData() {
    setStatus("connecting");
    
    try {
        // Fetch Submissions AND Archive simultaneously
        const [activeResults, archiveResults] = await Promise.all([
            fetchCSV(SHEET_CSV_URL),
            fetchCSV(ARCHIVE_CSV_URL)
        ]);

        // Process Active Data (For UI Tables)
        fullData = activeResults.filter(row => row.Roster && row.Difficulty).map(parseRow);
        
        // Process Archive Data
        const parsedArchive = archiveResults.filter(row => row.Roster && row.Difficulty).map(parseRow);

        // Merge both into the All-Time Career Vault
        careerData = [...fullData, ...parsedArchive];
        
        dataLoaded = true;
        setStatus("online");
        
        const date = new Date();
        const timeStr = date.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' });
        document.getElementById("last-updated-meta").textContent = `UPDATED: ${timeStr}`;
        
        renderView();

    } catch (err) {
        setStatus("error"); 
        showError();
    }
}

function setStatus(state) {
    const dot = document.querySelector(".status-dot");
    const text = document.getElementById("status-text");
    dot.className = "status-dot";
    if (state === "connecting") text.textContent = "CONNECTING...";
    if (state === "online") { dot.classList.add("online"); text.textContent = "NETWORK ONLINE"; }
    if (state === "error") { dot.classList.add("error"); text.textContent = "CONNECTION LOST"; }
}

function renderView() {
    if (!dataLoaded) return;
    const cfg = VIEWS[currentView];

    document.getElementById("view-title").textContent = cfg.title;
    document.getElementById("view-sub").textContent = cfg.sub;

    // Leaderboards ONLY display Active Season Data
    let filtered = fullData;
    if (cfg.filterSize !== null) {
        filtered = fullData.filter(row => cfg.filterSize === 4 ? row.teamSize >= 4 : row.teamSize === cfg.filterSize);
    }

    let sorted;
    if (currentView === "accuracy") sorted = filtered.sort((a, b) => b.acc - a.acc);
    else if (currentView === "pilots") sorted = filtered.sort((a, b) => b.pilots - a.pilots);
    else if (currentView === "maxdist") sorted = filtered.sort((a, b) => b.maxdist - a.maxdist);
    else sorted = filtered.sort((a, b) => b.score - a.score);

    const sliced = sorted.slice(0, 50);
    document.getElementById("total-entries-meta").textContent = `ENTRIES: ${sorted.length}`;

    const thead = document.getElementById("leaderboard-head");
    thead.innerHTML = "";
    const hRow = document.createElement("tr");
    cfg.columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.label;
        hRow.appendChild(th);
    });
    thead.appendChild(hRow);

    const tbody = document.getElementById("leaderboard-body");
    tbody.innerHTML = "";

    if (sliced.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${cfg.columns.length}" style="text-align: center; padding: 50px; color: var(--border-bright); font-family: 'Quantico', sans-serif; letter-spacing: 2px;">NO RECORDS FOUND</td></tr>`;
        return;
    }

    sliced.forEach((row, index) => {
        const rank = index + 1;
        const tr = document.createElement("tr");
        if (rank === 1) tr.classList.add("rank-1");

        cfg.columns.forEach(col => {
            const td = document.createElement("td");
            if (col.format === "rank") { td.classList.add("col-rank"); td.textContent = rank === 1 ? "#1 ◈" : `#${rank}`; } 
            else if (col.format === "size") { const sizes = {1: "SOLO", 2: "DUO", 3: "TRIO"}; td.textContent = sizes[row.teamSize] || "SQUAD"; td.style.color = "var(--text-muted)"; }
            else if (col.format === "diff") { td.textContent = (row.difficulty || "UNKNOWN").toUpperCase(); }
            else if (col.format === "score") { td.classList.add("col-val"); td.textContent = row.score; }
            else if (col.format === "acc") { td.classList.add("col-val"); td.textContent = row.acc + "%"; }
            else if (col.format === "pilots") { td.classList.add("col-val"); td.textContent = row.pilots; }
            else if (col.format === "maxdist") { td.classList.add("col-val"); td.textContent = row.maxdist + "m"; }
            else if (col.format === "roster") {
                td.innerHTML = row.roster.split(',').map(player => {
                    const parts = player.split(':');
                    if (parts.length >= 2) {
                        const opNameSafe = parts[0].replace(/'/g, "\\'"); 
                        return `<span class="operator-link" style="color: #fff; font-family: 'Quantico', sans-serif;" onclick="openDossier('${opNameSafe}')">${parts[0].toUpperCase()}</span> <span style="color: var(--primary-color);">[${parts[1]}]</span>`;
                    }
                    return player;
                }).join(' <span style="color: var(--border-bright);">//</span> ');
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    applySearchHighlight();
}

function applySearchHighlight() {
    const rows = document.querySelectorAll("#leaderboard-body tr");
    if (!currentSearchQuery) {
        rows.forEach(row => row.classList.remove("dimmed", "highlight-row"));
        return;
    }
    rows.forEach(row => {
        if (row.querySelector(".state-cell")) return; 
        const rosterCell = row.cells[row.cells.length - 1]; 
        if (rosterCell && rosterCell.textContent.toLowerCase().includes(currentSearchQuery)) {
            row.classList.remove("dimmed");
            row.classList.add("highlight-row");
        } else {
            row.classList.remove("highlight-row");
            row.classList.add("dimmed");
        }
    });
}

function showError() {
    document.getElementById("leaderboard-body").innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 50px; color: var(--danger); font-family: 'Quantico', sans-serif; letter-spacing: 2px;">ERROR — COULD NOT REACH DATABASE</td></tr>`;
}

// --- DOSSIER LOGIC (ALL-TIME CAREER DATA) ---
function openDossier(operatorName) {
    // 1. Filter all runs containing this operator from ALL TIME (Active + Archive)
    const runs = careerData.filter(row => {
        const names = row.roster.toUpperCase().split(',').map(p => p.split(':')[0].trim());
        return names.includes(operatorName.toUpperCase());
    });

    if (runs.length === 0) return;

    // 2. Aggregate Data
    const deployments = runs.length;
    let highScore = 0;
    let totalKills = 0;
    let maxDist = 0;
    let sumAcc = 0;
    const teamCounts = {1:0, 2:0, 3:0, 4:0};

    runs.forEach(run => {
        let personalScore = run.score; 
        const players = run.roster.toUpperCase().split(',');
        const myPlayerStr = players.find(p => p.startsWith(operatorName.toUpperCase() + ":"));
        if(myPlayerStr) {
            const parts = myPlayerStr.split(':');
            if(parts.length > 1) personalScore = parseInt(parts[1], 10) || run.score;
        }

        if (personalScore > highScore) highScore = personalScore;
        totalKills += run.pilots;
        if (run.maxdist > maxDist) maxDist = run.maxdist;
        sumAcc += run.acc;
        
        let sizeKey = run.teamSize >= 4 ? 4 : run.teamSize;
        teamCounts[sizeKey]++;
    });

    const avgAcc = Math.round(sumAcc / deployments);
    
    let prefSize = 1;
    let maxCount = 0;
    for (let size in teamCounts) {
        if (teamCounts[size] > maxCount) {
            maxCount = teamCounts[size];
            prefSize = parseInt(size, 10);
        }
    }
    const sizes = {1: "SOLO", 2: "DUO", 3: "TRIO", 4: "SQUAD"};
    const preferredUnit = sizes[prefSize];

    // 3. Determine Glow Tier Hierarchy using CAREER DATA
    let tier = "tier-standard";
    let classText = "CLASSIFICATION: STANDARD OP";

    const isTop5AllTime = (sortKey) => {
        const sorted = [...careerData].sort((a,b) => b[sortKey] - a[sortKey]).slice(0, 5);
        return sorted.some(row => {
            const names = row.roster.toUpperCase().split(',').map(p => p.split(':')[0].trim());
            return names.includes(operatorName.toUpperCase());
        });
    };

    const isDiamond = isTop5AllTime('score') || isTop5AllTime('acc') || isTop5AllTime('pilots') || isTop5AllTime('maxdist');

    if (isDiamond) {
        tier = "tier-diamond";
        classText = "CLASSIFICATION: ELITE (ALL-TIME TOP 5)";
    } else if (totalKills >= 500) {
        tier = "tier-emerald";
        classText = "CLASSIFICATION: ANTI-AIR SPECIALIST";
    } else if (maxDist >= 1500) {
        tier = "tier-pink";
        classText = "CLASSIFICATION: EXTREME LONG-RANGE";
    } else if (avgAcc >= 90) {
        tier = "tier-gold";
        classText = "CLASSIFICATION: DEADEYE";
    }

    // 4. Inject Data into UI
    document.getElementById('dossier-name').textContent = operatorName.toUpperCase();
    document.getElementById('dossier-class').textContent = classText;
    document.getElementById('dos-deps').textContent = deployments;
    document.getElementById('dos-score').textContent = highScore;
    document.getElementById('dos-kills').textContent = totalKills;
    document.getElementById('dos-dist').textContent = maxDist + "m";
    document.getElementById('dos-acc').textContent = avgAcc + "%";
    document.getElementById('dos-unit').textContent = preferredUnit;

    const box = document.getElementById('dossier-content');
    box.className = "dossier-box " + tier;

    // Show Modal
    document.getElementById('dossier-modal').classList.remove('hidden');
}

function closeDossier() {
    document.getElementById('dossier-modal').classList.add('hidden');
}
