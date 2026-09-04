# Cognivive NER — Smart India Hackathon 2026: Official 5–7 Minute Demonstration Guide

This guide details the exact step-by-step live presentation flow for SIH judges. Everything runs against real PostgreSQL data, the Python AI telemetry engine, and the React frontend.

---

## ⏱️ Demo Overview Schedule (Total: 6 Minutes)

| Time | Stage | Action |
|---|---|---|
| **0:00 – 1:00** | Problem Statement & Non-Diagnostic Framing | Introduction & Architecture |
| **1:00 – 2:30** | Elder Experience | Reminders, Voice Commands, Playing a Cognitive Game |
| **2:30 – 3:45** | AI In Action | Real Telemetry Ingestion, DDA Adjustment & Profile Updates |
| **3:45 – 4:30** | Offline Resilience Demo | Simulating offline gameplay & auto-syncing on reconnection |
| **4:30 – 5:45** | Caregiver Intelligence Portal | 5-Domain Radar, Trends, Game Analytics, Calibration & Alerts |
| **5:45 – 6:30** | Questions & Jury Review | Technical & Architecture Q&A |

---

## 🚀 Live Step-by-Step Instructions

### Step 1: Login as Elder (Minute 0:00 – 1:00)
1. Open `http://localhost:3000` in the browser.
2. Click the **"Elder Demo Account"** quick-fill button (or enter `elder@cognivive.com` / `password123`).
3. Click **"Sign In to Your Dashboard"**.
4. **Highlight for Judges**:
   - High-contrast elderly interface with anti-glare cream background.
   - Large typography and minimum 60px touch targets.
   - Simplified navigation showing today's routine without cognitive clutter.

---

### Step 2: Smart Reminders & Multilingual Voice Command (Minute 1:00 – 2:00)
1. Point to **Today's Reminders**:
   - Show `Morning Blood Pressure Medication` marked as **Completed**.
   - Show `Mid-Day Hydration & Walk` with the **Mark as Done** and **Snooze** buttons.
2. Click the **"Voice Assistant"** microphone button:
   - Speak: *"Start Memory Blossom"* (or in Hindi: *"Quick Harvest lagao"*).
   - If microphone permission is disabled or simulated, click on the **Start Memory Blossom** button.
3. The platform announces the action via Web Speech synthesis and transitions seamlessly to the activity.

---

### Step 3: Play Cognitive Activity (Minute 2:00 – 3:30)
1. In **Memory Blossom**:
   - Observe the flower sequence blooming with pleasant audio chimes.
   - Tap the flowers in sequence.
   - Note the real-time feedback and encouragement.
2. Upon completing the 3 trials:
   - The **Game Result Modal** appears.
   - **Show Judges**:
     - *Accuracy Percentage* (e.g. 100%).
     - *Average Reaction Time* (e.g. 920ms).
     - *Real AI Dynamic Difficulty Adjustment*: Level advances from Level 2 to Level 3 with an explainable rationale:
       *"Outstanding sequence recall (100% accuracy). Advancing to challenge level 3."*
     - Reiterate: **This is non-diagnostic activity feedback, calculated from real millisecond timestamps.**

---

### Step 4: Offline / Low-Bandwidth Resilience (Minute 3:30 – 4:30)
1. Open Browser DevTools (`F12` $\to$ Network tab) and set throttling to **Offline** (or disconnect Wi-Fi).
2. Note the top banner immediately updates:
   > 🔴 **Offline Mode** — Local saving active. Game telemetry & reminders are securely queued on this device.
3. Play another round of a game or tap **Mark as Done** on an active reminder.
4. Note that gameplay proceeds smoothly with zero errors; the event is saved to IndexedDB (`cognivive_offline_db`).
5. Re-enable network in DevTools (**No throttling**).
6. Observe the automatic transition:
   > 🟡 **Syncing...** $\longrightarrow$ 🟢 **Synced Successfully**.
7. The batch is sent to `POST /api/v1/sync/batch` and committed to PostgreSQL with complete idempotency protection (`ON CONFLICT (id) DO NOTHING`).

---

### Step 5: Caregiver Intelligence Portal (Minute 4:30 – 5:45)
1. Click **Sign Out** and sign in as Caregiver (`caregiver@cognivive.com` / `password123`).
2. Point out the **Assigned Patient Roster**:
   - `Ramchandra Sharma` (Relationship: Daughter) with status **STABLE**.
   - Show summary KPIs: Composite Activity Score (68.4), Personal Baseline (62.5), and today's 75% reminder completion.
3. Open **5-Domain Cognitive Radar Chart**:
   - Point to the 5 domains: Working Memory, Processing Speed, Attention, Reminiscence, and Problem Solving.
   - Highlight the non-diagnostic disclaimer: *"These scores represent activity performance within this platform. They are not medical or diagnostic scores."*
4. Click the **Longitudinal Trends** tab:
   - Toggle metrics: *Accuracy*, *Reaction Time*, *Score*, and *Difficulty*.
   - Hover over data dots to inspect chronological progression across historical sessions.
5. Click **Game-Wise Analytics**:
   - Show individual game cards for *Memory Blossom*, *Quick Harvest*, and *Golden Memories*.
   - Demonstrate the **Caregiver Calibrate Difficulty Level** slider (e.g., set Golden Memories to Level 4).
   - Point out that this manual override is recorded transparently in PostgreSQL.
6. Review the **Performance Change Alert Card**:
   - Explain the alert logic: Detects variance from the senior's *personal baseline* to suggest friendly check-ins, strictly avoiding diagnostic claims.

---

### Step 6: Jury Summary & Closing (Minute 5:45 – 6:30)
1. **Highlight the 5 Core Innovations**:
   1. Real, transparent AI DDA pipeline (no mock data, no black-box ML).
   2. Strict non-diagnostic framing complying with healthcare assistive regulations.
   3. Culturally resonant activities for Indian seniors (classical melodies, nostalgic heritage).
   4. Local-first offline resilience with IndexedDB and idempotent synchronization.
   5. Full accessibility for seniors (high contrast, 60px touch targets, audio feedback, voice control).
2. Answer jury questions regarding PostgreSQL relational integrity, microservices decoupling, and production containerization.
