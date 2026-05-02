// Database Connections
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_qo5j17dEIfzFRUndSzZDaLYHyHBq-UHaVziSH3u5X4QD598YGNnOehyEA7lLPoRHZdJuAMUCNy2j/pub?gid=0&single=true&output=csv";
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

let activeSeasonData = []; 
let allTimeData = [];      
let currentView = "global";
let isReady = false;
let searchTerm = ""; 

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    pullDatabases();
    initWipeTimer(); 
    
    const searchInput = document.getElementById("operator-search");
    const rivalryBtn = document.getElementById("rivalry-btn");

    // live search and rivalry detector
    searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value.toLowerCase().trim();
        updateSearchHighlights();

        // if they separate two names with a comma, check if we can trigger rivalry mode
        if (searchTerm.includes(',')) {
            const players = searchTerm.split(',').map(s => s.trim()).filter(s => s.length > 0);
            
            if (players.length === 2) {
                const p1Exists = allTimeData.some(r => r.roster.toLowerCase().includes(players[0]));
                const p2Exists = allTimeData.some(r => r.roster.toLowerCase().includes(players[1]));

                if (p1Exists && p2Exists) {
                    rivalryBtn.innerHTML = `⚔ INITIATE RIVALRY: ${players[0].toUpperCase()} VS ${players[1].toUpperCase()}`;
                    rivalryBtn.classList.remove("hidden");
                    rivalryBtn.onclick = () => openDossier([players[0], players[1]]);
                    return;
                }
            }
        }
        rivalryBtn.classList.add("hidden");
    });

    // click outside to close dossier
    document.getElementById('dossier-modal').addEventListener('click', (e) => {
        if(e.target.id === 'dossier-modal') document.getElementById('dossier-modal').classList.add('hidden');
    });
});

function initWipeTimer() {
    const wipeDisplay = document.getElementById("next-reset-meta");
    function tickClock() {
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

        if (wipeDisplay) wipeDisplay.textContent = `WIPE IN: ${d}D ${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
    }
    tickClock(); setInterval(tickClock, 1000);
}

function setupNavigation() {
    document.querySelectorAll(".nav-btn[data-view]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn[data-view]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentView = btn.getAttribute("data-view");
            buildTable();
        });
    });
}

function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url + "&_=" + new Date().getTime(), {
            download: true, header: true, skipEmptyLines: true,
            transformHeader: h => h.trim(),
            complete: results => resolve(results.data),
            error: err => reject(err)
        });
    });
}

function formatRow(row) {
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

async function pullDatabases() {
    updateStatus("connecting");
    try {
        const [activeCSV, archiveCSV] = await Promise.all([
            fetchCSV(SHEET_CSV_URL),
            fetchCSV(ARCHIVE_CSV_URL)
        ]);

        activeSeasonData = activeCSV.filter(r => r.Roster && r.Difficulty).map(formatRow);
        const pastSeasons = archiveCSV.filter(r => r.Roster && r.Difficulty).map(formatRow);
        allTimeData = [...activeSeasonData, ...pastSeasons];
        
        isReady = true;
        updateStatus("online");
        
        const timestamp = new Date().toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' });
        document.getElementById("last-updated-meta").textContent = `UPDATED: ${timestamp}`;
        
        startLiveTicker(activeSeasonData);
        buildTable();

    } catch (err) {
        updateStatus("error"); 
        document.getElementById("leaderboard-body").innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 50px; color: var(--danger); font-family: 'Quantico';">ERROR — COULD NOT REACH DATABASE</td></tr>`;
    }
}

function updateStatus(state) {
    const dot = document.querySelector(".status-dot");
    const txt = document.getElementById("status-text");
    dot.className = "status-dot";
    
    if (state === "connecting") txt.textContent = "CONNECTING...";
    if (state === "online") { dot.classList.add("online"); txt.textContent = "NETWORK ONLINE"; }
    if (state === "error") { dot.classList.add("error"); txt.textContent = "CONNECTION LOST"; }
}

function startLiveTicker(data) {
    const textEl = document.getElementById("ticker-text");
    if (!data.length) {
        textEl.textContent = "AWAITING NEW TRANSMISSIONS...";
        return;
    }

    // grab the 5 most recent records
    const recent = data.slice(-5).reverse();
    const messages = recent.map(r => {
        // extract just the names without scores for brevity
        const names = r.roster.split(',').map(p => p.split(':')[0]).join(' & ');
        return `[NEW REC] ${names.toUpperCase()} LOGGED ${r.score} PTS (${r.maxdist}m MAX DIST)`;
    });

    // double up the string so the marquee loop is seamless
    const feedString = messages.join(' &nbsp;&nbsp;&nbsp;◈&nbsp;&nbsp;&nbsp; ');
    textEl.innerHTML = feedString + '&nbsp;&nbsp;&nbsp;◈&nbsp;&nbsp;&nbsp;' + feedString;
}

function buildTable() {
    if (!isReady) return;
    const viewConfig = VIEWS[currentView];

    document.getElementById("view-title").textContent = viewConfig.title;
    document.getElementById("view-sub").textContent = viewConfig.sub;

    let targetData = activeSeasonData;
    if (viewConfig.filterSize !== null) {
        targetData = activeSeasonData.filter(row => viewConfig.filterSize === 4 ? row.teamSize >= 4 : row.teamSize === viewConfig.filterSize);
    }

    let sortedData;
    if (currentView === "accuracy") sortedData = targetData.sort((a, b) => b.acc - a.acc);
    else if (currentView === "pilots") sortedData = targetData.sort((a, b) => b.pilots - a.pilots);
    else if (currentView === "maxdist") sortedData = targetData.sort((a, b) => b.maxdist - a.maxdist);
    else sortedData = targetData.sort((a, b) => b.score - a.score);

    const top50 = sortedData.slice(0, 50);
    document.getElementById("total-entries-meta").textContent = `ENTRIES: ${sortedData.length}`;

    const thead = document.getElementById("leaderboard-head");
    thead.innerHTML = "";
    const headerRow = document.createElement("tr");
    viewConfig.columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    const tbody = document.getElementById("leaderboard-body");
    tbody.innerHTML = "";

    if (top50.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${viewConfig.columns.length}" style="text-align: center; padding: 50px; color: var(--border-bright); font-family: 'Quantico'; letter-spacing: 2px;">NO RECORDS FOUND</td></tr>`;
        return;
    }

    top50.forEach((row, idx) => {
        const rank = idx + 1;
        const tr = document.createElement("tr");
        if (rank === 1) tr.classList.add("rank-1");

        viewConfig.columns.forEach(col => {
            const td = document.createElement("td");
            
            if (col.format === "rank") { 
                td.classList.add("col-rank"); td.textContent = rank === 1 ? "#1 ◈" : `#${rank}`; 
            } 
            else if (col.format === "size") { 
                const sizes = {1: "SOLO", 2: "DUO", 3: "TRIO"}; 
                td.textContent = sizes[row.teamSize] || "SQUAD"; td.style.color = "var(--text-muted)"; 
            }
            else if (col.format === "diff") { td.textContent = (row.difficulty || "UNKNOWN").toUpperCase(); }
            else if (col.format === "score") { td.classList.add("col-val"); td.textContent = row.score; }
            else if (col.format === "acc") { td.classList.add("col-val"); td.textContent = row.acc + "%"; }
            else if (col.format === "pilots") { td.classList.add("col-val"); td.textContent = row.pilots; }
            else if (col.format === "maxdist") { td.classList.add("col-val"); td.textContent = row.maxdist + "m"; }
            else if (col.format === "roster") {
                td.innerHTML = row.roster.split(',').map(player => {
                    const parts = player.split(':');
                    if (parts.length >= 2) {
                        const safeName = parts[0].replace(/'/g, "\\'"); 
                        return `<span class="operator-link" style="color: #fff; font-family: 'Quantico';" onclick="openDossier('${safeName}')">${parts[0].toUpperCase()}</span> <span style="color: var(--primary-color);">[${parts[1]}]</span>`;
                    }
                    return player;
                }).join(' <span style="color: var(--border-bright);">//</span> ');
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    updateSearchHighlights();
}

function updateSearchHighlights() {
    const rows = document.querySelectorAll("#leaderboard-body tr");
    if (!searchTerm) {
        rows.forEach(r => r.classList.remove("dimmed", "highlight-row"));
        return;
    }
    
    rows.forEach(row => {
        if (row.querySelector(".state-cell")) return; 
        
        const rosterCell = row.cells[row.cells.length - 1]; 
        if (rosterCell && rosterCell.textContent.toLowerCase().includes(searchTerm)) {
            row.classList.remove("dimmed");
            row.classList.add("highlight-row");
        } else {
            row.classList.remove("highlight-row");
            row.classList.add("dimmed");
        }
    });
}

// --- DOSSIER MATH ENGINE ---
function calculateStats(opName) {
    const targetOp = opName.toUpperCase();
    
    const opRuns = allTimeData.filter(row => {
        const names = row.roster.toUpperCase().split(',').map(p => p.split(':')[0].trim());
        return names.includes(targetOp);
    });

    if (!opRuns.length) return null;

    let highScore = 0; let totalKills = 0; let maxDist = 0; let sumAcc = 0;
    const sizeTracker = {1:0, 2:0, 3:0, 4:0};

    opRuns.forEach(run => {
        let personalScore = run.score; 
        const players = run.roster.toUpperCase().split(',');
        const me = players.find(p => p.startsWith(targetOp + ":"));
        
        if (me) {
            const parts = me.split(':');
            if (parts.length > 1) personalScore = parseInt(parts[1], 10) || run.score;
        }

        highScore = Math.max(highScore, personalScore);
        totalKills += run.pilots;
        maxDist = Math.max(maxDist, run.maxdist);
        sumAcc += run.acc;
        
        const sizeKey = run.teamSize >= 4 ? 4 : run.teamSize;
        sizeTracker[sizeKey]++;
    });

    const avgAcc = Math.round(sumAcc / opRuns.length);
    
    let prefSizeKey = 1; let maxCount = 0;
    for (const [size, count] of Object.entries(sizeTracker)) {
        if (count > maxCount) { maxCount = count; prefSizeKey = parseInt(size, 10); }
    }
    const unitLabels = {1: "SOLO", 2: "DUO", 3: "TRIO", 4: "SQUAD"};

    const checkTop5 = (metric) => {
        const sorted = [...allTimeData].sort((a,b) => b[metric] - a[metric]).slice(0, 5);
        return sorted.some(r => r.roster.toUpperCase().split(',').map(p => p.split(':')[0].trim()).includes(targetOp));
    };

    let tierClass = "tier-standard";
    let tierText = "CLASSIFICATION: STANDARD OP";

    if (checkTop5('score') || checkTop5('acc') || checkTop5('pilots') || checkTop5('maxdist')) {
        tierClass = "tier-diamond"; tierText = "CLASSIFICATION: ELITE (ALL-TIME TOP 5)";
    } else if (totalKills >= 500) {
        tierClass = "tier-emerald"; tierText = "CLASSIFICATION: ANTI-AIR SPECIALIST";
    } else if (maxDist >= 1500) {
        tierClass = "tier-pink"; tierText = "CLASSIFICATION: EXTREME LONG-RANGE";
    } else if (avgAcc >= 90) {
        tierClass = "tier-gold"; tierText = "CLASSIFICATION: DEADEYE";
    }

    return { 
        name: targetOp, deps: opRuns.length, highScore, kills: totalKills, 
        maxDist, avgAcc, unit: unitLabels[prefSizeKey], tierClass, tierText 
    };
}

// dynamically draws a military rank patch based on total deployments
function generateRankPatch(deployments) {
    let rankTitle = "PRIVATE";
    let shapes = "";

    if (deployments >= 50) {
        rankTitle = "ATAC COMMANDER"; // The 5-Point Star
        shapes = `<polygon points="50,20 60,40 80,40 65,55 70,75 50,65 30,75 35,55 20,40 40,40" fill="currentColor"/>`;
    } else if (deployments >= 40) {
        rankTitle = "FIELD MAJOR"; // 3 Stacked Diamonds
        shapes = `<polygon points="50,15 65,30 50,45 35,30" fill="currentColor"/><polygon points="50,40 65,55 50,70 35,55" fill="currentColor"/><polygon points="50,65 65,80 50,95 35,80" fill="currentColor"/>`;
    } else if (deployments >= 30) {
        rankTitle = "CAPTAIN"; // 2 Vertical Bars
        shapes = `<rect x="35" y="25" width="10" height="50" fill="currentColor"/><rect x="55" y="25" width="10" height="50" fill="currentColor"/>`;
    } else if (deployments >= 20) {
        rankTitle = "LIEUTENANT"; // 1 Vertical Bar
        shapes = `<rect x="45" y="25" width="10" height="50" fill="currentColor"/>`;
    } else if (deployments >= 10) {
        rankTitle = "SERGEANT"; // 3 Chevrons
        shapes = `<polyline points="20,40 50,20 80,40" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="miter"/><polyline points="20,60 50,40 80,60" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="miter"/><polyline points="20,80 50,60 80,80" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="miter"/>`;
    } else if (deployments >= 5) {
        rankTitle = "CORPORAL"; // 2 Chevrons
        shapes = `<polyline points="25,45 50,25 75,45" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="miter"/><polyline points="25,65 50,45 75,65" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="miter"/>`;
    } else {
        rankTitle = "PRIVATE"; // 1 Chevron
        shapes = `<polyline points="30,55 50,35 70,55" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="miter"/>`;
    }

    return {
        title: rankTitle,
        svgMarkup: `<svg viewBox="0 0 100 100" style="width: 80px; height: 80px; border: 1px solid var(--border-color); border-radius: 4px; background: rgba(0,0,0,0.4); flex-shrink: 0; color: inherit;">${shapes}</svg>`
    };
}

// helper to build the grid html
function buildDossierInner(stats) {
    const rank = generateRankPatch(stats.deps);

    return `
        <div class="dossier-header" style="display: flex; align-items: center; gap: 20px;">
            ${rank.svgMarkup}
            <div>
                <span class="terminal-eyebrow">// ${rank.title}</span>
                <h2 class="terminal-title" style="color: inherit; text-shadow: inherit;">${stats.name}</h2>
                <p class="terminal-sub" style="color: inherit; font-weight: bold; margin-top: 5px;">${stats.tierText}</p>
            </div>
        </div>
        <div class="dossier-grid">
            <div class="stat-box"><span class="stat-label">DEPLOYMENTS</span><span class="stat-val">${stats.deps}</span></div>
            <div class="stat-box"><span class="stat-label">HIGH SCORE</span><span class="stat-val">${stats.highScore}</span></div>
            <div class="stat-box"><span class="stat-label">PILOT KILLS</span><span class="stat-val">${stats.kills}</span></div>
            <div class="stat-box"><span class="stat-label">MAX DISTANCE</span><span class="stat-val">${stats.maxDist}m</span></div>
            <div class="stat-box"><span class="stat-label">AVG ACCURACY</span><span class="stat-val">${stats.avgAcc}%</span></div>
            <div class="stat-box"><span class="stat-label">PREFERRED UNIT</span><span class="stat-val">${stats.unit}</span></div>
        </div>
    `;
}

// dynamic modal generator
function openDossier(operatorInput) {
    const box = document.getElementById('dossier-content');
    
    // check if it's a single operator or a rivalry array
    if (typeof operatorInput === 'string') {
        const stats = calculateStats(operatorInput);
        if (!stats) return;
        
        box.innerHTML = `<button class="dossier-close" onclick="closeDossier()">×</button>` + buildDossierInner(stats);
        box.className = `dossier-box ${stats.tierClass}`;

    } else if (Array.isArray(operatorInput)) {
        const stats1 = calculateStats(operatorInput[0]);
        const stats2 = calculateStats(operatorInput[1]);
        if (!stats1 || !stats2) return;

        box.innerHTML = `
            <button class="dossier-close" onclick="closeDossier()">×</button>
            <div class="dossier-split">
                <div class="dossier-side ${stats1.tierClass}" style="color: inherit; text-shadow: inherit;">
                    ${buildDossierInner(stats1)}
                </div>
                <div class="vs-divider"><div class="vs-badge">VS</div></div>
                <div class="dossier-side ${stats2.tierClass}">
                    ${buildDossierInner(stats2)}
                </div>
            </div>
        `;
        box.className = `dossier-box split-view`; // neutral box holding two colored sides
    }

    document.getElementById('dossier-modal').classList.remove('hidden');
}

function closeDossier() {
    document.getElementById('dossier-modal').classList.add('hidden');
}
