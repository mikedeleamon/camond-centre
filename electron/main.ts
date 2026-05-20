import { app, BrowserWindow, ipcMain, screen, globalShortcut } from "electron";
import * as path from "path";
import { CalendarService } from "./services/calendar";
import { WeatherService } from "./services/weather";
import { StorageService } from "./services/storage";

let mainWindow: BrowserWindow | null = null;
let currentDisplayIndex = 0;

const isDev = !app.isPackaged;

function getDisplayBounds(display: Electron.Display) {
  // Use fullscreen bounds (not workArea) so the dock is hidden
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
    hasShadow: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
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
  // Cmd+Shift+F — toggle true fullscreen (hides dock/menubar)
  globalShortcut.register("CommandOrControl+Shift+F", () => {
    if (!mainWindow) return;
    const isFull = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFull);
  });

  // Cmd+Shift+D — cycle to next display
  globalShortcut.register("CommandOrControl+Shift+D", () => {
    if (!mainWindow) return;
    const displays = screen.getAllDisplays();
    if (displays.length < 2) return;

    currentDisplayIndex = (currentDisplayIndex + 1) % displays.length;
    const display = displays[currentDisplayIndex];
    const { x, y, width, height } = getDisplayBounds(display);

    mainWindow.setBounds({ x, y, width, height });
  });

  // Cmd+Shift+H — hide/show window
  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  // Cmd+Shift+Q — quit
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

  ipcMain.handle("calendar:getEvents", async () => {
    return calendar.getTodayEvents();
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
}
