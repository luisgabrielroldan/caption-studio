import { onMounted, onUnmounted, ref, Ref } from 'vue'
import { useConfig } from './useConfig'
import { matchesKeyCombination } from '../utils/keyboard'
import { CONFIG_KEYS, DEFAULTS, EVENTS } from '../constants'

/**
 * Composable for handling the Veil feature (hide to system tray)
 */
export function useVeil(): { veilKey: Ref<string> } {
  const config = useConfig()
  const veilKey = ref(DEFAULTS.VEIL_KEY)

  // Parse key combination string and check if event matches
  const matchesVeilKey = (event: KeyboardEvent): boolean => {
    return matchesKeyCombination(veilKey.value, event)
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
    const features = await config.get<{ veilKey?: string }>(CONFIG_KEYS.FEATURES)
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
    window.addEventListener(EVENTS.SETTINGS_UPDATED, handleSettingsUpdated)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener(EVENTS.SETTINGS_UPDATED, handleSettingsUpdated)
  })

  return {
    veilKey
  }
}
