/**
 * Type definitions for window API and Electron IPC
 * Provides type safety for renderer process APIs
 */

import { ImageItem } from '../stores/captionStore'

// IPC Renderer types
export interface IpcRenderer {
  on: (channel: string, func: (...args: unknown[]) => void) => void
  removeAllListeners: (channel: string) => void
}

// API exposed by preload script
export interface ElectronAPI {
  ipcRenderer: IpcRenderer
  // Add other electron APIs as needed
}

// Config API
export interface ConfigAPI {
  getAll: () => Promise<unknown>
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<boolean>
  reset: () => Promise<unknown>
  addRecentFolder: (folderPath: string) => Promise<string[]>
  getRecentFolders: () => Promise<string[]>
}

// Main API
export interface MainAPI {
  openFolder: (directPath?: string) => Promise<{
    folderPath: string
    images: ImageItem[]
  } | null>
  saveCaptions: (updates: { captionPath: string; caption: string }[]) => Promise<void>
  getImageFileUrl: (imagePath: string) => Promise<string>
  getImageFileStats: (imagePath: string) => Promise<{ size: number } | null>
  veil: () => Promise<void>
  config: ConfigAPI
}

// Extend Window interface
declare global {
  interface Window {
    electron: ElectronAPI
    api: MainAPI
    // Tray menu exposed functions
    __hasUnsavedChanges?: () => boolean
    __saveChanges?: () => Promise<void>
  }
}

export {}
