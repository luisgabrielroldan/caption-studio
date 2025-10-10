<script setup lang="ts">
import { computed } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import { useImageZoom } from '../composables/useImageZoom'

const store = useCaptionStore()

// Image zoom and pan logic
const {
  zoom,
  transformOrigin,
  imageRef,
  wrapperRef,
  panX,
  panY,
  isZoomed,
  cursorStyle,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleMouseLeave,
  resetZoom
} = useImageZoom({
  currentImage: computed(() => store.currentImage)
})

const imageUrl = computed(() => {
  if (!store.currentImage) return null
  return `local-image://${encodeURIComponent(store.currentImage.path)}`
})

const imageInfo = computed(() => {
  if (!store.currentImage) return null
  return {
    filename: store.currentImage.filename,
    position: `${store.currentIndex + 1} / ${store.totalImages}`
  }
})
</script>

<template>
  <div class="image-preview">
    <div v-if="!store.currentImage" class="empty-preview">
      <p>No image selected</p>
    </div>
    <div v-else class="preview-container">
      <div class="preview-wrapper-outer">
        <div
          ref="wrapperRef"
          class="preview-wrapper"
          @wheel="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
        >
          <img
            ref="imageRef"
            :src="imageUrl || ''"
            :alt="imageInfo?.filename"
            draggable="false"
            :style="{
              transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`,
              transformOrigin: transformOrigin,
              cursor: cursorStyle,
              willChange: isZoomed ? 'transform' : 'auto'
            }"
          />
        </div>
        <button v-if="isZoomed" title="Reset zoom (1:1)" class="reset-zoom-btn" @click="resetZoom">
          Reset Zoom
        </button>
      </div>
      <div class="image-info">
        <span class="image-position">{{ imageInfo?.position }}</span>
        <span class="image-filename" :title="imageInfo?.filename">{{ imageInfo?.filename }}</span>
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

.preview-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.preview-wrapper {
  user-select: none;
}

.preview-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 4px;
  transition: none;
  /* High-quality image rendering for photos */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: auto;
}

.reset-zoom-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: 1px solid var(--text-muted);
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.reset-zoom-btn:hover {
  background: rgba(0, 0, 0, 0.85);
  border-color: var(--accent-color);
  transform: scale(1.05);
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  gap: 16px;
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
  text-align: right;
}
</style>
