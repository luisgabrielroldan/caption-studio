/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fs from 'fs/promises'

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn()
}))

// Mock electron dialog
vi.mock('electron', async () => {
  const actual = await vi.importActual('electron')
  return {
    ...actual,
    dialog: {
      showOpenDialog: vi.fn()
    },
    ipcMain: {
      handle: vi.fn()
    }
  }
})

describe('imageHandler', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Dynamically import after mocks are set up
    const { registerImageHandlers } = await import('../imageHandler')
    const { ipcMain } = await import('electron')

    registerImageHandlers()

    // Get the handler function
    handler = vi
      .mocked(ipcMain.handle)
      .mock.calls.find((call) => call[0] === 'dialog:openFolder')?.[1]
  })

  describe('findImages', () => {
    it('should find images recursively in directory', async () => {
      const mockReadDir = vi.mocked(fs.readdir)
      const mockStat = vi.mocked(fs.stat)
      const mockReadFile = vi.mocked(fs.readFile)

      // Mock directory structure
      mockReadDir
        .mockResolvedValueOnce([
          { name: 'image1.jpg', isDirectory: () => false, isFile: () => true },
          { name: 'subfolder', isDirectory: () => true, isFile: () => false },
          { name: 'image2.png', isDirectory: () => false, isFile: () => true }
        ] as any)
        .mockResolvedValueOnce([
          { name: 'image3.webp', isDirectory: () => false, isFile: () => true }
        ] as any)

      mockStat
        .mockResolvedValueOnce({ size: 1024, isDirectory: () => true } as any) // For directPath check
        .mockResolvedValueOnce({ size: 1024 } as any)
        .mockResolvedValueOnce({ size: 2048 } as any)
        .mockResolvedValueOnce({ size: 3072 } as any)

      mockReadFile
        .mockResolvedValueOnce('caption1')
        .mockResolvedValueOnce('caption2')
        .mockResolvedValueOnce('caption3')

      const result = await handler(null, '/test/folder')

      expect(result).toBeDefined()
      expect(result.folderPath).toBe('/test/folder')
      expect(result.images).toHaveLength(3)
      expect(result.images[0].filename).toBe('image1.jpg')
      expect(result.images[1].filename).toBe('image2.png')
      expect(result.images[2].filename).toBe('image3.webp')
    })

    it('should handle missing caption files', async () => {
      const mockReadDir = vi.mocked(fs.readdir)
      const mockStat = vi.mocked(fs.stat)
      const mockReadFile = vi.mocked(fs.readFile)

      mockReadDir.mockResolvedValueOnce([
        { name: 'image1.jpg', isDirectory: () => false, isFile: () => true }
      ] as any)

      mockStat
        .mockResolvedValueOnce({ size: 1024, isDirectory: () => true } as any)
        .mockResolvedValueOnce({ size: 1024 } as any)
      mockReadFile.mockRejectedValueOnce(new Error('File not found'))

      const result = await handler(null, '/test/folder')

      expect(result.images[0].originalCaption).toBe('')
      expect(result.images[0].currentCaption).toBe('')
    })

    it('should filter only supported file types', async () => {
      const mockReadDir = vi.mocked(fs.readdir)
      const mockStat = vi.mocked(fs.stat)
      const mockReadFile = vi.mocked(fs.readFile)

      mockReadDir.mockResolvedValueOnce([
        { name: 'image1.jpg', isDirectory: () => false, isFile: () => true },
        { name: 'document.pdf', isDirectory: () => false, isFile: () => true },
        { name: 'video1.mp4', isDirectory: () => false, isFile: () => true },
        { name: 'video2.webm', isDirectory: () => false, isFile: () => true },
        { name: 'video3.mov', isDirectory: () => false, isFile: () => true },
        { name: 'unsupported.xyz', isDirectory: () => false, isFile: () => true }
      ] as any)

      mockStat
        .mockResolvedValueOnce({ size: 1024, isDirectory: () => true } as any)
        .mockResolvedValue({ size: 1024 } as any)
      mockReadFile.mockResolvedValue('')

      const result = await handler(null, '/test/folder')

      // Should only include supported formats (jpg, png, webp, mp4, webm, mov)
      // pdf and xyz should be filtered out
      expect(result.images).toHaveLength(4)
      const filenames = result.images.map((img: any) => img.filename)
      expect(filenames).toContain('image1.jpg')
      expect(filenames).toContain('video1.mp4')
      expect(filenames).toContain('video2.webm')
      expect(filenames).toContain('video3.mov')
      expect(filenames).not.toContain('document.pdf')
      expect(filenames).not.toContain('unsupported.xyz')
    })

    it('should set correct media type for images and videos', async () => {
      const mockReadDir = vi.mocked(fs.readdir)
      const mockStat = vi.mocked(fs.stat)
      const mockReadFile = vi.mocked(fs.readFile)

      mockReadDir.mockResolvedValueOnce([
        { name: 'image1.jpg', isDirectory: () => false, isFile: () => true },
        { name: 'video1.mp4', isDirectory: () => false, isFile: () => true }
      ] as any)

      mockStat
        .mockResolvedValueOnce({ size: 1024, isDirectory: () => true } as any)
        .mockResolvedValue({ size: 1024 } as any)
      mockReadFile.mockResolvedValue('')

      const result = await handler(null, '/test/folder')

      expect(result.images[0].mediaType).toBe('image')
      expect(result.images[1].mediaType).toBe('video')
    })

    it('should handle file size errors gracefully', async () => {
      const mockReadDir = vi.mocked(fs.readdir)
      const mockStat = vi.mocked(fs.stat)
      const mockReadFile = vi.mocked(fs.readFile)

      mockReadDir.mockResolvedValueOnce([
        { name: 'image1.jpg', isDirectory: () => false, isFile: () => true }
      ] as any)

      mockStat
        .mockResolvedValueOnce({ size: 1024, isDirectory: () => true } as any)
        .mockRejectedValueOnce(new Error('Permission denied'))
      mockReadFile.mockResolvedValue('')

      const result = await handler(null, '/test/folder')

      expect(result.images[0].size).toBe(0) // Should default to 0 on error
    })

    it('should sort images by path', async () => {
      const mockReadDir = vi.mocked(fs.readdir)
      const mockStat = vi.mocked(fs.stat)
      const mockReadFile = vi.mocked(fs.readFile)

      mockReadDir.mockResolvedValueOnce([
        { name: 'zebra.jpg', isDirectory: () => false, isFile: () => true },
        { name: 'apple.jpg', isDirectory: () => false, isFile: () => true },
        { name: 'banana.jpg', isDirectory: () => false, isFile: () => true }
      ] as any)

      mockStat
        .mockResolvedValueOnce({ size: 1024, isDirectory: () => true } as any)
        .mockResolvedValue({ size: 1024 } as any)
      mockReadFile.mockResolvedValue('')

      const result = await handler(null, '/test/folder')

      const filenames = result.images.map((img: any) => img.filename)
      expect(filenames).toEqual(['apple.jpg', 'banana.jpg', 'zebra.jpg'])
    })
  })

  describe('saveCaptions', () => {
    let saveHandler: any

    beforeEach(async () => {
      const { ipcMain } = await import('electron')
      saveHandler = vi
        .mocked(ipcMain.handle)
        .mock.calls.find((call) => call[0] === 'captions:save')?.[1]
    })

    it('should save multiple captions', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile)
      const mockMkdir = vi.mocked(fs.mkdir)

      mockMkdir.mockResolvedValue(undefined as any)
      mockWriteFile.mockResolvedValue(undefined as any)

      const updates = [
        { captionPath: '/test/img1.txt', caption: 'caption1' },
        { captionPath: '/test/img2.txt', caption: 'caption2' }
      ]

      await saveHandler(null, updates)

      expect(mockMkdir).toHaveBeenCalledTimes(2)
      expect(mockWriteFile).toHaveBeenCalledTimes(2)
      expect(mockWriteFile).toHaveBeenCalledWith('/test/img1.txt', 'caption1', 'utf-8')
      expect(mockWriteFile).toHaveBeenCalledWith('/test/img2.txt', 'caption2', 'utf-8')
    })

    it('should create directories if they do not exist', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile)
      const mockMkdir = vi.mocked(fs.mkdir)

      mockMkdir.mockResolvedValue(undefined as any)
      mockWriteFile.mockResolvedValue(undefined as any)

      const updates = [{ captionPath: '/test/subfolder/img1.txt', caption: 'caption1' }]

      await saveHandler(null, updates)

      expect(mockMkdir).toHaveBeenCalledWith('/test/subfolder', { recursive: true })
    })

    it('should collect and throw errors from failed saves', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile)
      const mockMkdir = vi.mocked(fs.mkdir)

      mockMkdir.mockResolvedValue(undefined as any)
      mockWriteFile
        .mockResolvedValueOnce(undefined as any)
        .mockRejectedValueOnce(new Error('Write failed'))

      const updates = [
        { captionPath: '/test/img1.txt', caption: 'caption1' },
        { captionPath: '/test/img2.txt', caption: 'caption2' }
      ]

      await expect(saveHandler(null, updates)).rejects.toThrow()
    })
  })
})
