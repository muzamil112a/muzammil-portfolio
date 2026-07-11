# System Update Instructions: Portfolio Website Optimization

**Role:** You are an expert Frontend Developer and UI/UX Designer. Update the website codebase by focusing strictly on fixing the synchronized global auto-scrolling engine, implementing the initial loading screen, and setting up the narrative subtitles.

Please execute **ONLY** the following three specific tasks:

---

### 🚨 1. CRITICAL BUG FIX: GLOBAL AUTO-SCROLLING & DIAMOND INDICATOR SYNC
* **Current Issue:** The auto-scrolling mechanism is incomplete and out of sync with the UI indicators. It automatically scrolls smoothly from Section 1 to Section 2, but then it completely stops moving forward, halting any automated progression. More importantly, **the auto-scroll is NOT moving in lockstep with the top-center diamond pagination indicators**—meaning the automated page transition and the active diamond state are disconnected.
* **Required Fix:** 1. **Global Re-architecture:** Re-architect the scroll automation script to be fully global and continuous across ALL sections (Hero -> About -> Projects -> Hub -> Contact -> Footer) so it keeps moving seamlessly without halting after Section 2.
  2. **Perfect Synchronization:** Bind the auto-scrolling trigger directly to the top-center diamond pagination indicators. As the website automatically scrolls to the next section, the corresponding diamond must light up/activate smoothly at the exact same moment. The scroll position and the diamond indicator states must track each other flawlessly without any delay or mismatch.

---

### ⏳ 2. NEW FEATURE: SEPARATE STARTING LOADING PAGE
* **Requirement:** Create a dedicated, clean, and atmospheric loading page that appears at the very beginning before the user enters the main website.
* **Mechanism:** * This screen must show a visual loading progress indicator running from 0% to 100%.
  * Strictly hide and prevent the rendering of the main portfolio content (Hero video, text, layers) until the loading progress hits exactly 100%.
  * Once 100% is achieved, smoothly unmount the loading screen and transition into the main entry/Hero section.

---

### 💬 3. SUBTITLE SYNCHRONIZATION & GLOBAL IMPLEMENTATION
* **Current Issue:** The subtitles currently do not match the narrator's actual voice-over audio track. Furthermore, the subtitles have only been implemented in the Hero section; all other sections are completely missing their subtitle text overlays.
* **Required Fix:** Implement a global subtitle system anchored at the bottom-center of the screen. The subtitles must be hardcoded to match the narrator's voice lines perfectly and must be precisely synchronized with the audio timing of each specific section as follows:

* **Line 1 — Hero Section:**
  `"In every fog... there is one who does not lose his way. I am Muhammad Muzammil."`
* **Line 2 — About Section:**
  `"Where others see chaos... I see the architecture of what could be."`
* **Line 3 — Projects Section:**
  `"Every door in this mansion... was forged by my own hands."`
* **Line 4 — Hub Section:**
  `"Four paths lie before you... choose."`

---
### ⚙️ Developer Notes & Constraints
* Ensure the state orchestration between the loading page transitions, the synchronized diamond-and-scroll engine, and the section-by-section audio/subtitle timing triggers runs flawlessly.
* The code execution must be lightweight, responsive, and free of any visual lag or script conflicts.


### 🚨 4. CRITICAL BUG FIX: AUDIO-LOCKED GLOBAL AUTO-SCROLLING
* **Current Issue:** The auto-scrolling engine prematurely triggers section transitions while the narrator is still actively speaking, cutting off the narrative experience.
* **Required Fix:** 
  1. **Narration-Gated Transitions:** Attach strict event handlers (such as HTML5 Audio `onended` event listeners or state-driven completion flags) directly to the voice-over audio layers. The global auto-scroll routine must be securely locked while audio playback is active.
  2. **Sequential Release:** The website must be explicitly blocked from auto-scrolling or transitioning to the next section *until* the current section's narrator has completely finished speaking their assigned voice line.

---

### ⏳ 5. NEW FEATURE: ATMOSPHERIC PRE-ONBOARDING LOADING SCREEN
* **Current Issue:** The initial loading page is missing; the site boots without an asset-readiness sequence before the "Enter Fog" screen.
* **Required Fix:** Build a separate, highly immersive loading screen that executes *before* the initial "Enter Fog" onboarding layer appears.
* **Visual Specs (Based on Reference Image):** 
  * **Background Visuals:** A high-speed cinematic asset or shader effect featuring dynamic, high-velocity glowing light streaks and moving cosmic sparks (orange/gold tunnel warp acceleration look).
  * **Loading Indicator:** Place a standalone, beautifully stylized animated **loading circle** at the center of the screen that tracks loading metrics linearly from 0% to 100%.
  * **Lifecycle:** Keep all underlying portfolio UI modules, heavy background videos, and sound layers hidden until the central progress ring hits exactly 100%. Once complete, smoothly unmount the loader with a fade transition to reveal the entry phase.
"""