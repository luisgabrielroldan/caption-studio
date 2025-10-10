<script setup lang="ts">
import { useDialog } from '../composables/useDialog'
import { computed } from 'vue'

const { dialogState, confirm, cancel } = useDialog()

const isConfirmType = computed(() => dialogState.value.type === 'confirm')

const iconClass = computed(() => {
  switch (dialogState.value.type) {
    case 'info':
      return 'icon-info'
    case 'confirm':
      return 'icon-question'
    case 'warning':
      return 'icon-warning'
    case 'error':
      return 'icon-error'
    default:
      return 'icon-info'
  }
})

const handleKeydown = (event: KeyboardEvent): void => {
  if (!dialogState.value.visible) return

  if (event.key === 'Escape') {
    cancel()
  } else if (event.key === 'Enter' && !isConfirmType.value) {
    confirm()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="dialogState.visible"
        class="dialog-backdrop"
        @click.self="cancel"
        @keydown="handleKeydown"
      >
        <div class="dialog-box" :class="`dialog-${dialogState.type}`">
          <div class="dialog-header">
            <div class="dialog-icon" :class="iconClass"></div>
            <h3 class="dialog-title">{{ dialogState.title }}</h3>
          </div>

          <div class="dialog-body">
            <p class="dialog-message">{{ dialogState.message }}</p>
          </div>

          <div class="dialog-footer">
            <button v-if="isConfirmType" class="btn btn-cancel" @click="cancel">
              {{ dialogState.cancelText }}
            </button>
            <button class="btn btn-primary" autofocus @click="confirm">
              {{ dialogState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.dialog-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.icon-info {
  background: rgba(74, 158, 255, 0.15);
  color: var(--accent-color);
}

.icon-info::before {
  content: 'ℹ';
}

.icon-question {
  background: rgba(74, 158, 255, 0.15);
  color: var(--accent-color);
}

.icon-question::before {
  content: '?';
  font-weight: bold;
}

.icon-warning {
  background: rgba(255, 165, 0, 0.15);
  color: var(--warning-color);
}

.icon-warning::before {
  content: '⚠';
}

.icon-error {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
}

.icon-error::before {
  content: '✕';
  font-weight: bold;
}

.dialog-title {
  margin: 0;
  font-size: 1.25em;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-body {
  padding: 20px 24px;
}

.dialog-message {
  margin: 0;
  font-size: 1em;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 0.95em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.btn-primary {
  background: var(--accent-color);
  color: #fff;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:focus {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

.btn-cancel {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* Dialog transitions */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active .dialog-box,
.dialog-leave-active .dialog-box {
  transition: transform 0.2s;
}

.dialog-enter-from .dialog-box,
.dialog-leave-to .dialog-box {
  transform: scale(0.9);
}
</style>
