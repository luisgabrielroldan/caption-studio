import { onMounted, onUnmounted } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import type { Ref } from 'vue'

interface KeyboardShortcutsOptions {
  onFocusEditor?: () => void
  onOpenFolder?: () => void
  onSaveCaptions?: () => void
  onCloseFolder?: () => void
}

/**
 * Composable for global keyboard shortcuts
 * Handles navigation, focus management, and file operations
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const store = useCaptionStore()

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
    // Ctrl/Cmd+W: Close folder
    else if (cmdOrCtrl && event.key === 'w') {
      event.preventDefault()
      options.onCloseFolder?.()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    handleKeyDown
  }
}

