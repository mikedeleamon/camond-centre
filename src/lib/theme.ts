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

// PSP XMB aesthetic: ribbons are LIGHTER than the background —
// translucent surfaces that catch light, not contrasting accent colours.
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

export function getThemeForHour(hour: number): Partial<ThemeColors> {
  if (hour >= 5 && hour < 7) {
    return {
      gradientEnd: "#1a1530",
      ribbonPrimary: "rgba(160, 100, 180, 0.12)",
    };
  }
  if (hour >= 17 && hour < 20) {
    return {
      gradientEnd: "#201520",
      ribbonPrimary: "rgba(180, 100, 120, 0.12)",
    };
  }
  return {};
}
