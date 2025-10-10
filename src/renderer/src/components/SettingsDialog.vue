<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfig } from '../composables/useConfig'
import { useDialog } from '../composables/useDialog'
import KeyBindingInput from './KeyBindingInput.vue'
import { CONFIG_KEYS, DEFAULTS, EVENTS } from '../constants'

const config = useConfig()
const { showConfirm, showError } = useDialog()
const isVisible = ref(false)

// Active tab
const activeTab = ref<'general' | 'autoCaptioner'>('general')

// General settings state
const fontSize = ref(DEFAULTS.FONT_SIZE)
const lineHeight = ref(DEFAULTS.LINE_HEIGHT)
const theme = ref<'dark' | 'light' | 'system'>(DEFAULTS.THEME)
const rememberLastFolder = ref(DEFAULTS.REMEMBER_LAST_FOLDER)
const veilKey = ref(DEFAULTS.VEIL_KEY)

// Auto Captioner settings state
const autoCaptionerProvider = ref<'custom' | 'chatgpt'>(DEFAULTS.AUTO_CAPTIONER_PROVIDER)
const autoCaptionerSystemPrompt = ref(DEFAULTS.AUTO_CAPTIONER_SYSTEM_PROMPT)
const autoCaptionerTemperature = ref(DEFAULTS.AUTO_CAPTIONER_TEMPERATURE)
const autoCaptionerMaxTokens = ref(DEFAULTS.AUTO_CAPTIONER_MAX_TOKENS)
const autoCaptionerCustomBaseUrl = ref(DEFAULTS.AUTO_CAPTIONER_CUSTOM_BASE_URL)
const autoCaptionerCustomModelName = ref(DEFAULTS.AUTO_CAPTIONER_CUSTOM_MODEL_NAME)
const autoCaptionerChatgptApiKey = ref(DEFAULTS.AUTO_CAPTIONER_CHATGPT_API_KEY)
const autoCaptionerChatgptModelName = ref(DEFAULTS.AUTO_CAPTIONER_CHATGPT_MODEL_NAME)

// Load settings from config
const loadSettings = async (): Promise<void> => {
  const allConfig = (await config.getAll()) as {
    editor?: { fontSize?: number; lineHeight?: number }
    ui?: { theme?: 'dark' | 'light' | 'system' }
    behavior?: { rememberLastFolder?: boolean }
    features?: { veilKey?: string }
    autoCaptioner?: {
      provider?: 'custom' | 'chatgpt'
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
      custom?: { baseUrl?: string; modelName?: string }
      chatgpt?: { apiKey?: string; modelName?: string }
    }
  }
  if (allConfig) {
    fontSize.value = allConfig.editor?.fontSize ?? DEFAULTS.FONT_SIZE
    lineHeight.value = allConfig.editor?.lineHeight ?? DEFAULTS.LINE_HEIGHT
    theme.value = allConfig.ui?.theme ?? DEFAULTS.THEME
    rememberLastFolder.value =
      allConfig.behavior?.rememberLastFolder ?? DEFAULTS.REMEMBER_LAST_FOLDER
    veilKey.value = allConfig.features?.veilKey ?? DEFAULTS.VEIL_KEY
    autoCaptionerProvider.value =
      allConfig.autoCaptioner?.provider ?? DEFAULTS.AUTO_CAPTIONER_PROVIDER
    autoCaptionerSystemPrompt.value =
      allConfig.autoCaptioner?.systemPrompt ?? DEFAULTS.AUTO_CAPTIONER_SYSTEM_PROMPT
    autoCaptionerTemperature.value =
      allConfig.autoCaptioner?.temperature ?? DEFAULTS.AUTO_CAPTIONER_TEMPERATURE
    autoCaptionerMaxTokens.value =
      allConfig.autoCaptioner?.maxTokens ?? DEFAULTS.AUTO_CAPTIONER_MAX_TOKENS
    autoCaptionerCustomBaseUrl.value =
      allConfig.autoCaptioner?.custom?.baseUrl ?? DEFAULTS.AUTO_CAPTIONER_CUSTOM_BASE_URL
    autoCaptionerCustomModelName.value =
      allConfig.autoCaptioner?.custom?.modelName ?? DEFAULTS.AUTO_CAPTIONER_CUSTOM_MODEL_NAME
    autoCaptionerChatgptApiKey.value =
      allConfig.autoCaptioner?.chatgpt?.apiKey ?? DEFAULTS.AUTO_CAPTIONER_CHATGPT_API_KEY
    autoCaptionerChatgptModelName.value =
      allConfig.autoCaptioner?.chatgpt?.modelName ?? DEFAULTS.AUTO_CAPTIONER_CHATGPT_MODEL_NAME
  }
}

// Load settings on mount
onMounted(async () => {
  await loadSettings()
})

// Show/hide methods
const show = async (tab?: 'general' | 'autoCaptioner'): Promise<void> => {
  await loadSettings()
  if (tab) {
    activeTab.value = tab
  }
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

    // Get current auto captioner and update settings
    const currentAutoCaptioner = (await config.get(CONFIG_KEYS.AUTO_CAPTIONER)) || {}
    await config.set(CONFIG_KEYS.AUTO_CAPTIONER, {
      ...currentAutoCaptioner,
      provider: autoCaptionerProvider.value,
      systemPrompt: autoCaptionerSystemPrompt.value,
      temperature: autoCaptionerTemperature.value,
      maxTokens: autoCaptionerMaxTokens.value,
      custom: {
        baseUrl: autoCaptionerCustomBaseUrl.value,
        modelName: autoCaptionerCustomModelName.value
      },
      chatgpt: {
        apiKey: autoCaptionerChatgptApiKey.value,
        modelName: autoCaptionerChatgptModelName.value
      }
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
      autoCaptionerProvider.value = DEFAULTS.AUTO_CAPTIONER_PROVIDER
      autoCaptionerSystemPrompt.value = DEFAULTS.AUTO_CAPTIONER_SYSTEM_PROMPT
      autoCaptionerCustomBaseUrl.value = DEFAULTS.AUTO_CAPTIONER_CUSTOM_BASE_URL
      autoCaptionerCustomModelName.value = DEFAULTS.AUTO_CAPTIONER_CUSTOM_MODEL_NAME
      autoCaptionerChatgptApiKey.value = DEFAULTS.AUTO_CAPTIONER_CHATGPT_API_KEY
      autoCaptionerChatgptModelName.value = DEFAULTS.AUTO_CAPTIONER_CHATGPT_MODEL_NAME
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
    <div v-if="isVisible" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2>Preferences</h2>
          <button class="close-btn" title="Close" @click="hide">✕</button>
        </div>

        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'general' }"
            @click="activeTab = 'general'"
          >
            General
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'autoCaptioner' }"
            @click="activeTab = 'autoCaptioner'"
          >
            Auto Captioner
          </button>
        </div>

        <div class="modal-content">
          <!-- General Settings Tab -->
          <section v-if="activeTab === 'general'" class="settings-section">
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

          <!-- Auto Captioner Settings Tab -->
          <section v-if="activeTab === 'autoCaptioner'" class="settings-section">
            <div class="setting-row">
              <label for="provider">Provider</label>
              <select id="provider" v-model="autoCaptionerProvider" class="input-select">
                <option value="custom">Custom (OpenAI-compatible)</option>
                <option value="chatgpt">ChatGPT (OpenAI)</option>
              </select>
            </div>

            <!-- Custom Provider Settings -->
            <div v-if="autoCaptionerProvider === 'custom'" class="provider-settings">
              <div class="setting-row">
                <label for="baseUrl">Base URL</label>
                <input
                  id="baseUrl"
                  v-model="autoCaptionerCustomBaseUrl"
                  type="text"
                  class="input-text"
                  placeholder="http://127.0.0.1:1234/v1"
                />
              </div>
              <div class="setting-row">
                <label for="modelName">Model Name</label>
                <input
                  id="modelName"
                  v-model="autoCaptionerCustomModelName"
                  type="text"
                  class="input-text"
                  placeholder="llava:latest"
                />
              </div>
            </div>

            <!-- ChatGPT Provider Settings -->
            <div v-if="autoCaptionerProvider === 'chatgpt'" class="provider-settings">
              <div class="setting-row">
                <label for="chatgptApiKey">API Key</label>
                <input
                  id="chatgptApiKey"
                  v-model="autoCaptionerChatgptApiKey"
                  type="password"
                  class="input-text"
                  placeholder="sk-..."
                />
              </div>
              <div class="setting-row">
                <label for="chatgptModelName">Model Name</label>
                <input
                  id="chatgptModelName"
                  v-model="autoCaptionerChatgptModelName"
                  type="text"
                  class="input-text"
                  placeholder="gpt-4o"
                  list="chatgpt-models"
                />
                <datalist id="chatgpt-models">
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                </datalist>
              </div>
            </div>

            <!-- Generation Parameters -->
            <div class="settings-subsection">
              <h4 style="margin: 0 0 12px 0; font-size: 0.95em; color: var(--text-secondary)">
                Generation Parameters
              </h4>

              <div class="setting-row">
                <label for="temperature">
                  Temperature
                  <span style="color: var(--text-secondary); font-weight: normal">
                    ({{ autoCaptionerTemperature.toFixed(1) }})
                  </span>
                </label>
                <div style="display: flex; align-items: center; gap: 12px">
                  <span style="font-size: 0.85em; color: var(--text-secondary)">Factual</span>
                  <input
                    id="temperature"
                    v-model.number="autoCaptionerTemperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    style="flex: 1"
                  />
                  <span style="font-size: 0.85em; color: var(--text-secondary)">Creative</span>
                </div>
              </div>

              <div class="setting-row">
                <label for="maxTokens">Max Caption Length (tokens)</label>
                <input
                  id="maxTokens"
                  v-model.number="autoCaptionerMaxTokens"
                  type="number"
                  class="input-text"
                  min="50"
                  max="1000"
                  step="50"
                  placeholder="300"
                />
              </div>
            </div>

            <div class="setting-row setting-row-vertical">
              <label for="systemPrompt">System Prompt</label>
              <textarea
                id="systemPrompt"
                v-model="autoCaptionerSystemPrompt"
                class="input-textarea"
                rows="4"
                placeholder="Describe this image for AI training purposes. Be concise and objective."
              />
            </div>

            <!-- Info Boxes -->
            <div v-if="autoCaptionerProvider === 'custom'" class="info-box">
              <strong>📝 Custom LLM Setup:</strong>
              <ol style="margin: 8px 0 0 0; padding-left: 20px">
                <li>Make sure your LLM server is running (e.g., LM Studio, Ollama)</li>
                <li>Base URL should match your server: <code>http://127.0.0.1:1234/v1</code></li>
                <li>Model name: <code>llava:latest</code> (or your preferred model)</li>
              </ol>
              <div style="margin-top: 8px; font-size: 0.9em; opacity: 0.8">
                Note: LM Studio uses port 1234, Ollama uses port 11434
              </div>
            </div>

            <div v-if="autoCaptionerProvider === 'chatgpt'" class="info-box">
              <strong>🔑 OpenAI API Key:</strong>
              <div style="margin-top: 8px">
                Get your API key from
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  style="color: var(--accent-color)"
                  >platform.openai.com/api-keys</a
                >
              </div>
              <div style="margin-top: 8px; font-size: 0.9em; opacity: 0.8">
                Recommended: <code>gpt-4o</code> (best quality) or <code>gpt-4o-mini</code> (most
                affordable)
              </div>
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

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.95em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-color);
  border-bottom-color: var(--accent-color);
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

.setting-row-vertical {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
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
.input-select,
.input-text {
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  min-width: 120px;
  transition: border-color 0.2s;
}

.input-text {
  min-width: 200px;
  flex: 1;
}

.input-textarea {
  width: 100%;
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  resize: vertical;
  transition: border-color 0.2s;
  line-height: 1.4;
}

.input-number:focus,
.input-select:focus,
.input-text:focus,
.input-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.provider-settings {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 20px;
  border-left: 2px solid var(--border-color);
  margin: 8px 0;
}

.info-box {
  margin-top: 16px;
  padding: 12px;
  background: rgba(74, 158, 255, 0.1);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 6px;
  font-size: 0.85em;
  color: var(--text-secondary);
  line-height: 1.5;
}

.info-box strong {
  color: var(--text-primary);
}

.info-box code {
  background: var(--bg-hover);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9em;
  color: var(--accent-color);
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
