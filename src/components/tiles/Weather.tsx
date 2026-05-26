import { useMemo } from "react";
import GlassTile from "../GlassTile";
import WeatherIcon from "./WeatherIcon";
import type { WeatherData } from "../../types";
import type { TileId } from "../../hooks/useGridLayout";

interface HourForecast {
  hour: string;
  temp: number;
  precip: number;
}

interface Props {
  weather: WeatherData;
  tileId?: TileId;
  onTileResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  gridStyle?: React.CSSProperties;
  idleOpacity?: number;
}

function generateForecast(currentTemp: number): HourForecast[] {
  const now = new Date();
  const forecasts: HourForecast[] = [];
  for (let i = 0; i < 6; i++) {
    const h = new Date(now.getTime() + i * 3600000);
    const hourStr = h.getHours().toString().padStart(2, "0") + ":00";
    const variation = Math.sin((h.getHours() / 24) * Math.PI * 2) * 5;
    forecasts.push({
      hour: hourStr,
      temp: Math.round(currentTemp + variation + (Math.random() - 0.5) * 3),
      precip: Math.max(0, Math.round(Math.random() * 40)),
    });
  }
  return forecasts;
}

function Sparkline({ data, maxVal, color, height }: { data: number[]; maxVal: number; color: string; height: number }) {
  if (data.length < 2) return null;
  const w = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - (v / (maxVal || 1)) * (height - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = height - (v / (maxVal || 1)) * (height - 4) - 2;
        return <circle key={i} cx={x} cy={y} r="2" fill={color} />;
      })}
    </svg>
  );
}

export default function Weather({ weather, tileId, onTileResize, gridStyle, idleOpacity }: Props) {
  const forecast = useMemo(() => generateForecast(weather.temperature), [weather.temperature]);
  const temps = forecast.map((f) => f.temp);
  const maxTemp = Math.max(...temps);
  const precips = forecast.map((f) => f.precip);
  const maxPrecip = Math.max(...precips, 10);

  return (
    <GlassTile
      delay={1}
      className="flex flex-col px-5 py-4"
      tileId={tileId}
      onResize={onTileResize}
      style={gridStyle}
      idleOpacity={idleOpacity}
    >
      {/* group enables CSS :hover — works in macOS transparent Electron windows
          unlike JS mouseenter/mouseleave which don't fire through the compositor */}
      <div className="flex-1 flex flex-col group">
        <div className="flex items-end gap-3">
          <span className="text-5xl font-thin text-white/90 leading-none tabular-nums">
            {weather.temperature}°
          </span>
          <div className="flex flex-col items-start pb-0.5 gap-0.5">
            <div style={{ color: "rgba(var(--accent-light), 0.60)" }}>
              <WeatherIcon icon={weather.icon} size={22} />
            </div>
            <span className="text-[10px] font-light text-white/35 whitespace-nowrap">
              {weather.condition}
            </span>
          </div>
        </div>

        <div className="overflow-clip transition-all duration-300 ease-out max-h-0 opacity-0 mt-0 group-hover:max-h-48 group-hover:opacity-100 group-hover:mt-2">
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Temperature</span>
                <span className="text-[10px] text-white/20">{temps[0]}° – {Math.max(...temps)}°</span>
              </div>
              <Sparkline data={temps} maxVal={maxTemp + 5} color="rgba(var(--accent-light), 0.6)" height={28} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Precipitation %</span>
              </div>
              <Sparkline data={precips} maxVal={maxPrecip + 10} color="rgba(var(--accent), 0.5)" height={20} />
            </div>
            <div className="flex justify-between">
              {forecast.map((f, i) => (
                <span key={i} className="text-[9px] text-white/20 tabular-nums">{f.hour}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GlassTile>
  );
}
