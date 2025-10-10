<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useCaptionStore } from './stores/captionStore'
import { useFileOperations } from './composables/useFileOperations'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useResizableSplitter } from './composables/useResizableSplitter'
import { useConfig } from './composables/useConfig'
import { useVeil } from './composables/useVeil'
import { useTheme } from './composables/useTheme'
import { useDialog } from './composables/useDialog'
import { registerIpcListener } from './utils/ipc'
import { CONFIG_KEYS, MENU_EVENTS } from './constants'
import TopBar from './components/TopBar.vue'
import ThumbnailList from './components/ThumbnailList.vue'
import ImagePreview from './components/ImagePreview.vue'
import CaptionEditor from './components/CaptionEditor.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import AppDialog from './components/AppDialog.vue'

const store = useCaptionStore()
const config = useConfig()
const { showConfirm } = useDialog()
const captionEditorRef = ref<InstanceType<typeof CaptionEditor> | null>(null)
const settingsDialogRef = ref<InstanceType<typeof SettingsDialog> | null>(null)

// File operations
const { openFolder, saveCaptions, closeFolder } = useFileOperations()

// Resizable splitter
const {
  width: thumbnailWidth,
  isDragging: isDraggingSplitter,
  handleSplitterMouseDown
} = useResizableSplitter()

// Veil feature (hide to system tray)
useVeil()

// Theme management
useTheme()

// Handle menu event for showing preferences
const handleShowPreferences = (): void => {
  settingsDialogRef.value?.show()
}

// Handle reset changes
const handleResetChanges = async (): Promise<void> => {
  if (!store.hasUnsavedChanges) {
    await showConfirm('No changes to discard.', 'No Changes', 'OK')
    return
  }

  const confirmed = await showConfirm(
    `Are you sure you want to discard all ${store.modifiedImages.size} unsaved changes?\n\nThis cannot be undone.`,
    'Discard Changes',
    'Discard',
    'Cancel'
  )

  if (confirmed) {
    store.resetChanges()
  }
}

// Keyboard shortcuts
useKeyboardShortcuts({
  onFocusEditor: (): void => captionEditorRef.value?.focusTextarea(),
  onOpenFolder: openFolder,
  onSaveCaptions: () => saveCaptions(false), // No alert for keyboard shortcut
  onResetChanges: handleResetChanges,
  onCloseFolder: closeFolder,
  onShowPreferences: handleShowPreferences
})

let cleanupIpcListener: (() => void) | null = null

onMounted(async () => {
  // Expose functions for tray menu
  window.__hasUnsavedChanges = () => store.hasUnsavedChanges
  window.__saveChanges = async () => {
    await saveCaptions(false)
  }

  // Auto-open last folder if enabled
  const behavior = await config.get<{
    rememberLastFolder?: boolean
    lastOpenedFolder?: string
  }>(CONFIG_KEYS.BEHAVIOR)
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

  // Listen for preferences menu event
  cleanupIpcListener = registerIpcListener(MENU_EVENTS.SHOW_PREFERENCES, handleShowPreferences)
})

onUnmounted(() => {
  // Clean up IPC listener
  if (cleanupIpcListener) {
    cleanupIpcListener()
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

    <!-- App Dialog -->
    <AppDialog />
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
