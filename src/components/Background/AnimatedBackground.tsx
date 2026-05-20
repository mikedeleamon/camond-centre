import { useMemo } from "react";
import { getThemeColors, getThemeForHour } from "../../lib/theme";
import RibbonWaves from "./RibbonWaves";
import Particles from "./Particles";

interface Props {
  weatherCondition: string;
  currentHour: number;
  slowMode?: boolean;
}

export default function AnimatedBackground({
  weatherCondition,
  currentHour,
  slowMode = false,
}: Props) {
  const theme = useMemo(() => {
    const base = getThemeColors(weatherCondition);
    const hourOverrides = getThemeForHour(currentHour);
    return { ...base, ...hourOverrides };
  }, [weatherCondition, currentHour]);

  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        overflow: "hidden",
        transition: "filter 3s ease",
      }}
    >
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

      <div
        className="absolute rounded-full breathe"
        style={{
          width: "1000px",
          height: "1000px",
          top: "-10%",
          left: "-8%",
          background: `radial-gradient(circle, ${theme.accentGlow}, transparent 60%)`,
          filter: "blur(40px)",
          animationDuration: slowMode ? "16s" : "8s",
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
          animationDuration: slowMode ? "16s" : "8s",
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
          animationDuration: slowMode ? "16s" : "8s",
        }}
      />

      <div style={{
        transition: "opacity 3s ease",
        opacity: slowMode ? 0.7 : 1,
      }}>
        <RibbonWaves
          primaryColor={theme.ribbonPrimary}
          secondaryColor={theme.ribbonSecondary}
          slowMode={slowMode}
        />
      </div>

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
