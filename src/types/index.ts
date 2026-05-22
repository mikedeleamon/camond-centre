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

export type RepeatOption = "none" | "daily" | "weekly" | "monthly";
export type TaskPriority = "none" | "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  notes?: string;
  dueDate?: string;    // "YYYY-MM-DD"
  dueTime?: string;    // "HH:MM"
  duration?: number;   // minutes
  repeat?: RepeatOption;
  priority?: TaskPriority;
  isKid?: boolean;     // routes to the kid swimlane on the timeline
  subtasks?: Subtask[];
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

export interface AppSettings {
  /** City name shown to WeatherService. "" = auto-detect via IP. */
  weatherLocation: string;
  /** Calendar.app calendar name for kid events. "" = use service default. */
  kidCalendarName: string;
  /** Minutes before dashboard dims. */
  idleTimeoutMinutes: number;
  /** Tile IDs whose grid cells are hidden (ghost placeholder is kept). */
  hiddenTiles: string[];
  /** Active color theme id. Defaults to "midnight" if unset. */
  colorTheme?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  weatherLocation: "",
  kidCalendarName: "",
  idleTimeoutMinutes: 5,
  hiddenTiles: [],
};

export interface NowPlayingData {
  trackName: string;
  artist: string;
  album: string;
  duration: number;
  position: number;
  isPlaying: boolean;
  playlistName?: string;
}

export interface ElectronAPI {
  calendar: {
    getEvents: () => Promise<CalendarEvent[]>;
    getKidEvents: () => Promise<CalendarEvent[]>;
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
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  news: {
    getFeed: (url?: string) => Promise<string>;
  };
  music: {
    getNowPlaying: () => Promise<NowPlayingData | null>;
    togglePlay: () => Promise<void>;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
    skipForward: () => Promise<void>;
    skipBackward: () => Promise<void>;
    playLofiPlaylist: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
