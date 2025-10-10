<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useCaptionStore } from './stores/captionStore'
import TopBar from './components/TopBar.vue'
import ThumbnailList from './components/ThumbnailList.vue'
import ImagePreview from './components/ImagePreview.vue'
import CaptionEditor from './components/CaptionEditor.vue'

const store = useCaptionStore()
const captionEditorRef = ref<InstanceType<typeof CaptionEditor> | null>(null)

// Resizable panel state
const thumbnailWidth = ref(280) // Default width in pixels
const minWidth = 200
const maxWidth = 600
const isDraggingSplitter = ref(false)

// Splitter drag handlers
const handleSplitterMouseDown = (event: MouseEvent) => {
  isDraggingSplitter.value = true
  event.preventDefault()
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDraggingSplitter.value) return
  
  const newWidth = event.clientX
  if (newWidth >= minWidth && newWidth <= maxWidth) {
    thumbnailWidth.value = newWidth
  }
}

const handleMouseUp = () => {
  if (isDraggingSplitter.value) {
    isDraggingSplitter.value = false
    // Save width to localStorage
    localStorage.setItem('thumbnailPanelWidth', thumbnailWidth.value.toString())
  }
}

// Keyboard shortcuts handler
const handleKeyDown = async (event: KeyboardEvent) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey

  // Check if we're in a text input
  const target = event.target as HTMLElement
  const isTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT'

  // Navigation shortcuts (work anywhere except when typing in text input)
  if (event.key === 'ArrowUp' || event.key === 'k') {
    if (!isTextInput || event.ctrlKey || event.metaKey) {
      event.preventDefault()
      store.previousImage()
    }
  } else if (event.key === 'ArrowDown' || event.key === 'j') {
    if (!isTextInput || event.ctrlKey || event.metaKey) {
      event.preventDefault()
      store.nextImage()
    }
  }
  // Home/End to jump to first/last image
  else if (event.key === 'Home') {
    if (!isTextInput || event.ctrlKey || event.metaKey) {
      event.preventDefault()
      if (store.totalImages > 0) {
        store.setCurrentIndex(0)
      }
    }
  } else if (event.key === 'End') {
    if (!isTextInput || event.ctrlKey || event.metaKey) {
      event.preventDefault()
      if (store.totalImages > 0) {
        store.setCurrentIndex(store.totalImages - 1)
      }
    }
  }
  // Tab to focus caption editor
  else if (event.key === 'Tab' && !isTextInput) {
    event.preventDefault()
    captionEditorRef.value?.focusTextarea()
  }
  // Cmd/Ctrl+Enter to toggle focus between navigation and editor
  else if (event.key === 'Enter' && cmdOrCtrl) {
    event.preventDefault()
    if (isTextInput) {
      target.blur()
    } else {
      captionEditorRef.value?.focusTextarea()
    }
  }
  // Escape to unfocus textarea
  else if (event.key === 'Escape' && isTextInput) {
    target.blur()
  }
  // Ctrl/Cmd+O: Open folder
  else if (cmdOrCtrl && event.key === 'o') {
    event.preventDefault()
    const result = await window.api.openFolder()
    if (result) {
      store.setFolderPath(result.folderPath)
      store.setImages(result.images)
    }
  }
  // Ctrl/Cmd+S: Save all
  else if (cmdOrCtrl && event.key === 's') {
    event.preventDefault()
    if (store.hasUnsavedChanges) {
      try {
        const updates = store.images
          .filter(img => img.originalCaption !== img.currentCaption)
          .map(img => ({
            captionPath: img.captionPath,
            caption: img.currentCaption
          }))

        await window.api.saveCaptions(updates)
        store.markAsSaved()
        console.log('Captions saved successfully')
      } catch (error) {
        console.error('Error saving captions:', error)
        alert(`Error saving captions: ${error}`)
      }
    }
  }
  // Ctrl/Cmd+W: Close folder
  else if (cmdOrCtrl && event.key === 'w') {
    event.preventDefault()
    if (store.hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?')
      if (!confirmed) return
    }
    store.clearAll()
  }
}

// Warn before closing with unsaved changes
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (store.hasUnsavedChanges) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => {
  const savedWidth = localStorage.getItem('thumbnailPanelWidth')
  if (savedWidth) {
    const width = parseInt(savedWidth, 10)
    if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
      thumbnailWidth.value = width
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
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
