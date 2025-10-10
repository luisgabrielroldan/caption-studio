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
  getAll: () => Promise<any>
  get: (key: string) => Promise<any>
  set: (key: string, value: any) => Promise<boolean>
  reset: () => Promise<any>
  addRecentFolder: (folderPath: string) => Promise<string[]>
  getRecentFolders: () => Promise<string[]>
}

interface API {
  openFolder: (directPath?: string) => Promise<{ folderPath: string; images: ImageData[] } | null>
  saveCaptions: (updates: CaptionUpdate[]) => Promise<{ success: boolean }>
  getImageFileUrl: (imagePath: string) => Promise<string>
  config: ConfigAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
