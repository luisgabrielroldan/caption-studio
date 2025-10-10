<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useCaptionStore } from './stores/captionStore'
import TopBar from './components/TopBar.vue'
import ThumbnailList from './components/ThumbnailList.vue'
import ImagePreview from './components/ImagePreview.vue'
import CaptionEditor from './components/CaptionEditor.vue'

const store = useCaptionStore()
const captionEditorRef = ref<InstanceType<typeof CaptionEditor> | null>(null)

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
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="app-container">
    <TopBar />
    <div class="main-content">
      <ThumbnailList />
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

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.content-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}
</style>
