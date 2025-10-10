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

  // Auto Captioner
  AUTO_CAPTIONER: 'autoCaptioner',
  AUTO_CAPTIONER_PROVIDER: 'autoCaptioner.provider',
  AUTO_CAPTIONER_SYSTEM_PROMPT: 'autoCaptioner.systemPrompt',
  AUTO_CAPTIONER_TEMPERATURE: 'autoCaptioner.temperature',
  AUTO_CAPTIONER_MAX_TOKENS: 'autoCaptioner.maxTokens',
  AUTO_CAPTIONER_CUSTOM_BASE_URL: 'autoCaptioner.custom.baseUrl',
  AUTO_CAPTIONER_CUSTOM_MODEL_NAME: 'autoCaptioner.custom.modelName',
  AUTO_CAPTIONER_CHATGPT_API_KEY: 'autoCaptioner.chatgpt.apiKey',
  AUTO_CAPTIONER_CHATGPT_MODEL_NAME: 'autoCaptioner.chatgpt.modelName',

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
  MAX_ZOOM: 5,
  AUTO_CAPTIONER_PROVIDER: 'custom' as 'custom' | 'chatgpt',
  AUTO_CAPTIONER_SYSTEM_PROMPT: 'Describe this image for AI training purposes. Be concise and objective.',
  AUTO_CAPTIONER_TEMPERATURE: 0.7,
  AUTO_CAPTIONER_MAX_TOKENS: 300,
  AUTO_CAPTIONER_CUSTOM_BASE_URL: 'http://127.0.0.1:1234/v1',
  AUTO_CAPTIONER_CUSTOM_MODEL_NAME: 'llava:latest',
  AUTO_CAPTIONER_CHATGPT_API_KEY: '',
  AUTO_CAPTIONER_CHATGPT_MODEL_NAME: 'gpt-4o'
}

// UI constraints
export const CONSTRAINTS = {
  THUMBNAIL_MIN_WIDTH: 200,
  THUMBNAIL_MAX_WIDTH: 600,
  FONT_SIZE_MIN: 10,
  FONT_SIZE_MAX: 24,
  LINE_HEIGHT_MIN: 1,
  LINE_HEIGHT_MAX: 3,
  LINE_HEIGHT_STEP: 0.1,
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  TEMPERATURE_STEP: 0.1,
  MAX_TOKENS_MIN: 50,
  MAX_TOKENS_MAX: 1000,
  MAX_TOKENS_STEP: 50
} as const
