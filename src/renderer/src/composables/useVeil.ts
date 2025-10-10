import { onMounted, onUnmounted, ref, Ref } from 'vue'
import { useConfig } from './useConfig'

/**
 * Composable for handling the Veil feature (hide to system tray)
 */
export function useVeil(): { veilKey: Ref<string> } {
  const config = useConfig()
  const veilKey = ref('Shift + F12')

  // Parse key combination string and check if event matches
  const matchesVeilKey = (event: KeyboardEvent): boolean => {
    const combination = veilKey.value
    if (!combination) return false

    const parts = combination.split(' + ').map((p) => p.trim())
    const mainKey = parts[parts.length - 1]
    const modifiers = parts.slice(0, -1)

    // Check modifiers
    const hasCtrl = modifiers.some((m) => m === 'Ctrl' || m === 'Cmd')
    const hasShift = modifiers.includes('Shift')
    const hasAlt = modifiers.includes('Alt')

    const eventHasCtrl = event.ctrlKey || event.metaKey
    const eventHasShift = event.shiftKey
    const eventHasAlt = event.altKey

    if (hasCtrl !== eventHasCtrl) return false
    if (hasShift !== eventHasShift) return false
    if (hasAlt !== eventHasAlt) return false

    // Check main key
    let eventKey = event.key

    // Map special keys
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
      Escape: 'Esc',
      Enter: 'Enter',
      Backspace: 'Backspace',
      Delete: 'Del',
      Tab: 'Tab'
    }

    if (keyMap[eventKey]) {
      eventKey = keyMap[eventKey]
    } else if (eventKey.length === 1) {
      eventKey = eventKey.toUpperCase()
    }

    return eventKey === mainKey
  }

  const handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
    // Don't trigger if typing in an input/textarea
    const target = event.target as HTMLElement
    const isTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT'
    if (isTextInput) return

    if (matchesVeilKey(event)) {
      event.preventDefault()
      event.stopPropagation()

      try {
        await window.api.veil()
      } catch (error) {
        console.error('Failed to veil window:', error)
      }
    }
  }

  // Load veil key configuration
  const loadVeilKey = async (): Promise<void> => {
    const features = await config.get<{ veilKey?: string }>('features')
    if (features?.veilKey) {
      veilKey.value = features.veilKey
    }
  }

  // Listen for settings updates
  const handleSettingsUpdated = (): void => {
    loadVeilKey()
  }

  onMounted(async () => {
    await loadVeilKey()
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('settings-updated', handleSettingsUpdated)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('settings-updated', handleSettingsUpdated)
  })

  return {
    veilKey
  }
}
