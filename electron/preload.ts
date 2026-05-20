import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  calendar: {
    getEvents: () => ipcRenderer.invoke("calendar:getEvents"),
    getKidEvents: () => ipcRenderer.invoke("calendar:getKidEvents"),
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
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
  },
  news: {
    getFeed: (url?: string) => ipcRenderer.invoke("news:getFeed", url),
  },
  music: {
    getNowPlaying: () => ipcRenderer.invoke("music:getNowPlaying"),
    togglePlay: () => ipcRenderer.invoke("music:togglePlay"),
    nextTrack: () => ipcRenderer.invoke("music:nextTrack"),
    previousTrack: () => ipcRenderer.invoke("music:previousTrack"),
    skipForward: () => ipcRenderer.invoke("music:skipForward"),
    skipBackward: () => ipcRenderer.invoke("music:skipBackward"),
    playLofiPlaylist: () => ipcRenderer.invoke("music:playLofiPlaylist"),
  },
});
