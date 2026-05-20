import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  calendar: {
    getEvents: () => ipcRenderer.invoke("calendar:getEvents"),
  },
  weather: {
    getCurrent: () => ipcRenderer.invoke("weather:getCurrent"),
  },
  storage: {
    get: (key: string) => ipcRenderer.invoke("storage:get", key),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke("storage:set", key, value),
  },
  app: {
    toggleOverlay: () => ipcRenderer.invoke("app:toggleOverlay"),
    toggleFullscreen: () => ipcRenderer.invoke("app:toggleFullscreen"),
    cycleDisplay: () => ipcRenderer.invoke("app:cycleDisplay"),
    getDisplayCount: () => ipcRenderer.invoke("app:getDisplayCount"),
  },
});
