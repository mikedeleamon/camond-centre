import { memo, useMemo } from "react";

interface Props {
  color: string;
  count?: number;
}

function Particles({ color, count = 40 }: Props) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = 2 + Math.random() * 6;           // 2 – 8px
      const isGlowDot = size > 5.5;                 // top ~25% get a halo glow
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        // Scatter starting positions across the full height so particles
        // are visible immediately rather than all rising from the bottom
        bottom: `${Math.random() * 110}%`,
        size,
        isGlowDot,
        duration: 18 + Math.random() * 28,          // 18 – 46s
        delay: -(Math.random() * 46),               // negative delay = pre-running
        drift: (-40 + Math.random() * 80),          // –40px to +40px lateral drift
      };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            filter: p.isGlowDot
              ? `blur(0.5px) drop-shadow(0 0 ${Math.round(p.size * 2)}px ${color}) drop-shadow(0 0 ${Math.round(p.size * 4)}px ${color})`
              : "blur(0.3px)",
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default memo(Particles);
