import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'

interface ImageZoomOptions {
  minZoom?: number
  maxZoom?: number
  currentImage: Ref<any>
}

/**
 * Composable for image zoom and pan functionality
 * Handles mouse wheel zoom, panning with boundaries, and reset
 */
export function useImageZoom(options: ImageZoomOptions) {
  const { minZoom = 1, maxZoom = 5, currentImage } = options

  const zoom = ref(1)
  const transformOrigin = ref('center center')
  const imageRef = ref<HTMLImageElement | null>(null)
  const wrapperRef = ref<HTMLDivElement | null>(null)
  const panX = ref(0)
  const panY = ref(0)
  const isDragging = ref(false)
  const dragStart = ref({ x: 0, y: 0 })

  const isZoomed = computed(() => zoom.value > 1.01)

  const cursorStyle = computed(() => {
    if (!isZoomed.value) return 'default'
    return isDragging.value ? 'grabbing' : 'grab'
  })

  // Reset zoom when image changes
  watch(currentImage, () => {
    zoom.value = 1
    transformOrigin.value = 'center center'
    panX.value = 0
    panY.value = 0
  })

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault()

    if (!imageRef.value) return

    // Get mouse position relative to the image
    const rect = imageRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Calculate percentage position
    const percentX = (x / rect.width) * 100
    const percentY = (y / rect.height) * 100

    // Set transform origin to mouse position
    transformOrigin.value = `${percentX}% ${percentY}%`

    // Apply zoom with constraints
    const delta = -event.deltaY * 0.001
    const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom.value + delta))
    zoom.value = newZoom

    // Reset pan if zoomed out to minimum
    if (zoom.value === minZoom) {
      panX.value = 0
      panY.value = 0
    }
  }

  const handleMouseDown = (event: MouseEvent) => {
    if (!isZoomed.value) return

    isDragging.value = true
    dragStart.value = {
      x: event.clientX - panX.value,
      y: event.clientY - panY.value
    }
    event.preventDefault()
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.value || !imageRef.value || !wrapperRef.value) return

    const newPanX = event.clientX - dragStart.value.x
    const newPanY = event.clientY - dragStart.value.y

    // Get the current bounding rectangles
    const wrapperRect = wrapperRef.value.getBoundingClientRect()

    // Calculate the natural (unzoomed, unpanned) image dimensions
    const naturalWidth = imageRef.value.naturalWidth
    const naturalHeight = imageRef.value.naturalHeight

    // Calculate how the image fits in the container (object-fit: contain behavior)
    const containerRatio = wrapperRect.width / wrapperRect.height
    const imageRatio = naturalWidth / naturalHeight

    let displayWidth, displayHeight
    if (imageRatio > containerRatio) {
      // Image is wider - fits by width
      displayWidth = wrapperRect.width
      displayHeight = wrapperRect.width / imageRatio
    } else {
      // Image is taller - fits by height
      displayHeight = wrapperRect.height
      displayWidth = wrapperRect.height * imageRatio
    }

    // Apply zoom to get actual displayed size
    const zoomedWidth = displayWidth * zoom.value
    const zoomedHeight = displayHeight * zoom.value

    // Calculate how much overflow we have (how much bigger the image is than viewport)
    const overflowX = Math.max(0, zoomedWidth - wrapperRect.width)
    const overflowY = Math.max(0, zoomedHeight - wrapperRect.height)

    // Maximum pan is half the overflow (we can pan half left, half right)
    const maxPanX = overflowX / 2
    const maxPanY = overflowY / 2

    // Clamp pan values to prevent showing empty space beyond image edges
    panX.value = Math.max(-maxPanX, Math.min(maxPanX, newPanX))
    panY.value = Math.max(-maxPanY, Math.min(maxPanY, newPanY))
  }

  const handleMouseUp = () => {
    isDragging.value = false
  }

  const handleMouseLeave = () => {
    isDragging.value = false
  }

  const resetZoom = () => {
    zoom.value = 1
    transformOrigin.value = 'center center'
    panX.value = 0
    panY.value = 0
  }

  return {
    zoom,
    transformOrigin,
    imageRef,
    wrapperRef,
    panX,
    panY,
    isDragging,
    isZoomed,
    cursorStyle,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetZoom
  }
}

