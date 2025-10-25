/**
 * Composable for capturing video frames as base64 data URLs
 * Used primarily for batch captioning operations
 */
export function useVideoFrameCapture() {
  /**
   * Extract a frame from a video file at a specific position
   * @param videoPath - Full path to the video file
   * @param position - 'first' (0s) or 'middle' (50%)
   * @returns Promise resolving to base64 data URL of the frame
   */
  const captureFrame = async (
    videoPath: string,
    position: 'first' | 'middle' = 'first'
  ): Promise<string> => {
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
      video.crossOrigin = 'anonymous'

      // When metadata is loaded, seek to target position
      video.addEventListener('loadedmetadata', () => {
        try {
          // Determine target time based on position
          let targetTime = 0

          if (position === 'middle') {
            if (!isFinite(video.duration) || video.duration === 0 || video.duration < 0.1) {
              // Invalid duration, use first frame
              targetTime = 0
            } else {
              // Seek to middle
              targetTime = video.duration / 2
            }
          }

          video.currentTime = targetTime
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

          // Clean up
          video.src = ''
          video.load()

          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      })

      // Handle errors
      video.addEventListener('error', () => {
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

  return {
    captureFrame
  }
}

