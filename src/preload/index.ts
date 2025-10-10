import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openFolder: (directPath?: string) => ipcRenderer.invoke('dialog:openFolder', directPath),
  saveCaptions: (updates: { captionPath: string; caption: string }[]) =>
    ipcRenderer.invoke('captions:save', updates),
  getImageFileUrl: (imagePath: string) => ipcRenderer.invoke('image:getFileUrl', imagePath),
  getImageFileStats: (imagePath: string) => ipcRenderer.invoke('image:getFileStats', imagePath),
  veil: () => ipcRenderer.invoke('window:veil'),
  // Config APIs
  config: {
    getAll: () => ipcRenderer.invoke('config:get-all'),
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    reset: () => ipcRenderer.invoke('config:reset'),
    addRecentFolder: (folderPath: string) =>
      ipcRenderer.invoke('config:add-recent-folder', folderPath),
    getRecentFolders: () => ipcRenderer.invoke('config:get-recent-folders')
  },
  autoCaptioner: {
    generate: (imagePath: string) => ipcRenderer.invoke('auto-caption:generate', imagePath)
  }
}

// Expose electron with ipcRenderer for menu events
const electron = {
  ...electronAPI,
  ipcRenderer: {
    on: (channel: string, func: (...args: unknown[]) => void) => {
      // Whitelist of allowed channels
      const validChannels = [
        'menu:open-folder',
        'menu:open-recent-folder',
        'menu:save-captions',
        'menu:reset-changes',
        'menu:close-folder',
        'menu:previous-image',
        'menu:next-image',
        'menu:first-image',
        'menu:last-image',
        'menu:focus-editor',
        'menu:show-shortcuts',
        'menu:show-preferences'
      ]
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (_event, ...args) => func(...args))
      }
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electron)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electron
  // @ts-ignore (define in dts)
  window.api = api
}
