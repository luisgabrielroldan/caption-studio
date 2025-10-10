import { ref, Ref } from 'vue'

/**
 * Composable for accessing and managing application configuration
 * Provides reactive access to config values with persistence
 */
export function useConfig() {
  // Get a specific config value
  const get = async <T = any>(key: string): Promise<T> => {
    return await window.api.config.get(key)
  }

  // Set a specific config value
  const set = async (key: string, value: any): Promise<boolean> => {
    return await window.api.config.set(key, value)
  }

  // Get all config
  const getAll = async (): Promise<any> => {
    return await window.api.config.getAll()
  }

  // Reset config to defaults
  const reset = async (): Promise<any> => {
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
  const createReactive = <T>(key: string, defaultValue: T): { value: Ref<T>; save: () => Promise<void> } => {
    const value = ref<T>(defaultValue) as Ref<T>

    // Load initial value
    get<T>(key).then((storedValue) => {
      if (storedValue !== undefined && storedValue !== null) {
        value.value = storedValue
      }
    })

    // Save function
    const save = async () => {
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

