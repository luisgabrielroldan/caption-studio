import { ref, type Ref } from 'vue'
import { useDialog } from './useDialog'

export type CaptionMode = 'replace' | 'append'

export function useAutoCaptioner(): {
  isGenerating: Ref<boolean>
  generateCaption: (
    imagePath: string,
    mode?: CaptionMode | string,
    currentCaption?: string
  ) => Promise<string | null>
} {
  const { showError } = useDialog()
  const isGenerating = ref(false)

  /**
   * Generate a caption for the given image
   * @param imagePath - Full path to the image file
   * @param mode - Whether to replace or append to existing caption
   * @param currentCaption - The current caption text (used for append mode)
   * @returns The generated caption (or combined caption in append mode)
   */
  async function generateCaption(
    imagePath: string,
    mode: CaptionMode | string = 'replace',
    currentCaption: string = ''
  ): Promise<string | null> {
    if (isGenerating.value) {
      await showError('Caption generation is already in progress')
      return null
    }

    isGenerating.value = true

    try {
      // Call the auto-captioner service
      const generatedCaption = await window.api.autoCaptioner.generate(imagePath)

      // Handle the mode
      if (mode === 'append') {
        // Append with proper spacing
        if (currentCaption.trim()) {
          return `${currentCaption.trim()}, ${generatedCaption}`
        }
        return generatedCaption
      }

      // Replace mode
      return generatedCaption
    } catch (error) {
      console.error('Error generating caption:', error)

      // Show user-friendly error message
      let errorMessage = 'Failed to generate caption.'

      if (error instanceof Error) {
        // Extract useful error information
        if (error.message.includes('not configured')) {
          errorMessage = 'Auto-captioner is not configured. Please check your settings.'
        } else if (error.message.includes('API request failed')) {
          errorMessage =
            'Failed to connect to the captioning service. Please check your configuration.'
        } else if (error.message.includes('not yet supported')) {
          errorMessage = error.message
        } else {
          errorMessage = `Failed to generate caption: ${error.message}`
        }
      }

      await showError(errorMessage)
      return null
    } finally {
      isGenerating.value = false
    }
  }

  return {
    isGenerating,
    generateCaption
  }
}
