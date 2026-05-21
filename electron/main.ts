import { app, BrowserWindow, ipcMain, screen, globalShortcut, shell } from "electron";
import * as https from "https";
import * as path from "path";
import { CalendarService } from "./services/calendar";
import { WeatherService } from "./services/weather";
import { StorageService } from "./services/storage";
import { MusicService } from "./services/music";

let mainWindow: BrowserWindow | null = null;
let currentDisplayIndex = 0;

const isDev = !app.isPackaged;

function getDisplayBounds(display: Electron.Display) {
  return display.bounds;
}

function createWindow() {
  const displays = screen.getAllDisplays();
  const display = displays[currentDisplayIndex] ?? screen.getPrimaryDisplay();
  const { x, y, width, height } = getDisplayBounds(display);

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    transparent: true,
    // Explicit transparent colour — required on some macOS/Electron versions so that
    // non-opaque pixels still receive mouse events (hover, scroll) rather than
    // falling through to the desktop.
    backgroundColor: "#00000000",
    hasShadow: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep rendering active even when the window is in the background so
      // animations and event handlers stay responsive.
      backgroundThrottling: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerGlobalShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+F", () => {
    if (!mainWindow) return;
    const isFull = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFull);
  });

  globalShortcut.register("CommandOrControl+Shift+D", () => {
    if (!mainWindow) return;
    const displays = screen.getAllDisplays();
    if (displays.length < 2) return;

    currentDisplayIndex = (currentDisplayIndex + 1) % displays.length;
    const display = displays[currentDisplayIndex];
    const { x, y, width, height } = getDisplayBounds(display);

    mainWindow.setBounds({ x, y, width, height });
  });

  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  globalShortcut.register("CommandOrControl+Shift+Q", () => {
    app.quit();
  });
}

app.on("ready", () => {
  createWindow();
  registerIpcHandlers();
  registerGlobalShortcuts();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function registerIpcHandlers() {
  const calendar = new CalendarService();
  const weather = new WeatherService();
  const storage = new StorageService();
  const music = new MusicService();

  ipcMain.handle("calendar:getEvents", async () => {
    return calendar.getTodayEvents();
  });

  ipcMain.handle("calendar:getKidEvents", async () => {
    return calendar.getKidEvents();
  });

  ipcMain.handle("weather:getCurrent", async () => {
    return weather.getCurrentWeather();
  });

  ipcMain.handle("storage:get", async (_event, key: string) => {
    return storage.get(key);
  });

  ipcMain.handle(
    "storage:set",
    async (_event, key: string, value: unknown) => {
      return storage.set(key, value);
    }
  );

  ipcMain.handle("app:toggleOverlay", async () => {
    if (mainWindow) {
      const isOnTop = mainWindow.isAlwaysOnTop();
      mainWindow.setAlwaysOnTop(!isOnTop);
      return !isOnTop;
    }
    return false;
  });

  ipcMain.handle("app:getDisplayCount", async () => {
    return screen.getAllDisplays().length;
  });

  ipcMain.handle("app:cycleDisplay", async () => {
    if (!mainWindow) return;
    const displays = screen.getAllDisplays();
    if (displays.length < 2) return;
    currentDisplayIndex = (currentDisplayIndex + 1) % displays.length;
    const display = displays[currentDisplayIndex];
    const { x, y, width, height } = getDisplayBounds(display);
    mainWindow.setBounds({ x, y, width, height });
    return currentDisplayIndex;
  });

  ipcMain.handle("app:toggleFullscreen", async () => {
    if (!mainWindow) return false;
    const isFull = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFull);
    return !isFull;
  });

  ipcMain.handle("shell:openExternal", async (_event, url: string) => {
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      await shell.openExternal(url);
    }
  });

  ipcMain.handle("music:getNowPlaying", async () => music.getNowPlaying());
  ipcMain.handle("music:togglePlay",    async () => music.togglePlay());
  ipcMain.handle("music:nextTrack",     async () => music.nextTrack());
  ipcMain.handle("music:previousTrack", async () => music.previousTrack());
  ipcMain.handle("music:skipForward",   async () => music.skipForward());
  ipcMain.handle("music:skipBackward",  async () => music.skipBackward());
  ipcMain.handle("music:playLofiPlaylist", async () => music.playLofiPlaylist());

  // Fetch RSS in the main process so Chromium CORS policy doesn't block it
  ipcMain.handle("news:getFeed", (_event, url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const safeUrl = url.startsWith("https://") ? url : "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";
      https.get(safeUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }).on("error", reject);
    });
  });
}
