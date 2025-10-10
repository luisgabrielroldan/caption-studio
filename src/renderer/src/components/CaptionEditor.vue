<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import { useConfig } from '../composables/useConfig'

const store = useCaptionStore()
const config = useConfig()
const localCaption = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Editor settings from config
const fontSize = ref(14)
const lineHeight = ref(1.6)

// Load editor settings
const loadEditorSettings = async (): Promise<void> => {
  const editorConfig = await config.get<{ fontSize?: number; lineHeight?: number }>('editor')
  if (editorConfig) {
    fontSize.value = editorConfig.fontSize ?? 14
    lineHeight.value = editorConfig.lineHeight ?? 1.6
  }
}

onMounted(async () => {
  await loadEditorSettings()

  // Listen for settings updates
  window.addEventListener('settings-updated', loadEditorSettings)
})

onUnmounted(() => {
  window.removeEventListener('settings-updated', loadEditorSettings)
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
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
}

.editor-title {
  font-size: 0.9em;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  padding: 16px 20px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: none;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
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
