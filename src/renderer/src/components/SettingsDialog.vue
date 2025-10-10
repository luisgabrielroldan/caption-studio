<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfig } from '../composables/useConfig'
import { useDialog } from '../composables/useDialog'
import KeyBindingInput from './KeyBindingInput.vue'
import { CONFIG_KEYS, DEFAULTS, EVENTS } from '../constants'

const config = useConfig()
const { showConfirm, showError } = useDialog()
const isVisible = ref(false)

// Settings state
const fontSize = ref(DEFAULTS.FONT_SIZE)
const lineHeight = ref(DEFAULTS.LINE_HEIGHT)
const theme = ref<'dark' | 'light' | 'system'>(DEFAULTS.THEME)
const rememberLastFolder = ref(DEFAULTS.REMEMBER_LAST_FOLDER)
const veilKey = ref(DEFAULTS.VEIL_KEY)

// Load settings from config
const loadSettings = async (): Promise<void> => {
  const allConfig = (await config.getAll()) as {
    editor?: { fontSize?: number; lineHeight?: number }
    ui?: { theme?: 'dark' | 'light' | 'system' }
    behavior?: { rememberLastFolder?: boolean }
    features?: { veilKey?: string }
  }
  if (allConfig) {
    fontSize.value = allConfig.editor?.fontSize ?? DEFAULTS.FONT_SIZE
    lineHeight.value = allConfig.editor?.lineHeight ?? DEFAULTS.LINE_HEIGHT
    theme.value = allConfig.ui?.theme ?? DEFAULTS.THEME
    rememberLastFolder.value =
      allConfig.behavior?.rememberLastFolder ?? DEFAULTS.REMEMBER_LAST_FOLDER
    veilKey.value = allConfig.features?.veilKey ?? DEFAULTS.VEIL_KEY
  }
}

// Load settings on mount
onMounted(async () => {
  await loadSettings()
})

// Show/hide methods
const show = async (): Promise<void> => {
  await loadSettings()
  isVisible.value = true
}

const hide = (): void => {
  isVisible.value = false
}

// Save settings
const saveSettings = async (): Promise<void> => {
  try {
    // Get current editor and update only fontSize and lineHeight
    const currentEditor = (await config.get(CONFIG_KEYS.EDITOR)) || {}
    await config.set(CONFIG_KEYS.EDITOR, {
      ...currentEditor,
      fontSize: fontSize.value,
      lineHeight: lineHeight.value
    })

    // Get current ui and update only theme
    const currentUi = (await config.get(CONFIG_KEYS.UI)) || {}
    await config.set(CONFIG_KEYS.UI, {
      ...currentUi,
      theme: theme.value
    })

    // Get current behavior and update only rememberLastFolder
    const currentBehavior = (await config.get(CONFIG_KEYS.BEHAVIOR)) || {}
    await config.set(CONFIG_KEYS.BEHAVIOR, {
      ...currentBehavior,
      rememberLastFolder: rememberLastFolder.value
    })

    // Get current features and update veilKey
    const currentFeatures = (await config.get(CONFIG_KEYS.FEATURES)) || {}
    await config.set(CONFIG_KEYS.FEATURES, {
      ...currentFeatures,
      veilKey: veilKey.value
    })

    // Dispatch event to notify app of theme/settings change
    window.dispatchEvent(new CustomEvent(EVENTS.THEME_UPDATED))
    window.dispatchEvent(new CustomEvent(EVENTS.SETTINGS_UPDATED))

    // Close dialog after successful save
    hide()
  } catch (error) {
    await showError(`Error saving settings: ${error}`)
  }
}

// Reset to defaults
const resetToDefaults = async (): Promise<void> => {
  const confirmed = await showConfirm(
    'Are you sure you want to reset these settings to defaults?',
    'Reset Settings',
    'Reset',
    'Cancel'
  )

  if (confirmed) {
    try {
      fontSize.value = DEFAULTS.FONT_SIZE
      lineHeight.value = DEFAULTS.LINE_HEIGHT
      theme.value = DEFAULTS.THEME
      rememberLastFolder.value = DEFAULTS.REMEMBER_LAST_FOLDER
      veilKey.value = DEFAULTS.VEIL_KEY
      // saveSettings() will close the dialog automatically
      await saveSettings()
    } catch (error) {
      await showError(`Error resetting settings: ${error}`)
    }
  }
}

// Expose methods for parent
defineExpose({
  show,
  hide
})
</script>

<template>
  <Transition name="modal">
    <div v-if="isVisible" class="modal-backdrop" @click.self="hide">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2>Preferences</h2>
          <button class="close-btn" title="Close" @click="hide">✕</button>
        </div>

        <div class="modal-content">
          <section class="settings-section">
            <div class="setting-row">
              <label for="fontSize">Font Size</label>
              <input
                id="fontSize"
                v-model.number="fontSize"
                type="number"
                :min="10"
                :max="24"
                class="input-number"
              />
            </div>
            <div class="setting-row">
              <label for="lineHeight">Line Height</label>
              <input
                id="lineHeight"
                v-model.number="lineHeight"
                type="number"
                :min="1"
                :max="3"
                :step="0.1"
                class="input-number"
              />
            </div>
            <div class="setting-row">
              <label for="theme">Theme</label>
              <select id="theme" v-model="theme" class="input-select">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
            <div class="setting-row">
              <label>
                <input v-model="rememberLastFolder" type="checkbox" />
                Remember Last Opened Folder
              </label>
            </div>
            <div class="setting-row">
              <label for="veilKey">Veil Shortcut</label>
              <KeyBindingInput v-model="veilKey" placeholder="Click to set" />
            </div>
          </section>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="resetToDefaults">Reset to Defaults</button>
          <div class="footer-actions">
            <button class="btn btn-cancel" @click="hide">Cancel</button>
            <button class="btn btn-primary" @click="saveSettings">Save</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4em;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.5em;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  gap: 16px;
}

.setting-row label {
  color: var(--text-secondary);
  font-size: 0.95em;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.input-number,
.input-select {
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  min-width: 120px;
  transition: border-color 0.2s;
}

.input-number:focus,
.input-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--accent-color);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent-color);
  color: #fff;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-cancel {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary {
  background: #444;
  color: #fff;
}

.btn-secondary:hover {
  background: #555;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform 0.2s;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.95);
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.modal-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>
