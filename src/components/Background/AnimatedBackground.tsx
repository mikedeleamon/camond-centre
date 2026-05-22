import { useMemo } from "react";
import { getThemeColors, getThemeForHour } from "../../lib/theme";
import { THEMES } from "../../themes";
import RibbonWaves from "./RibbonWaves";
import Particles from "./Particles";

interface Props {
  weatherCondition: string;
  currentHour: number;
  slowMode?: boolean;
  /** Active color theme id. When set to anything other than "midnight",
   *  the ribbon and glow colours come from the static theme palette instead
   *  of the time-of-day lerp. */
  colorTheme?: string;
}

export default function AnimatedBackground({
  weatherCondition,
  currentHour,
  slowMode = false,
  colorTheme,
}: Props) {
  const theme = useMemo(() => {
    const base = getThemeColors(weatherCondition);
    const hourOverrides = getThemeForHour(currentHour);
    const merged = { ...base, ...hourOverrides };

    // For every theme except "midnight" override the ribbon / glow colours with
    // the static palette so they don't shift throughout the day.
    const themeId = colorTheme ?? "midnight";
    if (themeId !== "midnight") {
      const colorThemeObj = THEMES.find((t) => t.id === themeId);
      if (colorThemeObj) {
        merged.ribbonPrimary   = colorThemeObj.ribbon.primary;
        merged.ribbonSecondary = colorThemeObj.ribbon.secondary;
        merged.accentGlow      = colorThemeObj.ribbon.glow;
      }
    }

    return merged;
  }, [weatherCondition, currentHour, colorTheme]);

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        // overflow:clip clips without creating a BFC or a scroll container.
        // overflow:hidden would absorb wheel events on macOS transparent windows.
        // The old "transition: filter 3s ease" is also removed — transitioning
        // filter primes the compositor for that property even when no filter is
        // applied, wasting GPU resources.
        overflow: "clip",
        pointerEvents: "none",
      }}
    >
      <div
        className="absolute inset-0 transition-[background] duration-[5000ms]"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 20% 50%, ${theme.accentGlow}, transparent 60%),
            radial-gradient(ellipse 100% 60% at 80% 30%, ${theme.accentGlow}, transparent 50%),
            linear-gradient(180deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 40%, ${theme.gradientEnd} 100%)
          `,
        }}
      />

      <RibbonWaves
        primaryColor={theme.ribbonPrimary}
        secondaryColor={theme.ribbonSecondary}
        slowMode={slowMode}
      />

      <Particles color={theme.particleColor} slowMode={slowMode} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, ${theme.gradientStart}cc 0%, transparent 15%, transparent 85%, ${theme.gradientStart}cc 100%),
            radial-gradient(ellipse at center, transparent 50%, ${theme.gradientStart}80 100%)
          `,
        }}
      />
    </div>
  );
}
