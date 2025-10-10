<script setup lang="ts">
import { computed } from 'vue'
import { useCaptionStore } from '../stores/captionStore'
import { formatFileSize } from '../utils/formatters'
import { useDialog } from '../composables/useDialog'

const store = useCaptionStore()
const { showConfirm } = useDialog()

const formattedDatasetSize = computed(() => {
  if (store.totalSize === 0) return ''
  return formatFileSize(store.totalSize)
})

const discardAllChanges = async (): Promise<void> => {
  const count = Array.from(store.modifiedImages).length
  const confirmed = await showConfirm(
    `Are you sure you want to discard changes to ${count} image${count > 1 ? 's' : ''}? This cannot be undone.`,
    'Discard All Changes',
    'Discard',
    'Cancel'
  )

  if (confirmed) {
    store.resetChanges()
  }
}
</script>

<template>
  <div class="top-bar">
    <div class="left-section">
      <div class="app-title">
        <span class="app-name">Caption Studio</span>
        <span v-if="store.hasImages" class="image-count">
          {{ store.totalImages }} images
          <span v-if="formattedDatasetSize" class="dataset-size">· {{ formattedDatasetSize }}</span>
        </span>
      </div>
      <div v-if="store.folderPath" class="folder-info">
        <span class="folder-icon">📁</span>
        <span class="folder-path" :title="store.folderPath">{{ store.folderPath }}</span>
      </div>
    </div>

    <div class="right-section">
      <button
        v-if="store.hasUnsavedChanges"
        class="status-indicator status-unsaved"
        title="Click to discard all changes"
        @click="discardAllChanges"
      >
        <span class="unsaved-dot"></span>
        <span class="status-text">{{ Array.from(store.modifiedImages).length }} unsaved</span>
        <span class="status-text-hover">Discard All</span>
      </button>

      <div v-else-if="store.hasImages" class="status-indicator status-saved">
        <span class="saved-check">✓</span>
        <span class="saved-text">All saved</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(to bottom, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  min-height: 56px;
  gap: 24px;
}

/* Left Section */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.app-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.app-name {
  font-size: 1.15em;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.image-count {
  font-size: 0.75em;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: 2px 8px;
  background: var(--bg-hover);
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dataset-size {
  opacity: 0.7;
}

.folder-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8em;
}

.folder-icon {
  font-size: 0.9em;
  opacity: 0.7;
}

.folder-path {
  color: var(--text-tertiary);
  max-width: 600px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.95em;
}

/* Right Section */
.right-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
}

.status-unsaved {
  position: relative;
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  animation: pulse 2s ease-in-out infinite;
  cursor: pointer;
  transition:
    background 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.status-unsaved:hover {
  background: rgba(255, 68, 68, 0.2);
  border-color: #ff4444;
  animation: none;
}

.status-unsaved:active {
  transform: scale(0.95);
  background: rgba(255, 68, 68, 0.3);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.status-saved {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  animation: none;
}

.unsaved-dot {
  width: 8px;
  height: 8px;
  background: var(--warning-color);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.6);
}

.status-text,
.status-text-hover {
  position: relative;
  font-size: 0.85em;
  font-weight: 500;
  transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.status-text {
  color: #ffb84d;
}

.status-text-hover {
  position: absolute;
  color: #ff4444;
  opacity: 0;
  left: 50%;
  transform: translateX(-50%);
}

.status-unsaved:hover .status-text {
  opacity: 0;
}

.status-unsaved:hover .status-text-hover {
  opacity: 1;
}

.status-unsaved:hover .unsaved-dot {
  opacity: 0;
}

.saved-check {
  font-size: 1em;
  color: var(--success-color);
  font-weight: 700;
}

.saved-text {
  font-size: 0.85em;
  color: #5ac058;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .folder-path {
    max-width: 400px;
  }
}
</style>
