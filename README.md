<div align="center">

<img src="atac_logo_transparent_large.png" alt="ATAC-01 Logo" width="500">

### ADVANCED THREAT ACQUISITION COURSE
**GLOBAL LEADERBOARD & COMBAT METRICS DATABASE**

[![Status: Online](https://img.shields.io/badge/NETWORK-ONLINE-00e5ff?style=for-the-badge)](#)
[![Cycle: 14-Day](https://img.shields.io/badge/CYCLE-14--DAY-ffd740?style=for-the-badge)](#)
[![Security: Active](https://img.shields.io/badge/ANTI--CHEAT-ACTIVE-40e080?style=for-the-badge)](#)

</div>

---

> **WARNING // RESTRICTED ACCESS**
> You are accessing the global tracking database for the ATAC-01 Vertical Engagement Module. All operator statistics, deployment histories, and combat metrics are logged and archived bi-weekly.

<div align="center">
  <img src="assets/leaderboard.jpg" alt="ATAC-01 Main Leaderboard Interface" width="100%">
</div>

## ◈ SYSTEM OVERVIEW

The ATAC-01 Database is a fully automated, serverless leaderboard architecture designed to track, verify, and display high-level operator performance in real-time. Built specifically to parse encrypted hashes generated from in-game Arma 3 terminals, this system ensures absolute data integrity while providing a sleek, tactical interface for operators to track their combat careers.

## ⌖ KEY FEATURES

* **The "Invisible Bouncer" Security:** A custom backend intercepts raw Arma 3 hashes, mathematically validates the checksum in milliseconds, and instantly rejects tampered or fraudulent scores before they ever touch the database.
* **Automated 14-Day Seasons:** An automated cron-trigger sweeps the active ladder, permanently backs up the data to a secure archive, and wipes the public database clean every 14 days to initiate a new tournament cycle.
* **Interactive Service Records:** Operators can click on any name on the board to pull up a secure Career Dossier—a live-calculated aggregation of their deployments, highest scores, confirmed pilot kills, max engagement distances, and average accuracy across all seasons.

## 🎖️ DYNAMIC THREAT TIERS

Elite operators are automatically assigned classification UI glows based on their all-time statistics. The system dynamically reads the database to award these legacy achievements:

<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>DIAMOND CLASSIFICATION</b><br>
        <i>Awarded for All-Time Top 5 Presence</i><br>
        <img src="assets/dossier-diamond.png" alt="Diamond Tier Dossier" width="400">
      </td>
      <td align="center">
        <b>GOLD CLASSIFICATION</b><br>
        <i>Awarded for 90%+ Career Accuracy</i><br>
        <img src="assets/dossier-gold.png" alt="Gold Tier Dossier" width="400">
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>PINK CLASSIFICATION</b><br>
        <i>Awarded for 1500m+ Max Distance Hit</i><br>
        <img src="assets/dossier-pink.png" alt="Pink Tier Dossier" width="400">
      </td>
      <td align="center">
        <b>STANDARD CLASSIFICATION</b><br>
        <i>Baseline Operator Service Record</i><br>
        <img src="assets/dossier-standard.png" alt="Standard Tier Dossier" width="400">
      </td>
    </tr>
  </table>
</div>

## ⚙ ARCHITECTURE

This application operates on a zero-maintenance, highly scalable tech stack:
* **Frontend:** Pure HTML/CSS/JS. Styled with a custom "Tactical CRT" CSS engine featuring zero-CPU-cost scanlines, dynamic glass-panel modals, and real-time search filtering.
* **Backend:** Google Apps Script Web App acting as a secure REST API and automated timeline manager.
* **Database:** Google Sheets (Dual-table schema utilizing live `Submissions` and permanent `Archive` tables).
* **Data Parsing:** `PapaParse.js` utilized for real-time asynchronous CSV streaming directly to the client browser.

## ⇪ SECURE UPLINK INSTRUCTIONS

1. Complete your ATAC-01 run in-game.
2. Copy the encrypted `ATAC_02|...` hash string from the post-mission terminal.
3. Navigate to the **Data Uplink Portal** on the live site.
4. Transmit the hash. The server will decrypt, verify, and log your metrics within 3.5 seconds.

---
<div align="center">
<i>"Ensure your Operator Name matches previous entries to maintain your career Service Record."</i><br>
<b>© 2026 ATAC-01 // ALL RIGHTS RESERVED</b><br><br>

<sub style="color: rgba(255, 255, 255, 0.4); letter-spacing: 1px;">// THE ATAC-01 PROJECT WAS BROUGHT TO LIFE WITH ASSISTANCE FROM GEMINI</sub>
</div>
