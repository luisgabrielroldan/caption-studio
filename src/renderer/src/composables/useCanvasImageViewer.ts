import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface CanvasImageViewerOptions {
  currentImage: Ref<{ path: string } | null>
}

/**
 * Canvas-based image viewer with true zoom and smooth panning
 * Renders images at actual resolution for crisp quality when zoomed
 */
export function useCanvasImageViewer(options: CanvasImageViewerOptions) {
  const { currentImage } = options

  // Refs
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const containerRef = ref<HTMLDivElement | null>(null)

  // State
  const zoom = ref(1) // 1 = fit to screen, >1 = zoomed in
  const panX = ref(0)
  const panY = ref(0)
  const isDragging = ref(false)
  const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })
  const isLoading = ref(false)
  const loadedImage = ref<HTMLImageElement | null>(null)

  // Image fit state (how image fits in viewport at zoom=1)
  const imageFit = ref({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    scale: 1 // Scale factor to fit image in viewport
  })

  const MIN_ZOOM = 0.1
  const MAX_ZOOM = 10

  /**
   * Load image from path
   */
  const loadImage = async (imagePath: string): Promise<void> => {
    isLoading.value = true

    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        loadedImage.value = img
        isLoading.value = false
        resetView()
        requestRender()
        resolve()
      }

      img.onerror = () => {
        isLoading.value = false
        reject(new Error('Failed to load image'))
      }

      // Use custom protocol for local images
      img.src = `local-image://${encodeURIComponent(imagePath)}`
    })
  }

  /**
   * Calculate how image fits in viewport (object-fit: contain)
   */
  const calculateImageFit = (): void => {
    if (!loadedImage.value || !canvasRef.value || !containerRef.value) return

    const container = containerRef.value
    const img = loadedImage.value

    // Use CSS pixels (container size) for calculations
    const viewportWidth = container.clientWidth
    const viewportHeight = container.clientHeight
    const imageRatio = img.naturalWidth / img.naturalHeight
    const viewportRatio = viewportWidth / viewportHeight

    let fitWidth, fitHeight, fitX, fitY, scale

    if (imageRatio > viewportRatio) {
      // Image is wider - fit by width
      fitWidth = viewportWidth
      fitHeight = viewportWidth / imageRatio
      scale = fitWidth / img.naturalWidth
    } else {
      // Image is taller - fit by height
      fitHeight = viewportHeight
      fitWidth = viewportHeight * imageRatio
      scale = fitHeight / img.naturalHeight
    }

    // Center the fitted image
    fitX = (viewportWidth - fitWidth) / 2
    fitY = (viewportHeight - fitHeight) / 2

    imageFit.value = {
      x: fitX,
      y: fitY,
      width: fitWidth,
      height: fitHeight,
      scale
    }
  }

  /**
   * Render image on canvas
   */
  const render = (): void => {
    const canvas = canvasRef.value
    const ctx = canvas?.getContext('2d')
    const img = loadedImage.value

    if (!canvas || !ctx || !img) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate dimensions at current zoom
    const fit = imageFit.value
    const zoomedWidth = fit.width * zoom.value
    const zoomedHeight = fit.height * zoom.value

    // Calculate top-left corner of image with pan offset
    const x = fit.x + panX.value + (fit.width - zoomedWidth) / 2
    const y = fit.y + panY.value + (fit.height - zoomedHeight) / 2

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw image using 9-parameter version to maintain aspect ratio
    // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    // Draw entire source image (0, 0, naturalWidth, naturalHeight) to destination rect
    ctx.drawImage(
      img,
      0, 0, img.naturalWidth, img.naturalHeight,  // Source rectangle (entire image)
      x, y, zoomedWidth, zoomedHeight             // Destination rectangle (scaled and positioned)
    )
  }

  let renderRequested = false
  const requestRender = (): void => {
    if (renderRequested) return
    renderRequested = true
    requestAnimationFrame(() => {
      render()
      renderRequested = false
    })
  }

  /**
   * Constrain pan to keep image within bounds
   */
  const constrainPan = (): void => {
    if (!containerRef.value || !loadedImage.value) return

    const container = containerRef.value
    const fit = imageFit.value

    const zoomedWidth = fit.width * zoom.value
    const zoomedHeight = fit.height * zoom.value

    // Calculate overflow (how much image extends beyond viewport)
    const overflowX = Math.max(0, zoomedWidth - container.clientWidth)
    const overflowY = Math.max(0, zoomedHeight - container.clientHeight)

    // Maximum pan is half the overflow
    const maxPanX = overflowX / 2
    const maxPanY = overflowY / 2

    // Clamp pan values
    panX.value = Math.max(-maxPanX, Math.min(maxPanX, panX.value))
    panY.value = Math.max(-maxPanY, Math.min(maxPanY, panY.value))
  }

  /**
   * Handle mouse wheel for zoom
   */
  const handleWheel = (event: WheelEvent): void => {
    event.preventDefault()

    if (!canvasRef.value || !loadedImage.value) return

    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()

    // Mouse position relative to canvas
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    // Calculate mouse position in image space (before zoom)
    const fit = imageFit.value
    const imageX = (mouseX - fit.x - panX.value - (fit.width - fit.width * zoom.value) / 2) / zoom.value
    const imageY = (mouseY - fit.y - panY.value - (fit.height - fit.height * zoom.value) / 2) / zoom.value

    // Calculate new zoom
    const delta = -event.deltaY * 0.001
    const oldZoom = zoom.value
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta))

    zoom.value = newZoom

    // Adjust pan to keep mouse position fixed in image space
    if (newZoom !== oldZoom) {
      const zoomRatio = newZoom / oldZoom
      panX.value = mouseX - fit.x - imageX * fit.scale * newZoom - (fit.width - fit.width * newZoom) / 2
      panY.value = mouseY - fit.y - imageY * fit.scale * newZoom - (fit.height - fit.height * newZoom) / 2
    }

    constrainPan()
    requestRender()
  }

  /**
   * Handle mouse down to start dragging
   */
  const handleMouseDown = (event: MouseEvent): void => {
    if (zoom.value <= 1) return // Only allow drag when zoomed

    isDragging.value = true
    dragStart.value = {
      x: event.clientX,
      y: event.clientY,
      panX: panX.value,
      panY: panY.value
    }
  }

  /**
   * Handle mouse move for dragging
   */
  const handleMouseMove = (event: MouseEvent): void => {
    if (!isDragging.value) return

    const deltaX = event.clientX - dragStart.value.x
    const deltaY = event.clientY - dragStart.value.y

    panX.value = dragStart.value.panX + deltaX
    panY.value = dragStart.value.panY + deltaY

    constrainPan()
    requestRender()
  }

  /**
   * Handle mouse up to stop dragging
   */
  const handleMouseUp = (): void => {
    isDragging.value = false
  }

  /**
   * Reset view to fit image in viewport
   */
  const resetView = (): void => {
    zoom.value = 1
    panX.value = 0
    panY.value = 0
    calculateImageFit()
    requestRender()
  }

  /**
   * Handle canvas resize
   */
  const handleResize = (): void => {
    if (!canvasRef.value || !containerRef.value) return

    const container = containerRef.value
    const canvas = canvasRef.value

    // Set canvas size to match container
    const dpr = window.devicePixelRatio || 1
    canvas.width = container.clientWidth * dpr
    canvas.height = container.clientHeight * dpr

    // Scale context for HiDPI
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    // Update canvas CSS size
    canvas.style.width = `${container.clientWidth}px`
    canvas.style.height = `${container.clientHeight}px`

    calculateImageFit()
    requestRender()
  }

  // Watch for image changes
  watch(
    () => currentImage.value?.path,
    (newPath) => {
      if (newPath) {
        loadImage(newPath)
      } else {
        loadedImage.value = null
        requestRender()
      }
    },
    { immediate: true }
  )

  // Setup resize observer
  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(containerRef.value)
      handleResize()
    }

    // Add global mouse up listener
    window.addEventListener('mouseup', handleMouseUp)
  })

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    window.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    canvasRef,
    containerRef,
    zoom,
    isLoading,
    isDragging,
    loadedImage,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView
  }
}

