<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue'
import { useCaptionStore } from '../stores/captionStore'

const store = useCaptionStore()
const thumbnailRefs = ref<HTMLDivElement[]>([])

const selectImage = (index: number) => {
  store.setCurrentIndex(index)
}

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
        :ref="el => { if (el) thumbnailRefs[index] = el as HTMLDivElement }"
        class="thumbnail-item"
        :class="{
          active: index === store.currentIndex,
          modified: store.modifiedImages.has(image.id)
        }"
        @click="selectImage(index)"
        :title="image.filename"
      >
        <div class="thumbnail-wrapper">
          <img :src="`local-image://${encodeURIComponent(image.path)}`" :alt="image.filename" draggable="false" />
          <div v-if="store.modifiedImages.has(image.id)" class="modified-indicator">●</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thumbnail-list {
  width: 280px;
  height: 100%;
  background: #1e1e1e;
  border-right: 1px solid #333;
  overflow-y: auto;
  overflow-x: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  padding: 20px;
  text-align: center;
}

.empty-state p {
  margin: 8px 0;
}

.empty-state .hint {
  font-size: 0.85em;
  color: #666;
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

.thumbnail-item:hover {
  border-color: #555;
}

.thumbnail-item.active {
  border-color: #0078d4;
  box-shadow: 0 0 0 1px #0078d4;
}

.thumbnail-item.modified::before {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: #ffa500;
  border-radius: 50%;
  z-index: 2;
  box-shadow: 0 0 4px rgba(255, 165, 0, 0.8);
}

.thumbnail-wrapper {
  width: 100%;
  aspect-ratio: 1;
  background: #2a2a2a;
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

.modified-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #ffa500;
  font-size: 12px;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  z-index: 2;
}

/* Scrollbar styling */
.thumbnail-list::-webkit-scrollbar {
  width: 8px;
}

.thumbnail-list::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.thumbnail-list::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.thumbnail-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

