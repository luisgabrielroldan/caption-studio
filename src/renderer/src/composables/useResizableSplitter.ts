import { ref, onMounted, onUnmounted } from 'vue'
import { useConfig } from './useConfig'

interface ResizableSplitterOptions {
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  configKey?: string
}

/**
 * Composable for resizable panel splitter
 * Manages drag state, width constraints, and persistence via config
 */
export function useResizableSplitter(options: ResizableSplitterOptions = {}) {
  const { defaultWidth = 280, minWidth = 200, maxWidth = 600, configKey = 'thumbnailPanelWidth' } =
    options

  const config = useConfig()
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

  const handleMouseUp = async () => {
    if (isDragging.value) {
      isDragging.value = false
      // Save width to config
      await config.set(configKey, width.value)
    }
  }

  onMounted(async () => {
    // Load saved width from config
    const savedWidth = await config.get<number>(configKey)
    if (savedWidth && savedWidth >= minWidth && savedWidth <= maxWidth) {
      width.value = savedWidth
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

