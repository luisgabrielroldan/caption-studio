<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isFocused = ref(false)
const isRecording = ref(false)

const displayValue = computed(() => {
  if (isRecording.value) {
    return 'Press a key...'
  }
  return props.modelValue || props.placeholder || 'Click to set'
})

const handleFocus = (): void => {
  isFocused.value = true
}

const handleBlur = (): void => {
  isFocused.value = false
  isRecording.value = false
}

const handleClick = (): void => {
  isRecording.value = true
}

const handleKeyDown = (event: KeyboardEvent): void => {
  if (!isRecording.value) return

  event.preventDefault()
  event.stopPropagation()

  // Ignore standalone modifier keys
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
    return
  }

  const parts: string[] = []

  // Build the key combination string
  if (event.ctrlKey || event.metaKey) {
    parts.push(event.metaKey && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl')
  }
  if (event.shiftKey) {
    parts.push('Shift')
  }
  if (event.altKey) {
    parts.push('Alt')
  }

  // Format the main key
  let mainKey = event.key

  // Special key formatting
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Escape: 'Esc',
    Enter: 'Enter',
    Backspace: 'Backspace',
    Delete: 'Del',
    Tab: 'Tab'
  }

  if (keyMap[mainKey]) {
    mainKey = keyMap[mainKey]
  } else if (mainKey.length === 1) {
    mainKey = mainKey.toUpperCase()
  }

  parts.push(mainKey)

  const combination = parts.join(' + ')
  emit('update:modelValue', combination)

  isRecording.value = false
}

const handleClear = (event: MouseEvent): void => {
  event.stopPropagation()
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="keybinding-input-wrapper">
    <input
      type="text"
      class="keybinding-input"
      :class="{ recording: isRecording, focused: isFocused }"
      :value="displayValue"
      readonly
      @focus="handleFocus"
      @blur="handleBlur"
      @click="handleClick"
      @keydown="handleKeyDown"
    />
    <button
      v-if="modelValue"
      class="clear-btn"
      title="Clear"
      @mousedown.prevent
      @click="handleClear"
    >
      ✕
    </button>
  </div>
</template>

<style scoped>
.keybinding-input-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.keybinding-input {
  background: var(--bg-hover);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 6px 32px 6px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  min-width: 150px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  font-family: 'Monaco', 'Menlo', monospace;
  text-align: center;
}

.keybinding-input:hover {
  background: var(--bg-tertiary);
}

.keybinding-input.focused {
  border-color: var(--accent-color);
}

.keybinding-input.recording {
  border-color: var(--accent-color);
  background: rgba(74, 158, 255, 0.1);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(74, 158, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.1);
  }
}

.clear-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
  border-radius: 3px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
