import { ref, onMounted, onUnmounted } from 'vue'

interface ResizableSplitterOptions {
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  storageKey?: string
}

/**
 * Composable for resizable panel splitter
 * Manages drag state, width constraints, and persistence
 */
export function useResizableSplitter(options: ResizableSplitterOptions = {}) {
  const {
    defaultWidth = 280,
    minWidth = 200,
    maxWidth = 600,
    storageKey = 'thumbnailPanelWidth'
  } = options

  const width = ref(defaultWidth)
  const isDragging = ref(false)

  // Splitter drag handlers
  const handleSplitterMouseDown = (event: MouseEvent) => {
    isDragging.value = true
    event.preventDefault()
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value) return

    const newWidth = event.clientX
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      width.value = newWidth
    }
  }

  const handleMouseUp = () => {
    if (isDragging.value) {
      isDragging.value = false
      // Save width to localStorage
      localStorage.setItem(storageKey, width.value.toString())
    }
  }

  onMounted(() => {
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem(storageKey)
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10)
      if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        width.value = parsedWidth
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    width,
    isDragging,
    handleSplitterMouseDown,
    minWidth,
    maxWidth
  }
}

