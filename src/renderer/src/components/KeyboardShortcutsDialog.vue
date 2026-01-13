<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(false)

// Detect Mac for displaying proper modifier key
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
const modKey = isMac ? '⌘' : 'Ctrl'

const shortcuts = [
  { category: 'Navigation', items: [
    { keys: ['↑', 'K'], description: 'Previous image' },
    { keys: ['↓', 'J'], description: 'Next image' },
    { keys: ['Home'], description: 'First image' },
    { keys: ['End'], description: 'Last image' },
  ]},
  { category: 'Focus', items: [
    { keys: ['Tab'], description: 'Focus caption editor' },
    { keys: [`${modKey} + Enter`], description: 'Toggle focus (editor ↔ navigation)' },
    { keys: ['Esc'], description: 'Unfocus editor' },
  ]},
  { category: 'File Operations', items: [
    { keys: [`${modKey} + O`], description: 'Open folder' },
    { keys: [`${modKey} + S`], description: 'Save all captions' },
    { keys: [`${modKey} + Shift + R`], description: 'Discard all changes' },
    { keys: [`${modKey} + W`], description: 'Close folder' },
  ]},
  { category: 'Application', items: [
    { keys: [`${modKey} + ,`], description: 'Open preferences' },
    { keys: ['Shift + F12'], description: 'Veil (hide window)' },
  ]},
]

const show = (): void => {
  isVisible.value = true
}

const hide = (): void => {
  isVisible.value = false
}

// Handle escape key to close dialog
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    hide()
  }
}

defineExpose({ show, hide })
</script>

<template>
  <Transition name="modal">
    <div v-if="isVisible" class="modal-backdrop" @click.self="hide" @keydown="handleKeydown">
      <div class="modal-dialog" tabindex="-1">
        <div class="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="close-btn" title="Close" @click="hide">✕</button>
        </div>

        <div class="modal-content">
          <div v-for="section in shortcuts" :key="section.category" class="shortcut-section">
            <h3>{{ section.category }}</h3>
            <div class="shortcuts-list">
              <div v-for="shortcut in section.items" :key="shortcut.description" class="shortcut-row">
                <div class="shortcut-keys">
                  <kbd v-for="(key, index) in shortcut.keys" :key="key">
                    {{ key }}
                    <span v-if="index < shortcut.keys.length - 1" class="key-separator">or</span>
                  </kbd>
                </div>
                <span class="shortcut-description">{{ shortcut.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" @click="hide">Done</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  outline: none;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4em;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.5em;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.shortcut-section {
  margin-bottom: 24px;
}

.shortcut-section:last-child {
  margin-bottom: 0;
}

.shortcut-section h3 {
  margin: 0 0 12px 0;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-color);
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: 6px;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 6px;
}

kbd {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 0.85em;
  font-weight: 500;
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.key-separator {
  font-size: 0.75em;
  color: var(--text-tertiary);
  font-weight: 400;
}

.shortcut-description {
  color: var(--text-secondary);
  font-size: 0.9em;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent-color);
  color: #fff;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-dialog,
.modal-leave-active .modal-dialog {
  transition: transform 0.2s;
}

.modal-enter-from .modal-dialog,
.modal-leave-to .modal-dialog {
  transform: scale(0.95);
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.modal-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>
