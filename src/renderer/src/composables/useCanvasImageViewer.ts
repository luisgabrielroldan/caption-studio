import { ref, watch, watchEffect, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface CanvasImageViewerOptions {
  currentImage: Ref<{ path: string; mediaType?: 'image' | 'video' } | null>
}

/**
 * Canvas-based image viewer with true zoom and smooth panning
 * Renders images at actual resolution for crisp quality when zoomed
 *
 * CRITICAL INITIALIZATION RULES:
 * 1. Canvas MUST be sized before any drawing operations
 * 2. Context transform MUST be reset before applying DPR scaling
 * 3. Image loading MUST wait for canvas initialization (onMounted)
 * 4. Always check refs exist before operations
 * 5. handleResize() sets canvas.width/height which resets context state
 */
export function useCanvasImageViewer(options: CanvasImageViewerOptions): {
  canvasRef: Ref<HTMLCanvasElement | null>
  containerRef: Ref<HTMLDivElement | null>
  zoom: Ref<number>
  isLoading: Ref<boolean>
  isDragging: Ref<boolean>
  loadedImage: Ref<HTMLImageElement | null>
  handleWheel: (event: WheelEvent) => void
  handleMouseDown: (event: MouseEvent) => void
  handleMouseMove: (event: MouseEvent) => void
  handleMouseUp: () => void
  resetView: () => void
} {
  const { currentImage } = options

  // Refs
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const containerRef = ref<HTMLDivElement | null>(null)
  const isInitialized = ref(false) // Track if canvas is ready

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
   * IMPORTANT: Only call after canvas is initialized (onMounted)
   */
  const loadImage = async (imagePath: string): Promise<void> => {
    // SAFETY: Don't load if canvas isn't ready - prevents rendering bugs
    if (!isInitialized.value) {
      // Silently skip - this can happen during initial mount race conditions
      // The image will load properly once canvas is initialized
      return
    }

    isLoading.value = true

    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        loadedImage.value = img
        isLoading.value = false
        // Ensure canvas is sized before calculating fit
        handleResize()
        resetView()
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

    let fitWidth, fitHeight, scale

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
    const fitX = (viewportWidth - fitWidth) / 2
    const fitY = (viewportHeight - fitHeight) / 2

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
    const container = containerRef.value
    const ctx = canvas?.getContext('2d')
    const img = loadedImage.value

    if (!canvas || !container || !ctx || !img) return

    // Clear canvas using CSS pixel dimensions (context is already scaled by DPR)
    ctx.clearRect(0, 0, container.clientWidth, container.clientHeight)

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
      0,
      0,
      img.naturalWidth,
      img.naturalHeight, // Source rectangle (entire image)
      x,
      y,
      zoomedWidth,
      zoomedHeight // Destination rectangle (scaled and positioned)
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
    const imageX =
      (mouseX - fit.x - panX.value - (fit.width - fit.width * zoom.value) / 2) / zoom.value
    const imageY =
      (mouseY - fit.y - panY.value - (fit.height - fit.height * zoom.value) / 2) / zoom.value

    // Calculate new zoom
    const delta = -event.deltaY * 0.001
    const oldZoom = zoom.value
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta))

    zoom.value = newZoom

    // Adjust pan to keep mouse position fixed in image space
    if (newZoom !== oldZoom) {
      panX.value =
        mouseX - fit.x - imageX * fit.scale * newZoom - (fit.width - fit.width * newZoom) / 2
      panY.value =
        mouseY - fit.y - imageY * fit.scale * newZoom - (fit.height - fit.height * newZoom) / 2
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
   * CRITICAL: This resets canvas state! Must be called:
   * - On mount (initial setup)
   * - When container resizes
   * - Before image loads (to ensure correct sizing)
   */
  const handleResize = (): void => {
    // SAFETY: Canvas must exist
    if (!canvasRef.value || !containerRef.value) {
      if (import.meta.env.DEV) {
        console.warn('[Canvas] handleResize called before refs available - skipping')
      }
      return
    }

    const container = containerRef.value
    const canvas = canvasRef.value

    // Get the actual display size (CSS pixels)
    const displayWidth = container.clientWidth
    const displayHeight = container.clientHeight

    // SAFETY: Container must have size
    if (displayWidth === 0 || displayHeight === 0) {
      if (import.meta.env.DEV) {
        console.warn(
          '[Canvas] Container has no size, skipping resize. Check if container is visible.'
        )
      }
      return
    }

    // Set canvas internal resolution for HiDPI
    // WARNING: Setting canvas.width/height resets ALL context state!
    const dpr = window.devicePixelRatio || 1
    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr

    // Scale context for HiDPI rendering (all draw calls will use CSS pixels)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('[Canvas] Failed to get 2d context')
    }

    // CRITICAL: Always reset transform first to prevent accumulation
    ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset to identity matrix
    ctx.scale(dpr, dpr) // Apply device pixel ratio scaling

    calculateImageFit()
    requestRender()
  }

  // Watch for image changes
  // IMPORTANT: immediate: false prevents loading before canvas is ready
  // Only load if the current item is an image (not a video)
  watch(
    () => ({ path: currentImage.value?.path, mediaType: currentImage.value?.mediaType }),
    (newValue) => {
      if (newValue.path && newValue.mediaType === 'image') {
        loadImage(newValue.path)
      } else {
        loadedImage.value = null
        if (canvasRef.value && containerRef.value) {
          requestRender()
        }
      }
    },
    { immediate: false } // CRITICAL: Never set to true - must wait for onMounted
  )

  // Setup resize observer
  let resizeObserver: ResizeObserver | null = null
  let isCanvasInitialized = false

  // Use watchEffect to robustly handle ref initialization
  // This will run when refs become available and automatically track dependencies
  watchEffect(() => {
    // Wait for both refs to be available
    if (!containerRef.value || !canvasRef.value) {
      return
    }

    // Only initialize once
    if (isCanvasInitialized) {
      return
    }

    isCanvasInitialized = true

    // CRITICAL: DO NOT CHANGE THIS INITIALIZATION ORDER!
    // Canvas bugs occur if steps are reordered or if image loads before canvas is sized

    // Step 1: Size canvas FIRST (sets width/height, applies DPR transform)
    handleResize()

    // Step 2: Mark as initialized (enables loadImage)
    isInitialized.value = true

    // Step 3: Setup resize observer (watches for container size changes)
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(containerRef.value)

    // Step 4: Load image LAST (if one exists and is an image, not a video)
    if (currentImage.value?.path && currentImage.value?.mediaType === 'image') {
      loadImage(currentImage.value.path)
    }

    // Setup global mouse up listener for drag
    window.addEventListener('mouseup', handleMouseUp)
  })

  onUnmounted(() => {
    // Cleanup
    isInitialized.value = false
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
