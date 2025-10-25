<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import { useCanvasImageViewer } from '../composables/useCanvasImageViewer'
import { formatFileSize } from '../utils/formatters'
import VideoPreview from './VideoPreview.vue'

const store = useCaptionStore()

// Canvas-based image viewer
const {
  canvasRef,
  containerRef,
  zoom,
  isLoading,
  isDragging,
  loadedImage,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  resetView
} = useCanvasImageViewer({
  currentImage: computed(() => store.currentImage)
})

const isZoomed = computed(() => zoom.value > 1.01)

const cursorStyle = computed(() => {
  if (!isZoomed.value) return 'default'
  return isDragging.value ? 'grabbing' : 'grab'
})

const imageInfo = computed(() => {
  if (!store.currentImage) return null

  const info: {
    filename: string
    position: string
    dimensions?: string
    fileSize?: string
  } = {
    filename: store.currentImage.filename,
    position: `${store.currentIndex + 1} / ${store.totalImages}`
  }

  // Get dimensions from loaded image
  if (loadedImage.value) {
    info.dimensions = `${loadedImage.value.naturalWidth} × ${loadedImage.value.naturalHeight}`
  }

  // Get file size from store
  if (store.currentImage.size) {
    info.fileSize = formatFileSize(store.currentImage.size)
  }

  return info
})

// Show zoom level when zoomed
const zoomPercent = computed(() => {
  return Math.round(zoom.value * 100)
})

// Handle video duration loaded
const handleDurationLoaded = (duration: number): void => {
  if (store.currentImage) {
    store.currentImage.duration = duration
  }
}

// Reference to VideoPreview component
const videoPreviewRef = ref<InstanceType<typeof VideoPreview> | null>(null)

// Capture current video frame (delegates to VideoPreview)
const captureVideoFrame = async (): Promise<string | null> => {
  if (store.isCurrentMediaVideo && videoPreviewRef.value) {
    try {
      return await videoPreviewRef.value.captureCurrentFrame()
    } catch (error) {
      console.error('[ImagePreview] Failed to capture video frame:', error)
      return null
    }
  }
  return null
}

// Expose to parent component
defineExpose({
  captureVideoFrame
})
</script>

<template>
  <div class="image-preview">
    <div v-if="!store.currentImage" class="empty-preview">
      <p>No media selected</p>
    </div>
    <div v-else-if="store.currentImage.mediaType === 'video'" class="preview-container">
      <VideoPreview
        ref="videoPreviewRef"
        :video-path="store.currentImage.path"
        :filename="store.currentImage.filename"
        :position="`${store.currentIndex + 1} / ${store.totalImages}`"
        :file-size="store.currentImage.size"
        @duration-loaded="handleDurationLoaded"
      />
    </div>
    <div v-else class="preview-container">
      <div class="preview-wrapper-outer">
        <div
          ref="containerRef"
          class="canvas-container"
          @wheel="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
        >
          <canvas ref="canvasRef" :style="{ cursor: cursorStyle }" />
          <div v-if="isLoading" class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
        </div>
        <div v-if="isZoomed" class="zoom-indicator" title="Click to reset zoom" @click="resetView">
          {{ zoomPercent }}%
        </div>
      </div>
      <div class="image-info">
        <span class="image-position">{{ imageInfo?.position }}</span>
        <span class="image-filename" :title="imageInfo?.filename">{{ imageInfo?.filename }}</span>
        <div v-if="imageInfo?.dimensions || imageInfo?.fileSize" class="image-metadata">
          <span v-if="imageInfo?.dimensions" class="metadata-item">{{ imageInfo.dimensions }}</span>
          <span v-if="imageInfo?.fileSize" class="metadata-item">{{ imageInfo.fileSize }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-wrapper-outer {
  flex: 1;
  position: relative;
  min-height: 0;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
}

.canvas-container canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.zoom-indicator {
  position: absolute;
  bottom: 20px;
  left: 20px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: 1px solid var(--text-muted);
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  backdrop-filter: blur(10px);
  z-index: 10;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.zoom-indicator:hover {
  background: rgba(0, 0, 0, 0.85);
  border-color: var(--accent-color);
  transform: scale(1.05);
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  gap: 12px;
}

.image-position {
  font-size: 0.9em;
  color: var(--text-tertiary);
  font-weight: 500;
  white-space: nowrap;
}

.image-filename {
  font-size: 0.85em;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: center;
  min-width: 0; /* Allow flex item to shrink below content size */
  padding: 0 8px; /* Add some breathing room */
}

.image-metadata {
  display: flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

.metadata-item {
  font-size: 0.8em;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: 1px 4px;
  background: var(--bg-hover);
  border-radius: 3px;
  border: 1px solid var(--border-color);
}
</style>
