<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCaptionStore } from '../stores/captionStore'

const store = useCaptionStore()
const zoom = ref(1)
const maxZoom = 5
const transformOrigin = ref('center center')
const imageRef = ref<HTMLImageElement | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

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

const isZoomed = computed(() => zoom.value > 1.01)

const cursorStyle = computed(() => {
  if (!isZoomed.value) return 'default'
  return isDragging.value ? 'grabbing' : 'grab'
})

// Reset zoom when image changes
watch(() => store.currentImage, () => {
  zoom.value = 1
  transformOrigin.value = 'center center'
  panX.value = 0
  panY.value = 0
})

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  if (!imageRef.value) return
  
  // Get mouse position relative to the image
  const rect = imageRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  // Calculate percentage position
  const percentX = (x / rect.width) * 100
  const percentY = (y / rect.height) * 100
  
  // Set transform origin to mouse position
  transformOrigin.value = `${percentX}% ${percentY}%`
  
  // Apply zoom with minimum of 1 (100% - never smaller than viewport fit)
  const delta = -event.deltaY * 0.001
  const newZoom = Math.min(maxZoom, Math.max(1, zoom.value + delta))
  zoom.value = newZoom
  
  // Reset pan if zoomed out to 1
  if (zoom.value === 1) {
    panX.value = 0
    panY.value = 0
  }
}

const handleMouseDown = (event: MouseEvent) => {
  if (!isZoomed.value) return
  
  isDragging.value = true
  dragStart.value = {
    x: event.clientX - panX.value,
    y: event.clientY - panY.value
  }
  event.preventDefault()
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !imageRef.value || !wrapperRef.value) return
  
  const newPanX = event.clientX - dragStart.value.x
  const newPanY = event.clientY - dragStart.value.y
  
  // Get the current bounding rectangles
  const wrapperRect = wrapperRef.value.getBoundingClientRect()
  
  // Calculate the natural (unzoomed, unpanned) image dimensions
  const naturalWidth = imageRef.value.naturalWidth
  const naturalHeight = imageRef.value.naturalHeight
  
  // Calculate how the image fits in the container (object-fit: contain behavior)
  const containerRatio = wrapperRect.width / wrapperRect.height
  const imageRatio = naturalWidth / naturalHeight
  
  let displayWidth, displayHeight
  if (imageRatio > containerRatio) {
    // Image is wider - fits by width
    displayWidth = wrapperRect.width
    displayHeight = wrapperRect.width / imageRatio
  } else {
    // Image is taller - fits by height
    displayHeight = wrapperRect.height
    displayWidth = wrapperRect.height * imageRatio
  }
  
  // Apply zoom to get actual displayed size
  const zoomedWidth = displayWidth * zoom.value
  const zoomedHeight = displayHeight * zoom.value
  
  // Calculate how much overflow we have (how much bigger the image is than viewport)
  const overflowX = Math.max(0, zoomedWidth - wrapperRect.width)
  const overflowY = Math.max(0, zoomedHeight - wrapperRect.height)
  
  // Maximum pan is half the overflow (we can pan half left, half right)
  const maxPanX = overflowX / 2
  const maxPanY = overflowY / 2
  
  // Clamp pan values to prevent showing empty space beyond image edges
  panX.value = Math.max(-maxPanX, Math.min(maxPanX, newPanX))
  panY.value = Math.max(-maxPanY, Math.min(maxPanY, newPanY))
}

const handleMouseUp = () => {
  isDragging.value = false
}

const resetZoom = () => {
  zoom.value = 1
  transformOrigin.value = 'center center'
  panX.value = 0
  panY.value = 0
}
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
          @mouseleave="handleMouseUp"
        >
          <img 
            ref="imageRef"
            :src="imageUrl" 
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
        <button v-if="isZoomed" class="reset-zoom-btn" @click="resetZoom" title="Reset zoom (1:1)">
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
  background: #252525;
  overflow: hidden;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
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
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.reset-zoom-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: 1px solid #555;
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
  border-color: #0078d4;
  transform: scale(1.05);
}

.image-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #1e1e1e;
  border-top: 1px solid #333;
  gap: 16px;
}

.image-position {
  font-size: 0.9em;
  color: #888;
  font-weight: 500;
  white-space: nowrap;
}

.image-filename {
  font-size: 0.85em;
  color: #aaa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: right;
}
</style>

