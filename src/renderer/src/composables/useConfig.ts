import { ref, Ref } from 'vue'

/**
 * Composable for accessing and managing application configuration
 * Provides reactive access to config values with persistence
 */
export function useConfig(): {
  get: <T = unknown>(key: string) => Promise<T>
  set: (key: string, value: unknown) => Promise<boolean>
  getAll: () => Promise<unknown>
  reset: () => Promise<unknown>
  addRecentFolder: (folderPath: string) => Promise<string[]>
  getRecentFolders: () => Promise<string[]>
  createReactive: <T>(key: string, defaultValue: T) => { value: Ref<T>; save: () => Promise<void> }
} {
  // Get a specific config value
  const get = async <T = unknown>(key: string): Promise<T> => {
    return (await window.api.config.get(key)) as T
  }

  // Set a specific config value
  const set = async (key: string, value: unknown): Promise<boolean> => {
    return await window.api.config.set(key, value)
  }

  // Get all config
  const getAll = async (): Promise<unknown> => {
    return await window.api.config.getAll()
  }

  // Reset config to defaults
  const reset = async (): Promise<unknown> => {
    return await window.api.config.reset()
  }

  // Add a recent folder
  const addRecentFolder = async (folderPath: string): Promise<string[]> => {
    return await window.api.config.addRecentFolder(folderPath)
  }

  // Get recent folders
  const getRecentFolders = async (): Promise<string[]> => {
    return await window.api.config.getRecentFolders()
  }

  // Create a reactive config value
  const createReactive = <T>(
    key: string,
    defaultValue: T
  ): { value: Ref<T>; save: () => Promise<void> } => {
    const value = ref<T>(defaultValue) as Ref<T>

    // Load initial value
    get<T>(key).then((storedValue) => {
      if (storedValue !== undefined && storedValue !== null) {
        value.value = storedValue
      }
    })

    // Save function
    const save = async (): Promise<void> => {
      await set(key, value.value)
    }

    return { value, save }
  }

  return {
    get,
    set,
    getAll,
    reset,
    addRecentFolder,
    getRecentFolders,
    createReactive
  }
}
