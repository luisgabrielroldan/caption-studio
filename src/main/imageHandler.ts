import { dialog, ipcMain } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

interface ImageData {
  id: string
  path: string
  filename: string
  captionPath: string
  originalCaption: string
  currentCaption: string
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

  async function scanDirectory(currentPath: string) {
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

            // Try to read existing caption
            let caption = ''
            try {
              caption = await fs.readFile(captionPath, 'utf-8')
            } catch {
              // Caption file doesn't exist yet
              caption = ''
            }

            images.push({
              id: fullPath, // Using full path as unique ID
              path: fullPath,
              filename: entry.name,
              captionPath,
              originalCaption: caption,
              currentCaption: caption
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
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const folderPath = result.filePaths[0]
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
}

