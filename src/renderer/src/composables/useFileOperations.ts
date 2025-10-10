import { ref } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import { useConfig } from './useConfig'
import { useDialog } from './useDialog'
import { CONFIG_KEYS } from '../constants'

/**
 * Composable for file operations (open, save, close)
 * Centralizes file operation logic used by multiple components
 */
export function useFileOperations(): {
  isSaving: ReturnType<typeof ref<boolean>>
  openFolder: () => Promise<{ folderPath: string; images: unknown[] } | null>
  saveCaptions: (showAlert?: boolean) => Promise<boolean>
  closeFolder: () => Promise<boolean>
} {
  const store = useCaptionStore()
  const config = useConfig()
  const { showInfo, showError, showConfirm } = useDialog()
  const isSaving = ref(false)

  const openFolder = async (): Promise<{ folderPath: string; images: unknown[] } | null> => {
    const result = await window.api.openFolder()
    if (result) {
      store.setFolderPath(result.folderPath)
      store.setImages(result.images)
      // Add to recent folders
      await config.addRecentFolder(result.folderPath)
      // Save as last opened folder if enabled
      const rememberLastFolder = await config.get(CONFIG_KEYS.BEHAVIOR_REMEMBER_LAST_FOLDER)
      if (rememberLastFolder) {
        await config.set(CONFIG_KEYS.BEHAVIOR_LAST_OPENED_FOLDER, result.folderPath)
      }
    }
    return result
  }

  const saveCaptions = async (showAlert = false): Promise<boolean> => {
    if (!store.hasUnsavedChanges) return false

    isSaving.value = true
    try {
      const updates = store.images
        .filter((img) => img.originalCaption !== img.currentCaption)
        .map((img) => ({
          captionPath: img.captionPath,
          caption: img.currentCaption.trim()
        }))

      await window.api.saveCaptions(updates)
      store.markAsSaved()

      if (showAlert) {
        await showInfo('All captions saved successfully!')
      }
      return true
    } catch (error) {
      const message = `Error saving captions: ${error}`
      await showError(message)
      console.error(message)
      return false
    } finally {
      isSaving.value = false
    }
  }

  const closeFolder = async (): Promise<boolean> => {
    if (store.hasUnsavedChanges) {
      const confirmed = await showConfirm(
        'You have unsaved changes. Are you sure you want to close?',
        'Unsaved Changes',
        'Close',
        'Cancel'
      )
      if (!confirmed) return false
    }
    store.clearAll()
    return true
  }

  return {
    isSaving,
    openFolder,
    saveCaptions,
    closeFolder
  }
}
