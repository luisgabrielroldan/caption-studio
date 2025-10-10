<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useCaptionStore } from './stores/captionStore'
import { useFileOperations } from './composables/useFileOperations'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useResizableSplitter } from './composables/useResizableSplitter'
import TopBar from './components/TopBar.vue'
import ThumbnailList from './components/ThumbnailList.vue'
import ImagePreview from './components/ImagePreview.vue'
import CaptionEditor from './components/CaptionEditor.vue'

const store = useCaptionStore()
const captionEditorRef = ref<InstanceType<typeof CaptionEditor> | null>(null)

// File operations
const { openFolder, saveCaptions, closeFolder } = useFileOperations()

// Resizable splitter
const { width: thumbnailWidth, isDragging: isDraggingSplitter, handleSplitterMouseDown } =
  useResizableSplitter()

// Keyboard shortcuts
useKeyboardShortcuts({
  onFocusEditor: () => captionEditorRef.value?.focusTextarea(),
  onOpenFolder: openFolder,
  onSaveCaptions: () => saveCaptions(false), // No alert for keyboard shortcut
  onCloseFolder: closeFolder
})

// Warn before closing with unsaved changes
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (store.hasUnsavedChanges) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
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
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #1a1a1a;
  color: #fff;
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
  background: #2a2a2a;
  cursor: col-resize;
  transition: background 0.2s;
  flex-shrink: 0;
}

.splitter:hover,
.splitter.dragging {
  background: #4a9eff;
}

.content-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}
</style>
