<div align="center">

# 🌫️ Muzammil — Cinematic Portfolio

**A personal portfolio built as a film scene, not a web page.**

Fog, film grain, lightning, a custom cursor, sound you can mute, and a terminal you can actually talk to.

<a href="https://muzammil-portfolio-ashen.vercel.app"><img src="https://img.shields.io/badge/Live%20demo-visit-1f6f5c?style=for-the-badge&logo=vercel&logoColor=white" alt="Live demo" /></a>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
<img src="https://img.shields.io/badge/Vite-build-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
<img src="https://img.shields.io/badge/GSAP-animation-88CE02?style=for-the-badge&logo=greensock&logoColor=black" alt="GSAP" />
<img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
<img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />

</div>

---

## ✨ What makes it different

| | |
|---|---|
| 🎬 **Cinematic atmosphere** | Layered fog and fog particles for depth, film grain and a vignette for the "shot on film" look, and the occasional lightning flash timed to the scene |
| 🏛️ **Roman-numeral chapters** | Each section is a numbered chapter (I, II, III…) with its own diamond / roman navigation |
| 🤖 **WARDEN.AI terminal** | An in-page terminal with a boot sequence and typed replies. Ask it about my work, skills or CV. Its "brain" is a local, keyword-scored knowledge base: no LLM, no network calls |
| 🖱️ **Custom interaction** | Custom cursor, scramble-text headings, subtitles and smooth GSAP scroll timelines |
| 🔊 **Sound design** | Ambient audio with a mute toggle, handled by a small audio manager hook |
| ⚡ **Fast first load** | Assets and videos are preloaded and cached before the scene starts |

---

## 🧱 Built with

| Tool | Used for |
|---|---|
| **React 18 + Vite** | App shell and fast builds |
| **GSAP + ScrollTrigger** | Scroll-driven and timeline animation |
| **Three.js** | Particles and depth effects |
| **Tailwind CSS** | Layout and typography |
| **oxlint** | Linting |

---

## 🚀 Run it locally

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

---

## 📁 Project layout

```
src/
├── App.jsx          the shell and the order of scenes
├── sections/        Loading · Hero · Hub · About · Projects · Terminal · Contact
├── components/      cursor, navigation, fog, grain, lightning, subtitles, mute
├── hooks/           useActiveSection, useAudioManager
├── data/            wardenKnowledge.js — WARDEN.AI's local knowledge base
└── utils/           asset preloading and video cache
```

**Where the atmosphere lives:** `FogOverlay` + `FogParticles` (depth), `FilmGrain` + `Vignette` (film look), `LightningFlash` (timing), `CustomCursor` + `ScrambleText` (interaction), `MuteToggle` (audio).

---

<div align="center">

Made by **[Muhammad Muzamil](https://github.com/muzamil112a)** · Also see **[Orbitool](https://github.com/muzamil112a/orbitool)**

</div>
