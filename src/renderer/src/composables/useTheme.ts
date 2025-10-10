/**
 * Composable for theme management
 * Handles theme loading, applying, and system preference detection
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useConfig } from './useConfig'
import { CONFIG_KEYS, DEFAULTS, EVENTS } from '../constants'

export type Theme = 'dark' | 'light' | 'system'

export function useTheme(): {
  currentTheme: ReturnType<typeof ref<Theme>>
  loadTheme: () => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  applyTheme: () => void
  getEffectiveTheme: () => 'dark' | 'light'
} {
  const config = useConfig()
  const currentTheme = ref<Theme>(DEFAULTS.THEME)
  const systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  /**
   * Get the effective theme (resolves 'system' to actual theme)
   */
  const getEffectiveTheme = (): 'dark' | 'light' => {
    if (currentTheme.value === 'system') {
      return systemThemeMediaQuery.matches ? 'dark' : 'light'
    }
    return currentTheme.value
  }

  /**
   * Apply the theme to the document
   */
  const applyTheme = (): void => {
    const effectiveTheme = getEffectiveTheme()
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }

  /**
   * Load theme from config
   */
  const loadTheme = async (): Promise<void> => {
    const uiConfig = await config.get<{ theme?: Theme }>(CONFIG_KEYS.UI)
    if (uiConfig?.theme) {
      currentTheme.value = uiConfig.theme
      applyTheme()
    }
  }

  /**
   * Set and save theme
   */
  const setTheme = async (theme: Theme): Promise<void> => {
    currentTheme.value = theme
    applyTheme()

    // Save to config
    const currentUi = (await config.get(CONFIG_KEYS.UI)) || {}
    await config.set(CONFIG_KEYS.UI, {
      ...currentUi,
      theme
    })

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent(EVENTS.THEME_UPDATED))
  }

  /**
   * Handle system theme changes
   */
  const handleSystemThemeChange = (): void => {
    if (currentTheme.value === 'system') {
      applyTheme()
    }
  }

  /**
   * Handle theme updates from other sources (like settings dialog)
   */
  const handleThemeUpdate = async (): Promise<void> => {
    await loadTheme()
  }

  onMounted(async () => {
    await loadTheme()
    systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange)
    window.addEventListener(EVENTS.THEME_UPDATED, handleThemeUpdate)
  })

  onUnmounted(() => {
    systemThemeMediaQuery.removeEventListener('change', handleSystemThemeChange)
    window.removeEventListener(EVENTS.THEME_UPDATED, handleThemeUpdate)
  })

  return {
    currentTheme,
    loadTheme,
    setTheme,
    applyTheme,
    getEffectiveTheme
  }
}
