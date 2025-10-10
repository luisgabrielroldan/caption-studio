import { onMounted, onUnmounted } from 'vue'
import { useCaptionStore } from '../stores/captionStore'

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
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const store = useCaptionStore()

  // Handle menu events from main process
  const handleMenuEvents = () => {
    // @ts-ignore - electron API from preload
    if (window.electron?.ipcRenderer) {
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:open-folder', options.onOpenFolder || (() => {}))
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:save-captions', options.onSaveCaptions || (() => {}))
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:reset-changes', options.onResetChanges || (() => {}))
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:close-folder', options.onCloseFolder || (() => {}))
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:previous-image', () => store.previousImage())
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:next-image', () => store.nextImage())
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:first-image', () => {
        if (store.totalImages > 0) store.setCurrentIndex(0)
      })
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:last-image', () => {
        if (store.totalImages > 0) store.setCurrentIndex(store.totalImages - 1)
      })
      // @ts-ignore
      window.electron.ipcRenderer.on('menu:focus-editor', options.onFocusEditor || (() => {}))
    }
  }

  const handleKeyDown = async (event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

    // Check if we're in a text input
    const target = event.target as HTMLElement
    const isTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT'

    // Navigation shortcuts (work anywhere except when typing in text input)
    if (event.key === 'ArrowUp' || event.key === 'k') {
      if (!isTextInput || event.ctrlKey || event.metaKey) {
        event.preventDefault()
        store.previousImage()
      }
    } else if (event.key === 'ArrowDown' || event.key === 'j') {
      if (!isTextInput || event.ctrlKey || event.metaKey) {
        event.preventDefault()
        store.nextImage()
      }
    }
    // Home/End to jump to first/last image
    else if (event.key === 'Home') {
      if (!isTextInput || event.ctrlKey || event.metaKey) {
        event.preventDefault()
        if (store.totalImages > 0) {
          store.setCurrentIndex(0)
        }
      }
    } else if (event.key === 'End') {
      if (!isTextInput || event.ctrlKey || event.metaKey) {
        event.preventDefault()
        if (store.totalImages > 0) {
          store.setCurrentIndex(store.totalImages - 1)
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
    // @ts-ignore
    if (window.electron?.ipcRenderer?.removeAllListeners) {
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:open-folder')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:save-captions')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:reset-changes')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:close-folder')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:previous-image')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:next-image')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:first-image')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:last-image')
      // @ts-ignore
      window.electron.ipcRenderer.removeAllListeners('menu:focus-editor')
    }
  })

  return {
    handleKeyDown
  }
}

