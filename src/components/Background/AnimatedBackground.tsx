import { useMemo } from "react";
import { getThemeColors, getThemeForHour } from "../../lib/theme";
import RibbonWaves from "./RibbonWaves";
import Particles from "./Particles";

interface Props {
  weatherCondition: string;
  currentHour: number;
}

export default function AnimatedBackground({
  weatherCondition,
  currentHour,
}: Props) {
  const theme = useMemo(() => {
    const base = getThemeColors(weatherCondition);
    const hourOverrides = getThemeForHour(currentHour);
    return { ...base, ...hourOverrides };
  }, [weatherCondition, currentHour]);

  return (
    <div className="fixed inset-0 -z-10" style={{ overflow: "hidden" }}>
      {/* Deep atmospheric gradient base */}
      <div
        className="absolute inset-0 transition-all duration-[5000ms]"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 20% 50%, ${theme.accentGlow}, transparent 60%),
            radial-gradient(ellipse 100% 60% at 80% 30%, ${theme.accentGlow}, transparent 50%),
            linear-gradient(180deg, ${theme.gradientStart} 0%, ${theme.gradientMid} 40%, ${theme.gradientEnd} 100%)
          `,
        }}
      />

      {/* Ambient glow orbs — slow breathe, GPU-composited */}
      <div
        className="absolute rounded-full breathe"
        style={{
          width: "1000px",
          height: "1000px",
          top: "-10%",
          left: "-8%",
          background: `radial-gradient(circle, ${theme.accentGlow}, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute rounded-full breathe"
        style={{
          width: "800px",
          height: "800px",
          bottom: "-12%",
          right: "-6%",
          background: `radial-gradient(circle, ${theme.ribbonSecondary}, transparent 60%)`,
          filter: "blur(35px)",
          animationDelay: "-3s",
        }}
      />
      <div
        className="absolute rounded-full breathe"
        style={{
          width: "600px",
          height: "600px",
          top: "25%",
          right: "18%",
          background: `radial-gradient(circle, ${theme.ribbonPrimary}, transparent 60%)`,
          filter: "blur(45px)",
          animationDelay: "-7s",
        }}
      />

      {/* Ribbon waves */}
      <RibbonWaves
        primaryColor={theme.ribbonPrimary}
        secondaryColor={theme.ribbonSecondary}
      />

      {/* Floating particles */}
      <Particles color={theme.particleColor} />

      {/* Top and bottom fade vignette */}
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
