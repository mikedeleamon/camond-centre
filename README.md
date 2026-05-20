# Camond Centre

A ambient command-centre desktop overlay built with Electron + React. PSP XMB-inspired aesthetics — glassmorphic tiles floating over animated ribbon waves and particles, with deep macOS system integrations.

---

## Overview

Camond Centre sits on your desktop (or second screen) as a living dashboard. It reads your Apple Calendar, fetches live weather, surfaces news, and manages tasks — all without leaving the ambient scene. The UI is intentionally quiet: dark backgrounds, translucent tiles, no harsh colours. It gets out of the way and comes alive only when you look at it.

---

## Running Locally

```bash
npm install
npm run dev        # starts Vite + Electron concurrently
```

Requires macOS (AppleScript integrations). Electron wraps a Vite/React frontend; the two communicate over a context-isolated IPC bridge.

---

## Features

### Dashboard Grid
Seven glassmorphic tiles laid out on a 12-column × 5-row CSS grid:

| Tile | Grid area | Contents |
|------|-----------|----------|
| Timeline | Left column, full height | Daily schedule with current-time indicator |
| Time & Date | Top centre | Large clock, date |
| Weather | Centre | Current conditions + on-hover forecast |
| Current Focus | Top right | Active or next calendar event |
| Meal Plan | Bottom left-centre | Breakfast / lunch / dinner for you and a kid |
| Notifications | Bottom centre | Live news feed |
| Tasks | Bottom right | Checklist synced with macOS Reminders |

---

### Tile Resize Handles
Hold **⌥ Option** and drag any tile's edge to resize it within the grid. Resizing snaps to column/row increments so tiles always align cleanly. The layout is persisted across sessions.

---

### Zen Mode
A stripped secondary-screen layout. Click the **⏱ icon** (bottom-right corner) to enter: all tiles disappear, leaving only the current task name in large floating type over the animated background. Exit with the **×** button in the top-right corner.

---

### Inline Weather Forecast Strip
Hover the Weather tile to expand it into a **6-hour sparkline** showing temperature trend and precipitation probability. Labels show exact hour timestamps. Collapses back to the summary card on mouse-out.

---

### "Next Up" Countdown in Current Focus
When no event is currently active, the Current Focus tile shows the name of the upcoming event with a **"in Xm"** countdown and a slow **radial fill** that completes exactly when the event starts.

---

### News Article Preview on Hover
Hovering a notification item in the Notifications tile **expands it inline** — other items compress slightly to make room — and shows the first two sentences of the article body. Clicking opens the article in your default browser via `shell.openExternal`.

News is fetched from Google News RSS every 30 minutes; placeholder items are shown on first load.

---

### Time-of-Day Colour Shifts
The background theme transitions through **nine phases** across the day, driven by the real clock:

| Phase | Hours | Palette |
|-------|-------|---------|
| Night | 0 – 5 | Deep navy |
| Dawn | 5 – 7 | Amber → indigo |
| Sunrise | 7 – 9 | Warm amber |
| Morning | 9 – 12 | Cool blue |
| Midday | 12 – 15 | Bright cool blue |
| Afternoon | 15 – 17 | Soft violet |
| Golden Hour | 17 – 19 | Warm violet |
| Dusk | 19 – 21 | Deepening violet |
| Night | 21 – 24 | Deep navy |

Gradients, ribbon colours, glow orbs, and particle tints all transition smoothly between phases using per-channel linear interpolation — no hard cuts.

---

### Idle Deepening
After **5 minutes** of no mouse or keyboard activity, tile opacity drops to near-zero and background animations slow by 30%, leaving only the ambient scene. Any mouse movement or keypress fades everything back in. Like a screensaver that never hides your data.

---

### Kid Calendar Swimlane
The Timeline tile has a second **"Kid"** swimlane showing events from an Apple Calendar named "Kid". Kid events appear as shorter, indented purple blocks on the right half of the timeline column. If no Kid calendar is found, fallback placeholder events are shown. The "+ Kid" label appears in the tile header when the lane is active.

---

### AppleScript Reminders Sync
The Task Board is wired to **macOS Reminders.app** via bidirectional AppleScript sync:

- Tasks added in the app are pushed to Reminders immediately
- Completing a task marks the matching Reminder complete
- New Reminders added externally appear in the Task Board within 60 seconds

No cloud account required — everything runs locally over AppleScript IPC.

---

### Animated Background
PSP XMB-inspired layered scene:

- **Gradient base** — three-stop radial + linear gradient, weather and hour aware
- **Glow orbs** — three large blurred circles that slowly breathe (opacity oscillation)
- **Ribbon waves** — four bezier SVG arcs that drift and sway independently
- **Particles** — 40 floating dots that rise with lateral drift; larger ones have halo glow

All animation is CSS-driven (`will-change: translate, opacity`) for GPU compositing.

---

### System Integrations

| Integration | How |
|-------------|-----|
| Apple Calendar | AppleScript — reads today's events every 5 minutes |
| Apple Reminders | AppleScript — bidirectional sync every 60 seconds |
| Weather | Tries macOS Weather.app first, falls back to `wttr.in` |
| Open URL | Electron `shell.openExternal` — opens articles in Safari/default browser |

---

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘⇧F` | Toggle true fullscreen (hides dock & menu bar) |
| `⌘⇧D` | Cycle window to next display |
| `⌘⇧H` | Hide / show window |
| `⌘⇧Q` | Quit |

---

## Tech Stack

- **Electron 33** — window management, IPC, system APIs
- **React 18 + TypeScript** — UI
- **Vite 6** — dev server and bundler
- **Tailwind CSS v4** — utility styles
- **Framer Motion** — entrance animations and layout transitions
- **date-fns** — date formatting
