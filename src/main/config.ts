import { ipcMain } from 'electron'

// Define the configuration schema with types and defaults
interface ConfigSchema {
  // Window settings
  window: {
    width: number
    height: number
    x?: number
    y?: number
  }
  // Panel settings
  thumbnailPanelWidth: number
  // Recent folders
  recentFolders: string[]
  maxRecentFolders: number
  // Editor settings
  editor: {
    fontSize: number
    lineHeight: number
    autoSave: boolean
    autoSaveDelay: number // milliseconds
  }
  // UI preferences
  ui: {
    showImageInfo: boolean
    showThumbnailFilenames: boolean
    thumbnailSize: 'small' | 'medium' | 'large'
    theme: 'dark' | 'light' | 'system'
  }
  // Behavior
  behavior: {
    warnOnUnsavedChanges: boolean
    rememberLastFolder: boolean
    lastOpenedFolder?: string
  }
}

const defaultConfig: ConfigSchema = {
  window: {
    width: 1400,
    height: 900
  },
  thumbnailPanelWidth: 280,
  recentFolders: [],
  maxRecentFolders: 10,
  editor: {
    fontSize: 14,
    lineHeight: 1.6,
    autoSave: false,
    autoSaveDelay: 2000
  },
  ui: {
    showImageInfo: true,
    showThumbnailFilenames: true,
    thumbnailSize: 'medium',
    theme: 'dark'
  },
  behavior: {
    warnOnUnsavedChanges: true,
    rememberLastFolder: true
  }
}

// Import Store lazily to work with electron-vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function initStore(): Promise<any> {
  const ElectronStore = (await import('electron-store')).default
  store = new ElectronStore({
    defaults: defaultConfig,
    name: 'caption-studio-config'
  })
  return store
}

// Export store initialization function
export { initStore, store }

// Register IPC handlers for config access
export async function registerConfigHandlers(): Promise<void> {
  // Ensure store is initialized
  if (!store) {
    await initStore()
  }
  // Get entire config
  ipcMain.handle('config:get-all', () => {
    return store.store
  })

  // Get a specific config value
  ipcMain.handle('config:get', (_event, key: string) => {
    return store.get(key as keyof ConfigSchema)
  })

  // Set a specific config value
  ipcMain.handle('config:set', (_event, key: string, value: unknown) => {
    store.set(key as keyof ConfigSchema, value)
    return true
  })

  // Reset config to defaults
  ipcMain.handle('config:reset', () => {
    store.clear()
    return store.store
  })

  // Add to recent folders
  ipcMain.handle('config:add-recent-folder', (_event, folderPath: string) => {
    const recentFolders = store.get('recentFolders')
    const maxRecent = store.get('maxRecentFolders')

    // Remove if already exists
    const filtered = recentFolders.filter((path) => path !== folderPath)

    // Add to beginning
    filtered.unshift(folderPath)

    // Limit to max
    const updated = filtered.slice(0, maxRecent)

    store.set('recentFolders', updated)
    return updated
  })

  // Get recent folders
  ipcMain.handle('config:get-recent-folders', () => {
    return store.get('recentFolders')
  })

  // Update window bounds
  ipcMain.handle(
    'config:set-window-bounds',
    (_event, bounds: { width: number; height: number; x?: number; y?: number }) => {
      store.set('window', bounds)
      return true
    }
  )
}
