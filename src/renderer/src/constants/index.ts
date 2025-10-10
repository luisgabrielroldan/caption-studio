/**
 * Application-wide constants
 * Centralized location for magic strings, event names, and config keys
 */

// Custom DOM Events
export const EVENTS = {
  THEME_UPDATED: 'theme-updated',
  SETTINGS_UPDATED: 'settings-updated'
} as const

// IPC Menu Event Channels
export const MENU_EVENTS = {
  OPEN_FOLDER: 'menu:open-folder',
  OPEN_RECENT_FOLDER: 'menu:open-recent-folder',
  SAVE_CAPTIONS: 'menu:save-captions',
  RESET_CHANGES: 'menu:reset-changes',
  CLOSE_FOLDER: 'menu:close-folder',
  PREVIOUS_IMAGE: 'menu:previous-image',
  NEXT_IMAGE: 'menu:next-image',
  FIRST_IMAGE: 'menu:first-image',
  LAST_IMAGE: 'menu:last-image',
  FOCUS_EDITOR: 'menu:focus-editor',
  SHOW_PREFERENCES: 'menu:show-preferences'
} as const

// Configuration Keys
export const CONFIG_KEYS = {
  // Editor settings
  EDITOR: 'editor',
  EDITOR_FONT_SIZE: 'editor.fontSize',
  EDITOR_LINE_HEIGHT: 'editor.lineHeight',

  // UI settings
  UI: 'ui',
  UI_THEME: 'ui.theme',

  // Behavior settings
  BEHAVIOR: 'behavior',
  BEHAVIOR_REMEMBER_LAST_FOLDER: 'behavior.rememberLastFolder',
  BEHAVIOR_LAST_OPENED_FOLDER: 'behavior.lastOpenedFolder',

  // Features
  FEATURES: 'features',
  FEATURES_VEIL_KEY: 'features.veilKey',

  // Panel settings
  THUMBNAIL_PANEL_WIDTH: 'thumbnailPanelWidth'
} as const

// Key mappings for keyboard shortcuts
export const KEY_MAP: Record<string, string> = {
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
} as const

// Default values
export const DEFAULTS = {
  FONT_SIZE: 14,
  LINE_HEIGHT: 1.6,
  THEME: 'dark' as 'dark' | 'light' | 'system',
  REMEMBER_LAST_FOLDER: true,
  VEIL_KEY: 'Shift + F12',
  THUMBNAIL_WIDTH: 280,
  MIN_ZOOM: 1,
  MAX_ZOOM: 5
}

// UI constraints
export const CONSTRAINTS = {
  THUMBNAIL_MIN_WIDTH: 200,
  THUMBNAIL_MAX_WIDTH: 600,
  FONT_SIZE_MIN: 10,
  FONT_SIZE_MAX: 24,
  LINE_HEIGHT_MIN: 1,
  LINE_HEIGHT_MAX: 3,
  LINE_HEIGHT_STEP: 0.1
} as const
