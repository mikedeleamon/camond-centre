# Contributing to Camond Centre

Thanks for taking the time. Here's everything you need to get oriented quickly.

---

## Running locally

```bash
git clone https://github.com/<you>/camond-centre.git
cd camond-centre
npm install
npm run dev       # starts Vite dev server + Electron concurrently
```

Requires **macOS** — the Calendar and Reminders integrations use AppleScript and will not work on other platforms.

---

## Project layout

```
electron/
  main.ts          # Electron main process — window setup, IPC handlers,
                   # AppleScript bridges for Calendar, Reminders, Weather
  preload.ts       # Context-isolated bridge — exposes electronAPI to the
                   # renderer without nodeIntegration

src/
  App.tsx          # Root component — wires hooks, state, and the grid together
  themes.ts        # All colour themes (CSS var values + ribbon colours)
  index.css        # Global CSS custom properties and keyframe animations
  lib/theme.ts     # Time-of-day + weather background palette logic

  components/
    Background/    # AnimatedBackground, RibbonWaves, Particles
    tiles/         # One file per dashboard tile
    GlassTile.tsx  # Shared tile wrapper (glass style, resize handles)
    ZenMode.tsx    # Fullscreen focus overlay
    Settings.tsx   # Settings panel

  hooks/           # useCurrentTime, useCalendar, useWeather, etc.
  types/           # Shared TypeScript types
```

---

## IPC bridge pattern

The renderer cannot call Node/Electron APIs directly. The flow is:

```
renderer (React)
  → window.electronAPI.<method>()        # defined in preload.ts
  → ipcRenderer.invoke('<channel>', ...) # crosses the context bridge
  → ipcMain.handle('<channel>', ...)     # handled in main.ts
  → result returned to renderer
```

To add a new system integration, add a handler in `main.ts`, expose it in `preload.ts`, and call it from a hook in `src/hooks/`.

---

## Theming

Colour themes live in `src/themes.ts`. Each theme sets four CSS custom properties as `r,g,b` triplets:

```ts
"--accent":        "99, 102, 241"   // used as rgba(var(--accent), 0.5)
"--accent-light":  "165, 167, 255"
"--tile-bg":       "8, 10, 24"
"--tile-bg-hover": "10, 14, 32"
```

All component colours should reference these variables — never hardcode an `rgba()` that only matches the midnight theme.

---

## Submitting changes

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes; keep commits focused and the diff reviewable
3. Open a pull request with a short description of what changed and why
4. If you're adding a new tile or integration, update the feature table in `README.md`

Bug fixes and small improvements are always welcome without prior discussion. For large new features, open an issue first so we can talk through the approach.
