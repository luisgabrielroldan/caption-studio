<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useCaptionStore } from './stores/captionStore'
import { useFileOperations } from './composables/useFileOperations'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useResizableSplitter } from './composables/useResizableSplitter'
import { useConfig } from './composables/useConfig'
import TopBar from './components/TopBar.vue'
import ThumbnailList from './components/ThumbnailList.vue'
import ImagePreview from './components/ImagePreview.vue'
import CaptionEditor from './components/CaptionEditor.vue'
import SettingsDialog from './components/SettingsDialog.vue'

const store = useCaptionStore()
const config = useConfig()
const captionEditorRef = ref<InstanceType<typeof CaptionEditor> | null>(null)
const settingsDialogRef = ref<InstanceType<typeof SettingsDialog> | null>(null)
const currentTheme = ref<'dark' | 'light' | 'system'>('dark')

// File operations
const { openFolder, saveCaptions, closeFolder } = useFileOperations()

// Resizable splitter
const { width: thumbnailWidth, isDragging: isDraggingSplitter, handleSplitterMouseDown } =
  useResizableSplitter()

// Handle menu event for showing preferences
const handleShowPreferences = () => {
  settingsDialogRef.value?.show()
}

// Handle reset changes
const handleResetChanges = () => {
  if (!store.hasUnsavedChanges) {
    alert('No changes to discard.')
    return
  }
  
  const confirmed = confirm(
    `Are you sure you want to discard all ${store.modifiedImages.size} unsaved changes?\n\nThis cannot be undone.`
  )
  
  if (confirmed) {
    store.resetChanges()
  }
}

// Theme management
const getEffectiveTheme = (): 'dark' | 'light' => {
  if (currentTheme.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return currentTheme.value
}

const applyTheme = () => {
  const effectiveTheme = getEffectiveTheme()
  document.documentElement.setAttribute('data-theme', effectiveTheme)
}

// Load theme from config
const loadTheme = async () => {
  const uiConfig = await config.get('ui')
  if (uiConfig?.theme) {
    currentTheme.value = uiConfig.theme
    applyTheme()
  }
}

// Watch for system theme changes
const systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const handleSystemThemeChange = () => {
  if (currentTheme.value === 'system') {
    applyTheme()
  }
}

// Listen for theme updates from settings dialog
const handleThemeUpdate = async () => {
  await loadTheme()
}

// Keyboard shortcuts
useKeyboardShortcuts({
  onFocusEditor: () => captionEditorRef.value?.focusTextarea(),
  onOpenFolder: openFolder,
  onSaveCaptions: () => saveCaptions(false), // No alert for keyboard shortcut
  onResetChanges: handleResetChanges,
  onCloseFolder: closeFolder,
  onShowPreferences: handleShowPreferences
})

// Warn before closing with unsaved changes
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (store.hasUnsavedChanges) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // Load and apply theme
  await loadTheme()
  
  // Auto-open last folder if enabled
  const behavior = await config.get('behavior')
  if (behavior?.rememberLastFolder && behavior?.lastOpenedFolder) {
    try {
      // Simulate opening the last folder
      const result = await window.api.openFolder(behavior.lastOpenedFolder)
      if (result) {
        store.setFolderPath(result.folderPath)
        store.setImages(result.images)
      }
    } catch (error) {
      console.error('Failed to open last folder:', error)
    }
  }
  
  // Listen for system theme changes
  systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange)
  
  // Listen for theme updates from settings (custom event)
  window.addEventListener('theme-updated', handleThemeUpdate)
  
  // Listen for preferences menu event
  // @ts-ignore
  if (window.electron?.ipcRenderer) {
    // @ts-ignore
    window.electron.ipcRenderer.on('menu:show-preferences', handleShowPreferences)
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  systemThemeMediaQuery.removeEventListener('change', handleSystemThemeChange)
  window.removeEventListener('theme-updated', handleThemeUpdate)
  
  // Clean up preferences listener
  // @ts-ignore
  if (window.electron?.ipcRenderer?.removeAllListeners) {
    // @ts-ignore
    window.electron.ipcRenderer.removeAllListeners('menu:show-preferences')
  }
})
</script>

<template>
  <div class="app-container" :class="{ 'dragging-splitter': isDraggingSplitter }">
    <TopBar />
    <div class="main-content">
      <div class="thumbnail-panel" :style="{ width: `${thumbnailWidth}px` }">
        <ThumbnailList />
      </div>
      <div 
        class="splitter" 
        :class="{ dragging: isDraggingSplitter }"
        @mousedown="handleSplitterMouseDown"
      ></div>
      <div class="content-area">
        <ImagePreview />
        <CaptionEditor ref="captionEditorRef" />
      </div>
    </div>
    
    <!-- Settings Dialog -->
    <SettingsDialog ref="settingsDialogRef" />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.app-container.dragging-splitter {
  cursor: col-resize;
  user-select: none;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.thumbnail-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 200px;
  max-width: 600px;
}

.splitter {
  width: 4px;
  background: var(--bg-hover);
  cursor: col-resize;
  transition: background 0.2s;
  flex-shrink: 0;
}

.splitter:hover,
.splitter.dragging {
  background: var(--accent-color);
}

.content-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}
</style>
