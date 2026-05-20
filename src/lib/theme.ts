export type WeatherTheme = "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm" | "partly-cloudy";

interface ThemeColors {
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  ribbonPrimary: string;
  ribbonSecondary: string;
  particleColor: string;
  accentGlow: string;
}

const themes: Record<WeatherTheme, ThemeColors> = {
  clear: {
    gradientStart: "#050514",
    gradientMid:   "#080d28",
    gradientEnd:   "#0c1340",
    ribbonPrimary:   "rgba(185, 200, 255, 0.42)",
    ribbonSecondary: "rgba(165, 185, 255, 0.30)",
    particleColor:   "rgba(210, 220, 255, 0.92)",
    accentGlow:      "rgba(100, 115, 240, 0.18)",
  },
  "partly-cloudy": {
    gradientStart: "#060814",
    gradientMid:   "#0a1025",
    gradientEnd:   "#10193a",
    ribbonPrimary:   "rgba(175, 195, 255, 0.40)",
    ribbonSecondary: "rgba(155, 178, 252, 0.28)",
    particleColor:   "rgba(200, 215, 255, 0.92)",
    accentGlow:      "rgba(95,  118, 230, 0.16)",
  },
  cloudy: {
    gradientStart: "#080a14",
    gradientMid:   "#0d1222",
    gradientEnd:   "#141a32",
    ribbonPrimary:   "rgba(165, 178, 220, 0.38)",
    ribbonSecondary: "rgba(148, 162, 208, 0.26)",
    particleColor:   "rgba(188, 200, 230, 0.92)",
    accentGlow:      "rgba(110, 125, 195, 0.15)",
  },
  rain: {
    gradientStart: "#04060e",
    gradientMid:   "#070c1c",
    gradientEnd:   "#0c152c",
    ribbonPrimary:   "rgba(150, 185, 255, 0.40)",
    ribbonSecondary: "rgba(130, 168, 248, 0.28)",
    particleColor:   "rgba(170, 200, 255, 0.92)",
    accentGlow:      "rgba(80,  110, 215, 0.16)",
  },
  snow: {
    gradientStart: "#09101e",
    gradientMid:   "#10182c",
    gradientEnd:   "#18223e",
    ribbonPrimary:   "rgba(210, 220, 255, 0.40)",
    ribbonSecondary: "rgba(195, 208, 250, 0.28)",
    particleColor:   "rgba(228, 236, 255, 0.95)",
    accentGlow:      "rgba(160, 178, 240, 0.15)",
  },
  fog: {
    gradientStart: "#070810",
    gradientMid:   "#0e101c",
    gradientEnd:   "#151828",
    ribbonPrimary:   "rgba(170, 178, 210, 0.36)",
    ribbonSecondary: "rgba(155, 165, 198, 0.24)",
    particleColor:   "rgba(182, 192, 220, 0.92)",
    accentGlow:      "rgba(128, 138, 188, 0.14)",
  },
  storm: {
    gradientStart: "#03040e",
    gradientMid:   "#06081a",
    gradientEnd:   "#0a0f28",
    ribbonPrimary:   "rgba(175, 155, 255, 0.42)",
    ribbonSecondary: "rgba(155, 135, 245, 0.30)",
    particleColor:   "rgba(195, 180, 255, 0.92)",
    accentGlow:      "rgba(110,  85, 230, 0.20)",
  },
};

export function getThemeColors(condition: string): ThemeColors {
  const lower = condition.toLowerCase();
  if (lower.includes("thunder") || lower.includes("storm")) return themes.storm;
  if (lower.includes("snow") || lower.includes("sleet")) return themes.snow;
  if (lower.includes("rain") || lower.includes("drizzle")) return themes.rain;
  if (lower.includes("fog") || lower.includes("mist")) return themes.fog;
  if (lower.includes("partly")) return themes["partly-cloudy"];
  if (lower.includes("cloud") || lower.includes("overcast")) return themes.cloudy;
  return themes.clear;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lerpRgba(rgba1: string, rgba2: string, t: number): string {
  const parse = (s: string) => {
    const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
    if (!m) return [0, 0, 0, 1];
    return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4] ?? "1")];
  };
  const [r1, g1, b1, a1] = parse(rgba1);
  const [r2, g2, b2, a2] = parse(rgba2);
  return `rgba(${Math.round(lerp(r1, r2, t))}, ${Math.round(lerp(g1, g2, t))}, ${Math.round(lerp(b1, b2, t))}, ${lerp(a1, a2, t).toFixed(2)})`;
}

interface TimePhase {
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  ribbonPrimary: string;
  ribbonSecondary: string;
  accentGlow: string;
}

const TIME_PHASES: { hour: number; colors: TimePhase }[] = [
  { // Night (0-5)
    hour: 0,
    colors: {
      gradientStart: "#020210",
      gradientMid: "#050818",
      gradientEnd: "#080c22",
      ribbonPrimary: "rgba(120, 130, 200, 0.30)",
      ribbonSecondary: "rgba(100, 110, 180, 0.20)",
      accentGlow: "rgba(60, 70, 160, 0.12)",
    },
  },
  { // Dawn (5-7): amber → indigo transition
    hour: 5,
    colors: {
      gradientStart: "#0a0612",
      gradientMid: "#1a0f20",
      gradientEnd: "#2a1828",
      ribbonPrimary: "rgba(210, 150, 120, 0.35)",
      ribbonSecondary: "rgba(180, 120, 160, 0.28)",
      accentGlow: "rgba(200, 130, 100, 0.18)",
    },
  },
  { // Sunrise (7-9): warm amber settling
    hour: 7,
    colors: {
      gradientStart: "#08060e",
      gradientMid: "#140e1c",
      gradientEnd: "#1e1630",
      ribbonPrimary: "rgba(220, 170, 140, 0.38)",
      ribbonSecondary: "rgba(190, 140, 180, 0.28)",
      accentGlow: "rgba(180, 120, 100, 0.15)",
    },
  },
  { // Morning (9-12): transitioning to cool blue
    hour: 9,
    colors: {
      gradientStart: "#050510",
      gradientMid: "#0a0d22",
      gradientEnd: "#0e1538",
      ribbonPrimary: "rgba(180, 195, 255, 0.40)",
      ribbonSecondary: "rgba(160, 178, 248, 0.28)",
      accentGlow: "rgba(95, 115, 230, 0.16)",
    },
  },
  { // Midday (12-15): cool blue peak
    hour: 12,
    colors: {
      gradientStart: "#050514",
      gradientMid: "#080d28",
      gradientEnd: "#0c1340",
      ribbonPrimary: "rgba(170, 200, 255, 0.42)",
      ribbonSecondary: "rgba(150, 185, 255, 0.30)",
      accentGlow: "rgba(90, 115, 240, 0.18)",
    },
  },
  { // Afternoon (15-17): beginning warm shift
    hour: 15,
    colors: {
      gradientStart: "#060510",
      gradientMid: "#0c0a20",
      gradientEnd: "#141035",
      ribbonPrimary: "rgba(185, 170, 250, 0.40)",
      ribbonSecondary: "rgba(165, 150, 240, 0.28)",
      accentGlow: "rgba(120, 100, 220, 0.16)",
    },
  },
  { // Golden hour (17-19): warm violet
    hour: 17,
    colors: {
      gradientStart: "#080510",
      gradientMid: "#160c1e",
      gradientEnd: "#221430",
      ribbonPrimary: "rgba(200, 140, 200, 0.40)",
      ribbonSecondary: "rgba(180, 120, 190, 0.30)",
      accentGlow: "rgba(160, 100, 180, 0.18)",
    },
  },
  { // Dusk (19-21): deepening violet → navy
    hour: 19,
    colors: {
      gradientStart: "#060412",
      gradientMid: "#0e081c",
      gradientEnd: "#160e2a",
      ribbonPrimary: "rgba(160, 130, 220, 0.36)",
      ribbonSecondary: "rgba(140, 110, 200, 0.26)",
      accentGlow: "rgba(120, 80, 200, 0.16)",
    },
  },
  { // Night (21-24): deep navy
    hour: 21,
    colors: {
      gradientStart: "#020210",
      gradientMid: "#050818",
      gradientEnd: "#080c22",
      ribbonPrimary: "rgba(120, 130, 200, 0.30)",
      ribbonSecondary: "rgba(100, 110, 180, 0.20)",
      accentGlow: "rgba(60, 70, 160, 0.12)",
    },
  },
];

export function getThemeForHour(hour: number): Partial<ThemeColors> {
  let prev = TIME_PHASES[TIME_PHASES.length - 1];
  let next = TIME_PHASES[0];

  for (let i = 0; i < TIME_PHASES.length; i++) {
    if (hour >= TIME_PHASES[i].hour) {
      prev = TIME_PHASES[i];
      next = TIME_PHASES[(i + 1) % TIME_PHASES.length] ?? TIME_PHASES[0];
    }
  }

  const range = next.hour > prev.hour ? next.hour - prev.hour : (24 - prev.hour + next.hour);
  const elapsed = hour >= prev.hour ? hour - prev.hour : (24 - prev.hour + hour);
  const t = range > 0 ? elapsed / range : 0;

  return {
    gradientStart: lerpColor(prev.colors.gradientStart, next.colors.gradientStart, t),
    gradientMid: lerpColor(prev.colors.gradientMid, next.colors.gradientMid, t),
    gradientEnd: lerpColor(prev.colors.gradientEnd, next.colors.gradientEnd, t),
    ribbonPrimary: lerpRgba(prev.colors.ribbonPrimary, next.colors.ribbonPrimary, t),
    ribbonSecondary: lerpRgba(prev.colors.ribbonSecondary, next.colors.ribbonSecondary, t),
    accentGlow: lerpRgba(prev.colors.accentGlow, next.colors.accentGlow, t),
  };
}
