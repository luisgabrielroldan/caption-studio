<script setup lang="ts">
import { watch, ref, nextTick } from 'vue'
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
          <div
            v-if="store.modifiedImages.has(image.id)"
            class="modified-indicator"
          ></div>
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

.thumbnail-item:hover {
  border-color: var(--text-muted);
}

.thumbnail-item.active {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 1px var(--accent-color);
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

