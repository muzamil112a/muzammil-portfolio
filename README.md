# Portfolio

A personal portfolio built as a cinematic scene rather than a page. Sections are
numbered in Roman numerals and the whole thing sits under fog, film grain and the
occasional flash of lightning, with a custom cursor and sound you can mute.

Live sections cover who I am, what I have worked on and how to reach me.

## Built with

| | |
|---|---|
| React 18 + Vite | app and build |
| GSAP | scroll and timeline animation |
| Three.js | the particle and depth work |
| Tailwind CSS | layout and type |
| oxlint | linting |

## Running it

    npm install
    npm run dev

Then open the address Vite prints, usually http://localhost:5173

| Command | What it does |
|---|---|
| `npm run dev` | start the dev server |
| `npm run build` | production build into `dist` |
| `npm run preview` | serve the production build locally |
| `npm run lint` | run oxlint |

## Layout

    src/
      App.jsx          the shell and scene order
      sections/        the page sections
      components/      cursor, navigation, fog, grain, lightning, subtitles
      hooks/           shared behaviour
      data/            content
      utils/           helpers

The atmosphere lives in `components`: `FogOverlay` and `FogParticles` for depth,
`FilmGrain` and `Vignette` for the film treatment, `LightningFlash` for the
timing, `CustomCursor` and `ScrambleText` for the interaction, `MuteToggle` for
the audio.
