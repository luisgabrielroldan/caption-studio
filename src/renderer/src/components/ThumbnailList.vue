<script setup lang="ts">
import { watch, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import { useVideoThumbnail } from '../composables/useVideoThumbnail'

const store = useCaptionStore()
const thumbnailRefs = ref<HTMLDivElement[]>([])
const { extractThumbnail } = useVideoThumbnail()
const videoThumbnails = ref<{ [key: string]: string }>({}) // Map video path to thumbnail data URL

const selectImage = (index: number, event: MouseEvent): void => {
  // Prevent navigation if batch generation is active
  if (store.isBatchGenerating) {
    return
  }

  if (event.ctrlKey || event.metaKey) {
    // Ctrl+Click: Toggle selection
    store.toggleSelection(index)
    store.setCurrentIndex(index)
  } else if (event.shiftKey) {
    // Shift+Click: Select range
    const lastIndex = store.lastSelectedIndex ?? store.currentIndex
    store.selectRange(lastIndex, index)
    store.setCurrentIndex(index)
  } else {
    // Normal click: Set current + select single
    store.setCurrentIndex(index)
    store.selectSingle(index)
  }
}

// Handle Ctrl+A for select all
const handleKeyDown = (event: KeyboardEvent): void => {
  // Prevent selection if batch generation is active
  if (store.isBatchGenerating) {
    return
  }

  // Check if the event target is a text input - allow default behavior there
  const target = event.target as HTMLElement
  const isTextInput =
    target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable

  if ((event.ctrlKey || event.metaKey) && event.key === 'a' && store.hasImages && !isTextInput) {
    event.preventDefault()
    store.selectAll()
  }
}

// Load video thumbnail
const loadVideoThumbnail = async (videoPath: string): Promise<void> => {
  if (videoThumbnails.value[videoPath]) return // Already loaded

  try {
    const thumbnail = await extractThumbnail(videoPath)
    videoThumbnails.value[videoPath] = thumbnail
  } catch (error) {
    console.error('Failed to extract video thumbnail:', error)
  }
}

// Load all video thumbnails when images change
watch(
  () => store.images,
  (images) => {
    // Load thumbnails for all videos
    images.forEach((image) => {
      if (image.mediaType === 'video') {
        loadVideoThumbnail(image.path)
      }
    })
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Watch for changes in current index and scroll to keep it visible
watch(
  () => store.currentIndex,
  async (newIndex) => {
    if (newIndex >= 0 && thumbnailRefs.value[newIndex]) {
      await nextTick()
      thumbnailRefs.value[newIndex].scrollIntoView({
        behavior: 'auto',
        block: 'nearest'
      })
    }
  }
)
</script>

<template>
  <div class="thumbnail-list">
    <div v-if="!store.hasImages" class="empty-state">
      <p>No images loaded</p>
      <p class="hint">Press Ctrl/Cmd+O to open a folder</p>
    </div>
    <div v-else class="thumbnails-container">
      <div
        v-for="(image, index) in store.images"
        :key="image.id"
        :ref="
          (el) => {
            if (el) thumbnailRefs[index] = el as HTMLDivElement
          }
        "
        class="thumbnail-item"
        :class="{
          active: index === store.currentIndex,
          selected: store.selectedIndices.has(index),
          modified: store.modifiedImages.has(image.id),
          locked: store.isBatchGenerating
        }"
        :title="image.filename"
        @click="selectImage(index, $event)"
      >
        <div class="thumbnail-wrapper">
          <!-- Video Thumbnail -->
          <img
            v-if="image.mediaType === 'video' && videoThumbnails[image.path]"
            :src="videoThumbnails[image.path]"
            :alt="image.filename"
            draggable="false"
          />
          <!-- Image Thumbnail -->
          <img
            v-else-if="image.mediaType === 'image'"
            :src="`local-image://${encodeURIComponent(image.path)}`"
            :alt="image.filename"
            draggable="false"
          />
          <!-- Loading placeholder for videos without thumbnail yet -->
          <div v-else class="thumbnail-loading">
            <div class="loading-spinner-small"></div>
          </div>
          <!-- Video Badge -->
          <div v-if="image.mediaType === 'video'" class="video-badge">
            <span class="video-icon">▶</span>
          </div>
          <div v-if="store.selectedIndices.has(index)" class="selection-overlay">
            <div class="selection-checkmark">✓</div>
          </div>
          <div v-if="store.modifiedImages.has(image.id)" class="modified-indicator"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumbnail-list {
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  overflow-y: auto;
  overflow-x: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  padding: 20px;
  text-align: center;
}

.empty-state p {
  margin: 8px 0;
}

.empty-state .hint {
  font-size: 0.85em;
  color: var(--text-muted);
}

.thumbnails-container {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.thumbnail-item {
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.thumbnail-item.locked {
  cursor: not-allowed;
  opacity: 0.6;
  pointer-events: none;
}

.thumbnail-item:hover {
  border-color: var(--text-muted);
}

.thumbnail-item.active {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 1px var(--accent-color);
}

.thumbnail-item.selected {
  border-color: var(--accent-color);
}

.thumbnail-item.selected.active {
  box-shadow: 0 0 0 2px var(--accent-color);
}

.thumbnail-wrapper {
  width: 100%;
  aspect-ratio: 1;
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.thumbnail-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.video-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
  z-index: 1;
  backdrop-filter: blur(4px);
  pointer-events: none;
}

.video-icon {
  font-size: 8px;
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(74, 158, 255, 0.15);
  pointer-events: none;
  z-index: 1;
}

.selection-checkmark {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 20px;
  height: 20px;
  background: var(--accent-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.modified-indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 12px;
  height: 12px;
  background: var(--warning-color);
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

/* Scrollbar styling */
.thumbnail-list::-webkit-scrollbar {
  width: 8px;
}

.thumbnail-list::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.thumbnail-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

.thumbnail-list::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>
