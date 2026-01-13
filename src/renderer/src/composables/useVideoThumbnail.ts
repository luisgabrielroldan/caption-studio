import { ref } from 'vue'

interface ThumbnailCache {
  [videoPath: string]: string // Maps video path to data URL
}

const thumbnailCache = ref<ThumbnailCache>({})

/**
 * Extract a thumbnail from a video file at the middle frame
 * Uses browser video element + canvas to capture frame
 * Results are cached to avoid re-extraction
 */
export function useVideoThumbnail(): {
  extractThumbnail: (videoPath: string) => Promise<string>
  clearCache: () => void
  removeThumbnail: (videoPath: string) => void
} {
  /**
   * Extract thumbnail from video at 50% position
   * @param videoPath - Full path to the video file
   * @returns Promise resolving to data URL of the thumbnail
   */
  const extractThumbnail = async (videoPath: string): Promise<string> => {
    // Check cache first
    if (thumbnailCache.value[videoPath]) {
      return thumbnailCache.value[videoPath]
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      video.preload = 'metadata'
      video.muted = true
      video.crossOrigin = 'anonymous' // Needed for canvas extraction

      // When metadata is loaded, seek to middle or first frame
      video.addEventListener('loadedmetadata', () => {
        try {
          // Check if duration is valid
          if (!isFinite(video.duration) || video.duration === 0 || video.duration < 0.1) {
            // Try to capture first frame instead (time 0)
            // This can happen with some video formats or streaming videos
            video.currentTime = 0
          } else {
            // Seek to middle of video (50%)
            video.currentTime = video.duration / 2
          }
        } catch (error) {
          reject(error)
        }
      })

      // When seeked to target time, capture frame
      video.addEventListener('seeked', () => {
        try {
          // Set canvas size to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

          // Cache the result
          thumbnailCache.value[videoPath] = dataUrl

          // Clean up
          video.src = ''
          video.load()

          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      })

      video.addEventListener('error', () => {
        // Get more detailed error information
        const error = video.error
        let errorMessage = 'Unknown error'

        if (error) {
          switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
              errorMessage = 'Video loading aborted'
              break
            case error.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading video'
              break
            case error.MEDIA_ERR_DECODE:
              errorMessage = 'Video decoding failed'
              break
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Video format not supported or file not accessible'
              break
            default:
              errorMessage = error.message || 'Unknown error'
          }
        }

        // Clean up
        video.src = ''
        video.load()

        reject(new Error(`Failed to load video: ${errorMessage}`))
      })

      // Load video
      video.src = `local-image://${encodeURIComponent(videoPath)}`
    })
  }

  /**
   * Clear thumbnail cache (useful for memory management)
   */
  const clearCache = (): void => {
    thumbnailCache.value = {}
  }

  /**
   * Remove specific thumbnail from cache
   */
  const removeThumbnail = (videoPath: string): void => {
    delete thumbnailCache.value[videoPath]
  }

  return {
    extractThumbnail,
    clearCache,
    removeThumbnail
  }
}
