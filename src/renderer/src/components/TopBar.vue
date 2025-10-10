<script setup lang="ts">
import { useCaptionStore } from '../stores/captionStore'

const store = useCaptionStore()
</script>

<template>
  <div class="top-bar">
    <div class="left-section">
      <div class="app-title">
        <span class="app-name">Caption Studio</span>
        <span v-if="store.hasImages" class="image-count">{{ store.totalImages }} images</span>
      </div>
      <div v-if="store.folderPath" class="folder-info">
        <span class="folder-icon">📁</span>
        <span class="folder-path" :title="store.folderPath">{{ store.folderPath }}</span>
      </div>
    </div>

    <div class="right-section">
      <div v-if="store.hasUnsavedChanges" class="status-indicator">
        <span class="unsaved-dot"></span>
        <span class="unsaved-text">{{ Array.from(store.modifiedImages).length }} unsaved</span>
      </div>

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
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 6px;
  animation: pulse 2s ease-in-out infinite;
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
  border-color: rgba(76, 175, 80, 0.3);
  animation: none;
}

.unsaved-dot {
  width: 8px;
  height: 8px;
  background: var(--warning-color);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.6);
}

.unsaved-text {
  font-size: 0.85em;
  color: #ffb84d;
  font-weight: 500;
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
