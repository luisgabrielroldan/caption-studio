<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import { useConfig } from '../composables/useConfig'
import { useAutoCaptioner } from '../composables/useAutoCaptioner'
import { CONFIG_KEYS, DEFAULTS, EVENTS } from '../constants'

const store = useCaptionStore()
const config = useConfig()
const { isGenerating, generateCaption } = useAutoCaptioner()
const localCaption = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const dropdownOpen = ref(false)
const submenuOpen = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)
const submenuTriggerRef = ref<HTMLButtonElement | null>(null)
const submenuRef = ref<HTMLDivElement | null>(null)
const currentProvider = ref<'custom' | 'chatgpt'>('custom')
const submenuPosition = ref({ top: '0px', right: '0px' })

// Editor settings from config
const fontSize = ref(DEFAULTS.FONT_SIZE)
const lineHeight = ref(DEFAULTS.LINE_HEIGHT)

// Load editor settings
const loadEditorSettings = async (): Promise<void> => {
  const editorConfig = await config.get<{ fontSize?: number; lineHeight?: number }>(
    CONFIG_KEYS.EDITOR
  )
  if (editorConfig) {
    fontSize.value = editorConfig.fontSize ?? DEFAULTS.FONT_SIZE
    lineHeight.value = editorConfig.lineHeight ?? DEFAULTS.LINE_HEIGHT
  }
}

// Load provider setting
const loadProviderSetting = async (): Promise<void> => {
  const autoCaptionerConfig = await config.get<{ provider?: 'custom' | 'chatgpt' }>(
    CONFIG_KEYS.AUTO_CAPTIONER
  )
  if (autoCaptionerConfig?.provider) {
    currentProvider.value = autoCaptionerConfig.provider
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as Node
  const clickedInDropdown = dropdownRef.value && dropdownRef.value.contains(target)
  const clickedInSubmenu = submenuRef.value && submenuRef.value.contains(target)
  
  if (!clickedInDropdown && !clickedInSubmenu) {
    dropdownOpen.value = false
    submenuOpen.value = false
  }
}

onMounted(async () => {
  await loadEditorSettings()
  await loadProviderSetting()

  // Listen for settings updates
  window.addEventListener(EVENTS.SETTINGS_UPDATED, loadEditorSettings)
  window.addEventListener(EVENTS.SETTINGS_UPDATED, loadProviderSetting)
  // Listen for clicks outside dropdown
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener(EVENTS.SETTINGS_UPDATED, loadEditorSettings)
  window.removeEventListener(EVENTS.SETTINGS_UPDATED, loadProviderSetting)
  document.removeEventListener('mousedown', handleClickOutside)
})

// Watch for changes in current image and update local caption
watch(
  () => store.currentImage,
  (newImage) => {
    if (newImage) {
      localCaption.value = newImage.currentCaption
    } else {
      localCaption.value = ''
    }
  },
  { immediate: true }
)

// Update store when local caption changes
const updateCaption = (): void => {
  if (store.currentImage) {
    store.updateCurrentCaption(localCaption.value)
  }
}

// Revert current caption to original
const revertCaption = (): void => {
  if (store.currentImage) {
    localCaption.value = store.currentImage.originalCaption
    store.updateCurrentCaption(store.currentImage.originalCaption)
  }
}

// Generate caption (replace mode)
const handleGenerateCaption = async (): Promise<void> => {
  if (!store.currentImage) return

  const caption = await generateCaption(store.currentImage.path, 'replace', localCaption.value)
  if (caption !== null) {
    localCaption.value = caption
    store.updateCurrentCaption(caption)
  }
}

// Append generated caption
const handleAppendCaption = async (): Promise<void> => {
  if (!store.currentImage) return
  dropdownOpen.value = false

  const caption = await generateCaption(store.currentImage.path, 'append', localCaption.value)
  if (caption !== null) {
    localCaption.value = caption
    store.updateCurrentCaption(caption)
  }
}

// Toggle dropdown
const toggleDropdown = (): void => {
  dropdownOpen.value = !dropdownOpen.value
  submenuOpen.value = false
}

// Calculate submenu position
const updateSubmenuPosition = (): void => {
  if (submenuTriggerRef.value) {
    const rect = submenuTriggerRef.value.getBoundingClientRect()
    submenuPosition.value = {
      top: `${rect.top}px`,
      right: `${window.innerWidth - rect.left + 4}px`
    }
  }
}

// Change provider
const handleProviderChange = async (provider: 'custom' | 'chatgpt'): Promise<void> => {
  if (provider === currentProvider.value) {
    submenuOpen.value = false
    return
  }

  try {
    // Get current auto captioner config
    const currentConfig = (await config.get(CONFIG_KEYS.AUTO_CAPTIONER)) || {}
    // Update provider
    await config.set(CONFIG_KEYS.AUTO_CAPTIONER, {
      ...currentConfig,
      provider
    })
    // Update local state
    currentProvider.value = provider
    // Close submenu
    submenuOpen.value = false
    // Notify settings updated
    window.dispatchEvent(new CustomEvent(EVENTS.SETTINGS_UPDATED))
  } catch (error) {
    console.error('Error changing provider:', error)
  }
}

// Open settings dialog on Auto Captioner tab
const openAutoCaptionerSettings = (): void => {
  dropdownOpen.value = false
  // Dispatch custom event to open settings
  window.dispatchEvent(
    new CustomEvent('open-settings', { detail: { tab: 'autoCaptioner' } })
  )
}

// Expose focus method for parent component
const focusTextarea = (): void => {
  textareaRef.value?.focus()
}

// Expose to parent via defineExpose
defineExpose({
  focusTextarea
})
</script>

<template>
  <div class="caption-editor">
    <div class="editor-header">
      <span class="editor-title">Caption</span>
      <div class="header-actions">
        <!-- Split Button for Generate Caption -->
        <div ref="dropdownRef" class="split-button-group">
          <button
            class="action-btn split-btn-main"
            :disabled="!store.currentImage || isGenerating"
            title="Generate new caption (replaces existing)"
            @click="handleGenerateCaption"
          >
            <span v-if="isGenerating" class="spinner"></span>
            <span v-else>✨</span>
            Generate
          </button>
          <button
            class="action-btn split-btn-toggle"
            :disabled="!store.currentImage || isGenerating"
            :class="{ active: dropdownOpen }"
            title="More options"
            @click="toggleDropdown"
          >
            <span class="chevron">▼</span>
          </button>
          
          <!-- Dropdown Menu -->
          <Transition name="dropdown">
            <div v-if="dropdownOpen" class="dropdown-menu">
              <button class="dropdown-item" @click="handleAppendCaption">
                <span class="dropdown-icon">➕</span>
                Append to Caption
              </button>
              <div class="dropdown-divider"></div>
              
              <!-- Provider Submenu Item -->
              <div
                class="submenu-container"
                @mouseenter="submenuOpen = true; updateSubmenuPosition()"
                @mouseleave="submenuOpen = false"
              >
                <button ref="submenuTriggerRef" class="dropdown-item submenu-trigger">
                  <span class="dropdown-icon">◆</span>
                  Provider
                  <span class="submenu-arrow">◀</span>
                </button>
              </div>
              
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" @click="openAutoCaptionerSettings">
                <span class="dropdown-icon">⚙</span>
                Settings...
              </button>
            </div>
          </Transition>
        </div>

        <button
          v-if="store.currentImage && store.modifiedImages.has(store.currentImage.id)"
          class="modified-badge"
          title="Click to revert changes"
          @click="revertCaption"
        >
          <span class="badge-text">Modified</span>
          <span class="badge-text-hover">Undo</span>
        </button>
      </div>
    </div>

    <!-- Provider Submenu (Portal to body level) -->
    <Transition name="submenu">
      <div
        v-if="submenuOpen"
        ref="submenuRef"
        class="submenu"
        :style="submenuPosition"
        @mouseenter="submenuOpen = true"
        @mouseleave="submenuOpen = false"
      >
        <button
          class="submenu-item"
          :class="{ active: currentProvider === 'custom' }"
          @click="handleProviderChange('custom')"
        >
          <span class="radio-indicator">{{ currentProvider === 'custom' ? '●' : '○' }}</span>
          Custom (OpenAI-comp.)
        </button>
        <button
          class="submenu-item"
          :class="{ active: currentProvider === 'chatgpt' }"
          @click="handleProviderChange('chatgpt')"
        >
          <span class="radio-indicator">{{ currentProvider === 'chatgpt' ? '●' : '○' }}</span>
          ChatGPT (OpenAI)
        </button>
      </div>
    </Transition>
    <textarea
      ref="textareaRef"
      v-model="localCaption"
      placeholder="Enter caption for this image..."
      :disabled="!store.currentImage"
      class="caption-textarea"
      :style="{ fontSize: `${fontSize}px`, lineHeight: lineHeight }"
      @input="updateCaption"
    />
  </div>
</template>

<style scoped>
.caption-editor {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  height: 200px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
}

.editor-title {
  font-size: 0.9em;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

/* Split Button Group */
.split-button-group {
  position: relative;
  display: flex;
  align-items: stretch;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--accent-color);
  color: #fff;
  border: none;
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.action-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Split Button Main */
.split-btn-main {
  border-radius: 4px 0 0 4px;
  padding-right: 10px;
}

/* Split Button Toggle */
.split-btn-toggle {
  border-radius: 0 4px 4px 0;
  padding: 6px 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  min-width: unset;
}

.split-btn-toggle .chevron {
  font-size: 0.7em;
  transition: transform 0.2s;
}

.split-btn-toggle.active .chevron {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 10px;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.85em;
  line-height: 1.4;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  min-height: 28px;
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-item:active {
  background: var(--bg-tertiary);
}

.dropdown-icon {
  font-size: 1em;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0;
}

/* Submenu Container */
.submenu-container {
  position: relative;
  display: block;
}

/* Submenu Trigger */
.submenu-trigger {
  width: 100%;
  position: relative;
}

.submenu-arrow {
  font-size: 0.8em;
  margin-left: auto;
  opacity: 0.5;
}

/* Submenu */
.submenu {
  position: fixed;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  z-index: 1002;
  overflow: hidden;
  pointer-events: auto;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.85em;
  line-height: 1.4;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  min-height: 28px;
}

.submenu-item:hover:not(:disabled) {
  background: var(--bg-hover);
}

.submenu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submenu-item.active {
  background: rgba(74, 158, 255, 0.15);
}

.radio-indicator {
  font-size: 0.9em;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Submenu Transition */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.15s ease;
}

.submenu-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.submenu-leave-to {
  opacity: 0;
  transform: translateX(4px);
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modified-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75em;
  padding: 4px 10px;
  min-width: 70px;
  background: rgba(255, 165, 0, 0.15);
  color: var(--warning-color);
  border: 1px solid rgba(255, 165, 0, 0.4);
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.modified-badge:hover {
  background: rgba(255, 68, 68, 0.2);
  border-color: #ff4444;
  color: #ff4444;
}

.modified-badge:active {
  transform: scale(0.95);
  background: rgba(255, 68, 68, 0.3);
}

.badge-text,
.badge-text-hover {
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  min-width: 48px;
  text-align: center;
}

.badge-text-hover {
  position: absolute;
  opacity: 0;
  left: 50%;
  transform: translateX(-50%);
}

.modified-badge:hover .badge-text {
  opacity: 0;
}

.modified-badge:hover .badge-text-hover {
  opacity: 1;
}

.caption-textarea {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.caption-textarea:focus {
  border-color: var(--accent-color);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(74, 158, 255, 0.15);
}

.caption-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.caption-textarea::placeholder {
  color: var(--text-muted);
}

.caption-textarea::-webkit-scrollbar {
  width: 8px;
}

.caption-textarea::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.caption-textarea::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

.caption-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>
