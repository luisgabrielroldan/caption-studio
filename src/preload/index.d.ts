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

interface API {
  openFolder: () => Promise<{ folderPath: string; images: ImageData[] } | null>
  saveCaptions: (updates: CaptionUpdate[]) => Promise<{ success: boolean }>
  getImageFileUrl: (imagePath: string) => Promise<string>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
