<script setup lang="ts">
import { useCaptionStore } from '../stores/captionStore'
import { useFileOperations } from '../composables/useFileOperations'

const store = useCaptionStore()
const { isSaving, openFolder, saveCaptions, closeFolder } = useFileOperations()

const saveAllCaptions = async () => {
  await saveCaptions(true) // Show alert on success
}
</script>

<template>
  <div class="top-bar">
    <div class="title-section">
      <h1>Caption Studio</h1>
      <div v-if="store.folderPath" class="folder-path" :title="store.folderPath">
        {{ store.folderPath }}
      </div>
    </div>
    <div class="actions">
      <button @click="openFolder" class="btn btn-primary" title="Ctrl/Cmd+O">
        📁 Open Folder
      </button>
      <button
        @click="saveAllCaptions"
        class="btn btn-success"
        :disabled="!store.hasUnsavedChanges || isSaving"
        title="Ctrl/Cmd+S"
      >
        <span v-if="!isSaving">💾 Save All</span>
        <span v-else>Saving...</span>
        <span v-if="store.hasUnsavedChanges" class="unsaved-count">
          ({{ Array.from(store.modifiedImages).length }})
        </span>
      </button>
      <button
        @click="closeFolder"
        class="btn btn-secondary"
        :disabled="!store.hasImages"
        title="Ctrl/Cmd+W"
      >
        ✕ Close
      </button>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-section h1 {
  font-size: 1.2em;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.folder-path {
  font-size: 0.75em;
  color: #888;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #0078d4;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #106ebe;
}

.btn-success {
  background: #107c10;
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  background: #0e6b0e;
}

.btn-secondary {
  background: #444;
  color: #fff;
}

.btn-secondary:hover:not(:disabled) {
  background: #555;
}

.unsaved-count {
  font-size: 0.85em;
  opacity: 0.9;
}
</style>

