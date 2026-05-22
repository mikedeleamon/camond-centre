// ── Nature-inspired color themes ─────────────────────────────────────────────
// Each theme sets four CSS custom properties on :root. The values are comma-
// separated r,g,b triplets intended for `rgba(var(--name), alpha)` usage in
// index.css.  Changing the theme live-swaps glass tile backgrounds, active
// accent glows, and the time-indicator pulse — no component re-renders needed.

export interface ColorTheme {
  id: string;
  name: string;
  /** Hex color shown as the swatch in the settings panel. */
  swatch: string;
  /** CSS custom property values applied to :root. */
  vars: {
    "--tile-bg": string;
    "--tile-bg-hover": string;
    "--accent": string;
    "--accent-light": string;
  };
  /**
   * Fixed ribbon / background colors used when this theme is active.
   * The "midnight" theme is the only one that ignores these and lets the
   * time-of-day palette run instead.
   */
  ribbon: {
    primary: string;
    secondary: string;
    glow: string;
  };
}

export const THEMES: ColorTheme[] = [
  // ── 1. Midnight  ─────────────────────────────  deep indigo-navy (default)
  // ribbon is intentionally empty — AnimatedBackground uses time-of-day palette instead.
  {
    id: "midnight",
    name: "Midnight",
    swatch: "#6366f1",
    vars: {
      "--tile-bg":       "8, 10, 24",
      "--tile-bg-hover": "10, 14, 32",
      "--accent":        "99, 102, 241",
      "--accent-light":  "165, 167, 255",
    },
    ribbon: {
      primary:   "rgba(99, 102, 241, 0.38)",
      secondary: "rgba(139, 92, 246, 0.28)",
      glow:      "rgba(99, 102, 241, 0.14)",
    },
  },

  // ── 2. Forest  ───────────────────────────────  deep emerald, pine canopy
  {
    id: "forest",
    name: "Forest",
    swatch: "#10b981",
    vars: {
      "--tile-bg":       "6, 18, 12",
      "--tile-bg-hover": "8, 24, 16",
      "--accent":        "16, 185, 129",
      "--accent-light":  "110, 231, 183",
    },
    ribbon: {
      primary:   "rgba(16, 185, 129, 0.40)",
      secondary: "rgba(52, 211, 153, 0.28)",
      glow:      "rgba(16, 185, 129, 0.16)",
    },
  },

  // ── 3. Ocean  ────────────────────────────────  deep teal, open sea
  {
    id: "ocean",
    name: "Ocean",
    swatch: "#06b6d4",
    vars: {
      "--tile-bg":       "6, 14, 22",
      "--tile-bg-hover": "8, 18, 28",
      "--accent":        "6, 182, 212",
      "--accent-light":  "103, 232, 249",
    },
    ribbon: {
      primary:   "rgba(6, 182, 212, 0.42)",
      secondary: "rgba(14, 165, 233, 0.28)",
      glow:      "rgba(6, 182, 212, 0.16)",
    },
  },

  // ── 4. Ember  ────────────────────────────────  volcanic warmth, magma glow
  {
    id: "ember",
    name: "Ember",
    swatch: "#ef4444",
    vars: {
      "--tile-bg":       "22, 10, 6",
      "--tile-bg-hover": "28, 14, 8",
      "--accent":        "239, 68, 68",
      "--accent-light":  "252, 165, 165",
    },
    ribbon: {
      primary:   "rgba(239, 68, 68, 0.40)",
      secondary: "rgba(245, 158, 11, 0.30)",
      glow:      "rgba(239, 68, 68, 0.18)",
    },
  },

  // ── 5. Dusk  ─────────────────────────────────  warm rose-purple sunset
  {
    id: "dusk",
    name: "Dusk",
    swatch: "#c084fc",
    vars: {
      "--tile-bg":       "18, 10, 24",
      "--tile-bg-hover": "24, 14, 30",
      "--accent":        "192, 132, 252",
      "--accent-light":  "216, 180, 254",
    },
    ribbon: {
      primary:   "rgba(192, 132, 252, 0.42)",
      secondary: "rgba(244, 114, 182, 0.30)",
      glow:      "rgba(192, 132, 252, 0.18)",
    },
  },

  // ── 6. Aurora  ───────────────────────────────  northern lights, electric green
  {
    id: "aurora",
    name: "Aurora",
    swatch: "#34d399",
    vars: {
      "--tile-bg":       "6, 16, 18",
      "--tile-bg-hover": "8, 22, 24",
      "--accent":        "52, 211, 153",
      "--accent-light":  "167, 243, 208",
    },
    ribbon: {
      primary:   "rgba(52, 211, 153, 0.42)",
      secondary: "rgba(45, 212, 191, 0.30)",
      glow:      "rgba(52, 211, 153, 0.16)",
    },
  },

  // ── 7. Sand  ─────────────────────────────────  warm desert, dune at golden hour
  {
    id: "sand",
    name: "Sand",
    swatch: "#d4a574",
    vars: {
      "--tile-bg":       "20, 16, 10",
      "--tile-bg-hover": "28, 22, 14",
      "--accent":        "212, 165, 116",
      "--accent-light":  "245, 222, 179",
    },
    ribbon: {
      primary:   "rgba(212, 165, 116, 0.40)",
      secondary: "rgba(251, 191, 36, 0.28)",
      glow:      "rgba(212, 165, 116, 0.15)",
    },
  },

  // ── 8. Storm  ────────────────────────────────  slate sky, electric lightning
  {
    id: "storm",
    name: "Storm",
    swatch: "#38bdf8",
    vars: {
      "--tile-bg":       "12, 14, 20",
      "--tile-bg-hover": "16, 20, 28",
      "--accent":        "56, 189, 248",
      "--accent-light":  "125, 211, 252",
    },
    ribbon: {
      primary:   "rgba(56, 189, 248, 0.42)",
      secondary: "rgba(96, 165, 250, 0.30)",
      glow:      "rgba(56, 189, 248, 0.18)",
    },
  },
];
