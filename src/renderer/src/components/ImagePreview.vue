<script setup lang="ts">
import { computed } from 'vue'
import { useCaptionStore } from '../stores/captionStore'

const store = useCaptionStore()

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
      <div class="preview-wrapper">
        <img :src="imageUrl" :alt="imageInfo?.filename" />
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

.preview-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  min-height: 0;
}

.preview-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  border-radius: 4px;
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

