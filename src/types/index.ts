export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  location: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface MealPlan {
  you: string[];
  kid: string[];
}

export interface MealPlans {
  breakfast: MealPlan;
  lunch: MealPlan;
  dinner: MealPlan;
}

export interface ElectronAPI {
  calendar: {
    getEvents: () => Promise<CalendarEvent[]>;
  };
  weather: {
    getCurrent: () => Promise<WeatherData>;
  };
  storage: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
  };
  app: {
    toggleOverlay: () => Promise<boolean>;
    toggleFullscreen: () => Promise<boolean>;
    cycleDisplay: () => Promise<number>;
    getDisplayCount: () => Promise<number>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
