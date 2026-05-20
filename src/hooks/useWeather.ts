import { useState, useEffect, useCallback } from "react";
import type { WeatherData } from "../types";

const FALLBACK_WEATHER: WeatherData = {
  temperature: 72,
  condition: "Partly Cloudy",
  icon: "cloud-sun",
  humidity: 55,
  windSpeed: 8,
  feelsLike: 70,
  location: "Local",
};

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData>(FALLBACK_WEATHER);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const data = await window.electronAPI.weather.getCurrent();
        setWeather(data);
      }
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, loading, refresh: fetchWeather };
}
