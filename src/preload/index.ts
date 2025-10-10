import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveCaptions: (updates: { captionPath: string; caption: string }[]) =>
    ipcRenderer.invoke('captions:save', updates),
  getImageFileUrl: (imagePath: string) => ipcRenderer.invoke('image:getFileUrl', imagePath)
}

// Expose electron with ipcRenderer for menu events
const electron = {
  ...electronAPI,
  ipcRenderer: {
    on: (channel: string, func: (...args: any[]) => void) => {
      // Whitelist of allowed channels
      const validChannels = [
        'menu:open-folder',
        'menu:save-captions',
        'menu:close-folder',
        'menu:previous-image',
        'menu:next-image',
        'menu:first-image',
        'menu:last-image',
        'menu:focus-editor',
        'menu:show-shortcuts'
      ]
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args))
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
