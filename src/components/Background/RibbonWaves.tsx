import { memo, useRef, useEffect, useCallback } from "react";

interface Props {
  primaryColor: string;
  secondaryColor: string;
  slowMode?: boolean;
}

interface RibbonConfig {
  baseY: number;
  amplitude: number;
  thickness: number;
  frequency: number;
  speed: number;
  phase: number;
  // secondary sine for organic feel
  freq2: number;
  amp2: number;
  speed2: number;
  opacity: number;
  colorIndex: 0 | 1;
  blur: number;
}

const RIBBONS: RibbonConfig[] = [
  // Dominant flowing wave — large, bright, center-screen
  {
    baseY: 0.50,
    amplitude: 0.16,
    thickness: 0.13,
    frequency: 0.7,
    speed: 0.12,
    phase: 0,
    freq2: 1.4,
    amp2: 0.05,
    speed2: 0.18,
    opacity: 0.85,
    colorIndex: 0,
    blur: 6,
  },
  // Second wave — slightly lower, opposite phase
  {
    baseY: 0.58,
    amplitude: 0.13,
    thickness: 0.11,
    frequency: 1.0,
    speed: 0.10,
    phase: 2.4,
    freq2: 2.0,
    amp2: 0.04,
    speed2: 0.15,
    opacity: 0.7,
    colorIndex: 1,
    blur: 8,
  },
  // Upper accent wave — thinner, lighter
  {
    baseY: 0.36,
    amplitude: 0.14,
    thickness: 0.07,
    frequency: 0.55,
    speed: 0.08,
    phase: 1.2,
    freq2: 1.2,
    amp2: 0.06,
    speed2: 0.12,
    opacity: 0.5,
    colorIndex: 1,
    blur: 10,
  },
  // Lower shelf wave — wide and slow
  {
    baseY: 0.70,
    amplitude: 0.08,
    thickness: 0.10,
    frequency: 1.3,
    speed: 0.09,
    phase: 4.5,
    freq2: 2.6,
    amp2: 0.03,
    speed2: 0.20,
    opacity: 0.55,
    colorIndex: 0,
    blur: 5,
  },
  // Deep background swell — very wide, slow, fills middle (soft glow)
  {
    baseY: 0.46,
    amplitude: 0.20,
    thickness: 0.18,
    frequency: 0.4,
    speed: 0.05,
    phase: 3.0,
    freq2: 0.8,
    amp2: 0.07,
    speed2: 0.08,
    opacity: 0.3,
    colorIndex: 0,
    blur: 24,
  },
  // Bright highlight ribbon — thin, fast, catches the eye
  {
    baseY: 0.53,
    amplitude: 0.11,
    thickness: 0.04,
    frequency: 0.9,
    speed: 0.16,
    phase: 0.8,
    freq2: 1.8,
    amp2: 0.03,
    speed2: 0.24,
    opacity: 0.75,
    colorIndex: 1,
    blur: 3,
  },
];

function parseRGBA(rgba: string): [number, number, number, number] {
  const m = rgba.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return [150, 170, 255, 0.3];
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4] ?? "1")];
}

function RibbonWaves({ primaryColor, secondaryColor, slowMode = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const colorsRef = useRef({ primary: primaryColor, secondary: secondaryColor });
  const slowRef = useRef(slowMode);

  colorsRef.current = { primary: primaryColor, secondary: secondaryColor };
  slowRef.current = slowMode;

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = lastFrameRef.current ? (timestamp - lastFrameRef.current) / 1000 : 0.016;
    lastFrameRef.current = timestamp;

    const speedMult = slowRef.current ? 0.4 : 1.0;
    timeRef.current += dt * speedMult;
    const t = timeRef.current;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    // Extract RGB only — we control alpha ourselves for bold ribbons
    const rawColors = [
      parseRGBA(colorsRef.current.primary),
      parseRGBA(colorsRef.current.secondary),
    ];
    const colors: [number, number, number, number][] = rawColors.map(
      ([r, g, b]) => [r, g, b, 1] as [number, number, number, number]
    );

    const step = 3;

    for (const ribbon of RIBBONS) {
      const [r, g, b, baseA] = colors[ribbon.colorIndex];
      const alpha = baseA * ribbon.opacity;

      ctx.save();
      ctx.filter = `blur(${ribbon.blur}px)`;

      // Build the top edge of the ribbon
      ctx.beginPath();

      const yValues: number[] = [];
      for (let x = -step; x <= w + step; x += step) {
        const nx = x / w;
        const wave1 = Math.sin(nx * Math.PI * 2 * ribbon.frequency + t * ribbon.speed * Math.PI * 2 + ribbon.phase);
        const wave2 = Math.sin(nx * Math.PI * 2 * ribbon.freq2 + t * ribbon.speed2 * Math.PI * 2 + ribbon.phase * 1.7);
        const y = (ribbon.baseY + wave1 * ribbon.amplitude + wave2 * ribbon.amp2) * h;
        yValues.push(y);
      }

      // Top edge
      const firstY = yValues[0];
      ctx.moveTo(-step, firstY);
      for (let i = 1; i < yValues.length; i++) {
        const x = -step + i * step;
        ctx.lineTo(x, yValues[i]);
      }

      // Bottom edge (offset by thickness), drawn right-to-left
      for (let i = yValues.length - 1; i >= 0; i--) {
        const x = -step + i * step;
        const thicknessVar = ribbon.thickness * h * (0.85 + 0.15 * Math.sin(x / w * Math.PI * 3 + t * 0.3));
        ctx.lineTo(x, yValues[i] + thicknessVar);
      }

      ctx.closePath();

      // Animated gradient — the bright spot drifts along the ribbon
      const shimmer = (Math.sin(t * 0.3 + ribbon.phase) * 0.5 + 0.5);
      const peakPos = 0.25 + shimmer * 0.5;

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0,                             `rgba(${r},${g},${b},${alpha * 0.3})`);
      grad.addColorStop(Math.max(0, peakPos - 0.2),    `rgba(${r},${g},${b},${alpha * 0.8})`);
      grad.addColorStop(peakPos,                        `rgba(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 30)},${alpha * 1.6})`);
      grad.addColorStop(Math.min(1, peakPos + 0.2),    `rgba(${r},${g},${b},${alpha * 0.8})`);
      grad.addColorStop(1,                             `rgba(${r},${g},${b},${alpha * 0.3})`);

      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export default memo(RibbonWaves);
