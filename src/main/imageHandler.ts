import { dialog, ipcMain } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov']
const SUPPORTED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]

interface ImageData {
  id: string
  path: string
  filename: string
  captionPath: string
  originalCaption: string
  currentCaption: string
  size: number // File size in bytes
  mediaType: 'image' | 'video'
  duration?: number // Video duration in seconds (only for videos)
}

interface CaptionUpdate {
  captionPath: string
  caption: string
}

/**
 * Recursively find all images in a directory
 */
async function findImages(dirPath: string): Promise<ImageData[]> {
  const images: ImageData[] = []

  async function scanDirectory(currentPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)

        if (entry.isDirectory()) {
          await scanDirectory(fullPath)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            const baseName = entry.name.substring(0, entry.name.length - ext.length)
            const captionPath = path.join(currentPath, `${baseName}.txt`)

            // Determine media type
            const mediaType: 'image' | 'video' = IMAGE_EXTENSIONS.includes(ext) ? 'image' : 'video'

            // Try to read existing caption
            let caption = ''
            try {
              caption = await fs.readFile(captionPath, 'utf-8')
            } catch {
              // Caption file doesn't exist yet
              caption = ''
            }

            // Get file size
            let fileSize = 0
            try {
              const stats = await fs.stat(fullPath)
              fileSize = stats.size
            } catch {
              // If we can't get size, default to 0
              fileSize = 0
            }

            images.push({
              id: fullPath, // Using full path as unique ID
              path: fullPath,
              filename: entry.name,
              captionPath,
              originalCaption: caption,
              currentCaption: caption,
              size: fileSize,
              mediaType
              // Note: duration will be extracted on the renderer side for videos
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentPath}:`, error)
    }
  }

  await scanDirectory(dirPath)
  return images.sort((a, b) => a.path.localeCompare(b.path))
}

/**
 * Save captions to disk
 */
async function saveCaptions(updates: CaptionUpdate[]): Promise<void> {
  const errors: string[] = []

  for (const update of updates) {
    try {
      // Ensure directory exists
      const dir = path.dirname(update.captionPath)
      await fs.mkdir(dir, { recursive: true })

      // Write caption file
      await fs.writeFile(update.captionPath, update.caption, 'utf-8')
    } catch (error) {
      errors.push(`Failed to save ${update.captionPath}: ${error}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }
}

/**
 * Register IPC handlers for image operations
 */
export function registerImageHandlers(): void {
  // Open folder dialog and load images
  // Supports both dialog-based selection and direct path opening
  ipcMain.handle('dialog:openFolder', async (_event, directPath?: string) => {
    let folderPath: string | null = null

    if (directPath) {
      // Direct path provided (e.g., from "remember last folder")
      try {
        const stats = await fs.stat(directPath)
        if (stats.isDirectory()) {
          folderPath = directPath
        } else {
          console.error('Provided path is not a directory:', directPath)
          return null
        }
      } catch (error) {
        console.error('Error accessing directory:', directPath, error)
        return null
      }
    } else {
      // Show dialog
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      folderPath = result.filePaths[0]
    }

    const images = await findImages(folderPath)

    return {
      folderPath,
      images
    }
  })

  // Save captions
  ipcMain.handle('captions:save', async (_event, updates: CaptionUpdate[]) => {
    await saveCaptions(updates)
    return { success: true }
  })

  // Get image file URL (for loading in renderer)
  ipcMain.handle('image:getFileUrl', async (_event, imagePath: string) => {
    return `file://${imagePath}`
  })

  // Get image file stats (size)
  ipcMain.handle('image:getFileStats', async (_event, imagePath: string) => {
    try {
      const stats = await fs.stat(imagePath)
      return {
        size: stats.size
      }
    } catch (error) {
      console.error('Error getting file stats:', error)
      return null
    }
  })
}
