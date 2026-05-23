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
  snack: MealPlan;
  dinner: MealPlan;
}

// ── Pantry / Kitchen types ──────────────────────────────────────────────────

export type PantryCategory = "proteins" | "grains" | "fruits" | "vegetables" | "drinks" | "snacks";
export type PantryPerson = "you" | "kid";

export const PANTRY_CATEGORIES: { id: PantryCategory; label: string; emoji: string }[] = [
  { id: "proteins",   label: "Proteins",   emoji: "🥩" },
  { id: "grains",     label: "Grains",     emoji: "🌾" },
  { id: "fruits",     label: "Fruits",     emoji: "🍎" },
  { id: "vegetables", label: "Vegetables", emoji: "🥦" },
  { id: "drinks",     label: "Drinks",     emoji: "🥤" },
  { id: "snacks",     label: "Snacks",     emoji: "🍪" },
];

export type CategoryItems = Record<PantryCategory, string[]>;
export type Pantry = Record<PantryPerson, CategoryItems>;

export const DEFAULT_PANTRY: Pantry = {
  you: {
    proteins:   ["Chicken", "Salmon", "Eggs", "Tofu", "Ground Beef", "Turkey", "Shrimp"],
    grains:     ["Rice", "Pasta", "Oatmeal", "Bread", "Quinoa", "Tortillas"],
    fruits:     ["Banana", "Berries", "Apple Slices", "Orange", "Grapes", "Mango"],
    vegetables: ["Broccoli", "Roasted Vegetables", "Salad", "Carrots", "Sweet Potato", "Corn"],
    drinks:     ["Coffee", "Orange Juice", "Sparkling Water", "Smoothie", "Tea"],
    snacks:     ["Yogurt", "Cheese", "Granola Bar", "Nuts", "Fruit Cup"],
  },
  kid: {
    proteins:   ["Chicken Nuggets", "Eggs", "Turkey", "Ground Beef"],
    grains:     ["Mac & Cheese", "Pasta", "Pancakes", "Bread"],
    fruits:     ["Banana", "Apple Slices", "Berries", "Orange", "Grapes"],
    vegetables: ["Broccoli", "Carrots", "Corn", "Peas"],
    drinks:     ["Milk", "Orange Juice", "Apple Juice", "Hot Chocolate"],
    snacks:     ["Cheese Sticks", "Crackers", "Yogurt", "Granola Bar", "Fruit Cup"],
  },
};

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
  /** Keep computer awake while app is open. */
  keepAwakeEnabled?: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  weatherLocation: "",
  kidCalendarName: "",
  idleTimeoutMinutes: 5,
  hiddenTiles: [],
  keepAwakeEnabled: true,
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
    setKeepAwake: (enabled: boolean) => Promise<boolean>;
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
