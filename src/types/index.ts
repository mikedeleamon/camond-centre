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

export interface Reminder {
  name: string;
  completed: boolean;
}

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
  reminders: {
    getAll: () => Promise<Reminder[]>;
    add: (title: string) => Promise<boolean>;
    complete: (name: string) => Promise<boolean>;
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
