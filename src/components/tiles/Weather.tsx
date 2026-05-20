import GlassTile from "../GlassTile";
import WeatherIcon from "./WeatherIcon";
import type { WeatherData } from "../../types";

interface Props {
  weather: WeatherData;
}

export default function Weather({ weather }: Props) {
  return (
    <GlassTile gridArea="wthr" delay={1} className="flex items-center gap-4 px-5 py-4">
      <div className="text-indigo-300/70">
        <WeatherIcon icon={weather.icon} size={32} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-2xl font-light text-white/85 leading-none">
          {weather.temperature}°
        </span>
        <span className="text-xs font-light text-white/35 truncate mt-0.5">
          {weather.condition}
        </span>
      </div>
    </GlassTile>
  );
}
