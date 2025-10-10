import { onMounted, onUnmounted } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import { registerIpcListeners } from '../utils/ipc'
import { MENU_EVENTS } from '../constants'

interface KeyboardShortcutsOptions {
  onFocusEditor?: () => void
  onOpenFolder?: () => void
  onSaveCaptions?: () => void
  onResetChanges?: () => void
  onCloseFolder?: () => void
  onShowPreferences?: () => void
}

/**
 * Composable for global keyboard shortcuts and menu events
 * Handles navigation, focus management, and file operations
 * from both keyboard and native menu
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}): void {
  const store = useCaptionStore()
  let cleanupIpcListeners: (() => void) | null = null

  // Handle menu events from main process
  const handleMenuEvents = (): void => {
    cleanupIpcListeners = registerIpcListeners({
      [MENU_EVENTS.OPEN_FOLDER]: options.onOpenFolder || (() => {}),
      [MENU_EVENTS.OPEN_RECENT_FOLDER]: async (...args: unknown[]) => {
        const folderPath = args[0] as string
        if (options.onOpenFolder && folderPath) {
          // For recent folders, we pass the path directly to the API
          const result = await window.api.openFolder(folderPath)
          if (result) {
            // Use the store directly since we're bypassing the composable
            store.setFolderPath(result.folderPath)
            // @ts-ignore - Type mismatch between ImageData and ImageItem despite having same fields
            store.setImages(result.images)
          }
        }
      },
      [MENU_EVENTS.SAVE_CAPTIONS]: options.onSaveCaptions || (() => {}),
      [MENU_EVENTS.RESET_CHANGES]: options.onResetChanges || (() => {}),
      [MENU_EVENTS.CLOSE_FOLDER]: options.onCloseFolder || (() => {}),
      [MENU_EVENTS.PREVIOUS_IMAGE]: () => {
        if (!store.isBatchGenerating) {
          store.previousImage()
          store.selectSingle(store.currentIndex)
        }
      },
      [MENU_EVENTS.NEXT_IMAGE]: () => {
        if (!store.isBatchGenerating) {
          store.nextImage()
          store.selectSingle(store.currentIndex)
        }
      },
      [MENU_EVENTS.FIRST_IMAGE]: () => {
        if (store.totalImages > 0 && !store.isBatchGenerating) {
          store.setCurrentIndex(0)
          store.selectSingle(0)
        }
      },
      [MENU_EVENTS.LAST_IMAGE]: () => {
        if (store.totalImages > 0 && !store.isBatchGenerating) {
          store.setCurrentIndex(store.totalImages - 1)
          store.selectSingle(store.totalImages - 1)
        }
      },
      [MENU_EVENTS.FOCUS_EDITOR]: options.onFocusEditor || (() => {})
    })
  }

  const handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

    // Check if we're in a text input
    const target = event.target as HTMLElement
    const isTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT'

    // Navigation shortcuts (work anywhere except when typing in text input or batch generation is active)
    if (event.key === 'ArrowUp' || event.key === 'k') {
      if ((!isTextInput || event.ctrlKey || event.metaKey) && !store.isBatchGenerating) {
        event.preventDefault()
        store.previousImage()
        store.selectSingle(store.currentIndex)
      }
    } else if (event.key === 'ArrowDown' || event.key === 'j') {
      if ((!isTextInput || event.ctrlKey || event.metaKey) && !store.isBatchGenerating) {
        event.preventDefault()
        store.nextImage()
        store.selectSingle(store.currentIndex)
      }
    }
    // Home/End to jump to first/last image
    else if (event.key === 'Home') {
      if ((!isTextInput || event.ctrlKey || event.metaKey) && !store.isBatchGenerating) {
        event.preventDefault()
        if (store.totalImages > 0) {
          store.setCurrentIndex(0)
          store.selectSingle(0)
        }
      }
    } else if (event.key === 'End') {
      if ((!isTextInput || event.ctrlKey || event.metaKey) && !store.isBatchGenerating) {
        event.preventDefault()
        if (store.totalImages > 0) {
          store.setCurrentIndex(store.totalImages - 1)
          store.selectSingle(store.totalImages - 1)
        }
      }
    }
    // Tab to focus caption editor
    else if (event.key === 'Tab' && !isTextInput) {
      event.preventDefault()
      options.onFocusEditor?.()
    }
    // Cmd/Ctrl+Enter to toggle focus between navigation and editor
    else if (event.key === 'Enter' && cmdOrCtrl) {
      event.preventDefault()
      if (isTextInput) {
        target.blur()
      } else {
        options.onFocusEditor?.()
      }
    }
    // Escape to unfocus textarea
    else if (event.key === 'Escape' && isTextInput) {
      target.blur()
    }
    // Ctrl/Cmd+O: Open folder
    else if (cmdOrCtrl && event.key === 'o') {
      event.preventDefault()
      options.onOpenFolder?.()
    }
    // Ctrl/Cmd+S: Save all
    else if (cmdOrCtrl && event.key === 's') {
      event.preventDefault()
      options.onSaveCaptions?.()
    }
    // Ctrl/Cmd+Shift+R: Reset all changes
    else if (cmdOrCtrl && event.shiftKey && event.key === 'R') {
      event.preventDefault()
      options.onResetChanges?.()
    }
    // Ctrl/Cmd+W: Close folder
    else if (cmdOrCtrl && event.key === 'w') {
      event.preventDefault()
      options.onCloseFolder?.()
    }
    // Ctrl/Cmd+,: Open preferences
    else if (cmdOrCtrl && event.key === ',') {
      event.preventDefault()
      options.onShowPreferences?.()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    handleMenuEvents()
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    // Clean up menu event listeners
    if (cleanupIpcListeners) {
      cleanupIpcListeners()
    }
  })
}
