<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfig } from '../composables/useConfig'
import KeyBindingInput from './KeyBindingInput.vue'

const config = useConfig()
const isVisible = ref(false)

// Settings state
const fontSize = ref(14)
const lineHeight = ref(1.6)
const theme = ref<'dark' | 'light' | 'system'>('dark')
const rememberLastFolder = ref(true)
const veilKey = ref('Shift + F12')

// Load settings from config
const loadSettings = async (): Promise<void> => {
  const allConfig = (await config.getAll()) as {
    editor?: { fontSize?: number; lineHeight?: number }
    ui?: { theme?: 'dark' | 'light' | 'system' }
    behavior?: { rememberLastFolder?: boolean }
    features?: { veilKey?: string }
  }
  if (allConfig) {
    fontSize.value = allConfig.editor?.fontSize ?? 14
    lineHeight.value = allConfig.editor?.lineHeight ?? 1.6
    theme.value = allConfig.ui?.theme ?? 'dark'
    rememberLastFolder.value = allConfig.behavior?.rememberLastFolder ?? true
    veilKey.value = allConfig.features?.veilKey ?? 'Shift + F12'
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
    const currentEditor = (await config.get('editor')) || {}
    await config.set('editor', {
      ...currentEditor,
      fontSize: fontSize.value,
      lineHeight: lineHeight.value
    })

    // Get current ui and update only theme
    const currentUi = (await config.get('ui')) || {}
    await config.set('ui', {
      ...currentUi,
      theme: theme.value
    })

    // Get current behavior and update only rememberLastFolder
    const currentBehavior = (await config.get('behavior')) || {}
    await config.set('behavior', {
      ...currentBehavior,
      rememberLastFolder: rememberLastFolder.value
    })

    // Get current features and update veilKey
    const currentFeatures = (await config.get('features')) || {}
    await config.set('features', {
      ...currentFeatures,
      veilKey: veilKey.value
    })

    // Dispatch event to notify app of theme/settings change
    window.dispatchEvent(new CustomEvent('theme-updated'))
    window.dispatchEvent(new CustomEvent('settings-updated'))

    alert('Settings saved successfully!')
    hide()
  } catch (error) {
    alert(`Error saving settings: ${error}`)
  }
}

// Reset to defaults
const resetToDefaults = async (): Promise<void> => {
  if (confirm('Are you sure you want to reset these settings to defaults?')) {
    try {
      fontSize.value = 14
      lineHeight.value = 1.6
      theme.value = 'dark'
      rememberLastFolder.value = true
      veilKey.value = 'Shift + F12'
      await saveSettings()
      alert('Settings reset to defaults!')
    } catch (error) {
      alert(`Error resetting settings: ${error}`)
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
                min="10"
                max="24"
                class="input-number"
              />
            </div>
            <div class="setting-row">
              <label for="lineHeight">Line Height</label>
              <input
                id="lineHeight"
                v-model.number="lineHeight"
                type="number"
                min="1"
                max="3"
                step="0.1"
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
