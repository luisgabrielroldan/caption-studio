import { ref, type Ref } from 'vue'
import { useCaptionStore, type ImageItem } from '../stores/captionStore'

interface BatchProgress {
  isActive: boolean
  current: number
  total: number
  currentFilename: string
  cancelled: boolean
}

/**
 * Composable for batch caption generation
 * Handles progress tracking, cancellation, and state management
 */
export function useBatchCaptioning(): {
  progress: Ref<BatchProgress>
  batchGenerate: (
    images: ImageItem[],
    mode: 'replace' | 'append',
    generateFn: (path: string, mode: string, currentCaption: string) => Promise<string | null>
  ) => Promise<void>
  cancel: () => void
} {
  const store = useCaptionStore()

  const progress = ref<BatchProgress>({
    isActive: false,
    current: 0,
    total: 0,
    currentFilename: '',
    cancelled: false
  })

  /**
   * Cancel the current batch operation
   */
  function cancel(): void {
    progress.value.cancelled = true
  }

  /**
   * Generate captions for multiple images
   * @param images - Array of images to process
   * @param mode - 'replace' or 'append'
   * @param generateFn - Function to generate a single caption
   */
  async function batchGenerate(
    images: ImageItem[],
    mode: 'replace' | 'append',
    generateFn: (
      path: string,
      mode: 'replace' | 'append',
      currentCaption: string
    ) => Promise<string | null>
  ): Promise<void> {
    if (images.length === 0) return

    // Initialize progress
    progress.value = {
      isActive: true,
      current: 0,
      total: images.length,
      currentFilename: '',
      cancelled: false
    }

    // Set global batch state
    store.setBatchGenerating(true)

    try {
      // Process each image sequentially
      for (let i = 0; i < images.length; i++) {
        // Check if user cancelled
        if (progress.value.cancelled) {
          break
        }

        const image = images[i]
        progress.value.current = i + 1
        progress.value.currentFilename = image.filename

        // Get current caption for append mode
        const currentCaption = mode === 'append' ? image.currentCaption : ''

        // Generate caption
        const caption = await generateFn(image.path, mode, currentCaption)

        if (caption !== null) {
          // Find the index and update in store
          const index = store.images.findIndex((img) => img.id === image.id)
          if (index !== -1) {
            store.images[index].currentCaption = caption
          }
        }
      }
    } finally {
      // Always cleanup, even if cancelled or error
      progress.value.isActive = false
      store.setBatchGenerating(false)
    }
  }

  return {
    progress,
    batchGenerate,
    cancel
  }
}
