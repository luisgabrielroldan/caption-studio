<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCaptionStore } from '../stores/captionStore'

const store = useCaptionStore()
const localCaption = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

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
const updateCaption = () => {
  if (store.currentImage) {
    store.updateCurrentCaption(localCaption.value)
  }
}

// Expose focus method for parent component
const focusTextarea = () => {
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
      <span v-if="store.currentImage && store.modifiedImages.has(store.currentImage.id)" class="modified-badge">
        Modified
      </span>
    </div>
    <textarea
      ref="textareaRef"
      v-model="localCaption"
      @input="updateCaption"
      placeholder="Enter caption for this image..."
      :disabled="!store.currentImage"
      class="caption-textarea"
    />
  </div>
</template>

<style scoped>
.caption-editor {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-top: 1px solid #333;
  height: 200px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #333;
}

.editor-title {
  font-size: 0.9em;
  font-weight: 600;
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modified-badge {
  font-size: 0.75em;
  padding: 3px 8px;
  background: #ffa500;
  color: #000;
  border-radius: 3px;
  font-weight: 600;
}

.caption-textarea {
  flex: 1;
  padding: 16px 20px;
  background: #252525;
  color: #ddd;
  border: none;
  resize: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.95em;
  line-height: 1.6;
  outline: none;
}

.caption-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.caption-textarea::placeholder {
  color: #555;
}

.caption-textarea::-webkit-scrollbar {
  width: 8px;
}

.caption-textarea::-webkit-scrollbar-track {
  background: #252525;
}

.caption-textarea::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.caption-textarea::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

