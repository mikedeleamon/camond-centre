import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  location: string;
}

type WeatherCondition = "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm" | "partly-cloudy";

const CONDITION_ICONS: Record<WeatherCondition, string> = {
  clear: "sun",
  "partly-cloudy": "cloud-sun",
  cloudy: "cloud",
  rain: "cloud-rain",
  snow: "snowflake",
  fog: "cloud-fog",
  storm: "cloud-lightning",
};

export class WeatherService {
  async getCurrentWeather(): Promise<WeatherData> {
    try {
      const script = `
        tell application "Weather"
          set currentTemp to temperature of current conditions of front window
          set currentCond to condition of current conditions of front window
          set currentLoc to name of front window
          return (currentTemp as text) & "|||" & currentCond & "|||" & currentLoc
        end tell
      `;

      try {
        const { stdout } = await execAsync(
          `osascript -e '${script.replace(/'/g, "'\\''")}'`
        );
        const parts = stdout.trim().split("|||");
        if (parts.length >= 3) {
          const condition = this.mapCondition(parts[1].trim());
          return {
            temperature: parseInt(parts[0], 10),
            condition: parts[1].trim(),
            icon: CONDITION_ICONS[condition] || "sun",
            humidity: 55,
            windSpeed: 8,
            feelsLike: parseInt(parts[0], 10) - 2,
            location: parts[2].trim(),
          };
        }
      } catch {
        // Weather app not available, try CoreLocation-based approach
      }

      return this.getWeatherFromCurl();
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      return this.getFallbackWeather();
    }
  }

  private async getWeatherFromCurl(): Promise<WeatherData> {
    try {
      const { stdout } = await execAsync("curl -s 'wttr.in/?format=%t|||%C|||%h|||%w|||%l' --max-time 5");
      const parts = stdout.trim().split("|||");
      if (parts.length >= 4) {
        const temp = parseInt(parts[0].replace(/[^-\d]/g, ""), 10);
        const condText = parts[1].trim();
        const condition = this.mapCondition(condText);
        return {
          temperature: temp,
          condition: condText,
          icon: CONDITION_ICONS[condition] || "sun",
          humidity: parseInt(parts[2].replace(/\D/g, ""), 10) || 50,
          windSpeed: parseInt(parts[3].replace(/[^-\d]/g, ""), 10) || 5,
          feelsLike: temp - 2,
          location: parts[4]?.trim() || "Local",
        };
      }
    } catch {
      // curl failed
    }
    return this.getFallbackWeather();
  }

  private mapCondition(text: string): WeatherCondition {
    const lower = text.toLowerCase();
    if (lower.includes("thunder") || lower.includes("storm")) return "storm";
    if (lower.includes("snow") || lower.includes("sleet")) return "snow";
    if (lower.includes("rain") || lower.includes("drizzle") || lower.includes("shower")) return "rain";
    if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return "fog";
    if (lower.includes("partly") || lower.includes("partial")) return "partly-cloudy";
    if (lower.includes("cloud") || lower.includes("overcast")) return "cloudy";
    return "clear";
  }

  private getFallbackWeather(): WeatherData {
    return {
      temperature: 72,
      condition: "Partly Cloudy",
      icon: "cloud-sun",
      humidity: 55,
      windSpeed: 8,
      feelsLike: 70,
      location: "Local",
    };
  }
}
