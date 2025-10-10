import { ElectronAPI } from '@electron-toolkit/preload'

interface ImageData {
  id: string
  path: string
  filename: string
  captionPath: string
  originalCaption: string
  currentCaption: string
}

interface CaptionUpdate {
  captionPath: string
  caption: string
}

interface ConfigAPI {
  getAll: () => Promise<unknown>
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<boolean>
  reset: () => Promise<unknown>
  addRecentFolder: (folderPath: string) => Promise<string[]>
  getRecentFolders: () => Promise<string[]>
}

interface API {
  openFolder: (directPath?: string) => Promise<{ folderPath: string; images: ImageData[] } | null>
  saveCaptions: (updates: CaptionUpdate[]) => Promise<{ success: boolean }>
  getImageFileUrl: (imagePath: string) => Promise<string>
  getImageFileStats: (imagePath: string) => Promise<{ size: number } | null>
  veil: () => Promise<void>
  config: ConfigAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
