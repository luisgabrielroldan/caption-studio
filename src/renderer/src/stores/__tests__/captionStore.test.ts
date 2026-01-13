import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCaptionStore, type ImageItem } from '../captionStore'

describe('captionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const createMockImage = (id: string, caption: string = ''): ImageItem => ({
    id,
    path: `/test/${id}`,
    filename: `${id}.jpg`,
    captionPath: `/test/${id}.txt`,
    originalCaption: caption,
    currentCaption: caption,
    size: 1024,
    mediaType: 'image'
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      const store = useCaptionStore()
      expect(store.images).toEqual([])
      expect(store.currentIndex).toBe(0)
      expect(store.folderPath).toBe('')
      expect(store.hasImages).toBe(false)
      expect(store.hasUnsavedChanges).toBe(false)
      expect(store.hasSelection).toBe(false)
    })
  })

  describe('setImages', () => {
    it('should set images and reset current index', () => {
      const store = useCaptionStore()
      const images = [createMockImage('img1'), createMockImage('img2'), createMockImage('img3')]
      store.setImages(images)
      expect(store.images).toEqual(images)
      expect(store.currentIndex).toBe(0)
      expect(store.hasImages).toBe(true)
    })

    it('should clear selection when setting new images', () => {
      const store = useCaptionStore()
      const images = [createMockImage('img1'), createMockImage('img2')]
      store.setImages(images)
      store.selectSingle(0)
      expect(store.hasSelection).toBe(true)

      store.setImages([createMockImage('img3')])
      expect(store.hasSelection).toBe(false)
    })

    it('should set currentIndex to -1 for empty array', () => {
      const store = useCaptionStore()
      store.setImages([])
      expect(store.currentIndex).toBe(-1)
      expect(store.hasImages).toBe(false)
    })
  })

  describe('navigation', () => {
    beforeEach(() => {
      const store = useCaptionStore()
      store.setImages([createMockImage('img1'), createMockImage('img2'), createMockImage('img3')])
    })

    it('should navigate to next image', () => {
      const store = useCaptionStore()
      expect(store.currentIndex).toBe(0)
      store.nextImage()
      expect(store.currentIndex).toBe(1)
      store.nextImage()
      expect(store.currentIndex).toBe(2)
    })

    it('should not navigate beyond last image', () => {
      const store = useCaptionStore()
      store.setCurrentIndex(2)
      store.nextImage()
      expect(store.currentIndex).toBe(2) // Should stay at last index
    })

    it('should navigate to previous image', () => {
      const store = useCaptionStore()
      store.setCurrentIndex(2)
      store.previousImage()
      expect(store.currentIndex).toBe(1)
      store.previousImage()
      expect(store.currentIndex).toBe(0)
    })

    it('should not navigate before first image', () => {
      const store = useCaptionStore()
      store.setCurrentIndex(0)
      store.previousImage()
      expect(store.currentIndex).toBe(0) // Should stay at first index
    })

    it('should set current index within bounds', () => {
      const store = useCaptionStore()
      store.setCurrentIndex(1)
      expect(store.currentIndex).toBe(1)
    })

    it('should ignore invalid indices', () => {
      const store = useCaptionStore()
      const originalIndex = store.currentIndex
      store.setCurrentIndex(-1)
      expect(store.currentIndex).toBe(originalIndex)
      store.setCurrentIndex(10)
      expect(store.currentIndex).toBe(originalIndex)
    })

    it('should return current image', () => {
      const store = useCaptionStore()
      const images = store.images
      expect(store.currentImage).toBe(images[0])
      store.setCurrentIndex(1)
      expect(store.currentImage).toBe(images[1])
    })

    it('should return null when no images', () => {
      const store = useCaptionStore()
      store.setImages([])
      expect(store.currentImage).toBeNull()
    })
  })

  describe('selection', () => {
    beforeEach(() => {
      const store = useCaptionStore()
      store.setImages([
        createMockImage('img1'),
        createMockImage('img2'),
        createMockImage('img3'),
        createMockImage('img4'),
        createMockImage('img5')
      ])
    })

    it('should toggle selection', () => {
      const store = useCaptionStore()
      expect(store.hasSelection).toBe(false)

      store.toggleSelection(0)
      expect(store.selectedIndices.has(0)).toBe(true)
      expect(store.hasSelection).toBe(true)

      store.toggleSelection(0)
      expect(store.selectedIndices.has(0)).toBe(false)
      expect(store.hasSelection).toBe(false)
    })

    it('should select range correctly', () => {
      const store = useCaptionStore()
      store.selectRange(1, 3)
      expect(store.selectedIndices.has(1)).toBe(true)
      expect(store.selectedIndices.has(2)).toBe(true)
      expect(store.selectedIndices.has(3)).toBe(true)
      expect(store.selectedIndices.size).toBe(3)
    })

    it('should select range in reverse order', () => {
      const store = useCaptionStore()
      store.selectRange(3, 1)
      expect(store.selectedIndices.has(1)).toBe(true)
      expect(store.selectedIndices.has(2)).toBe(true)
      expect(store.selectedIndices.has(3)).toBe(true)
      expect(store.selectedIndices.size).toBe(3)
    })

    it('should select single item and clear others', () => {
      const store = useCaptionStore()
      store.toggleSelection(0)
      store.toggleSelection(1)
      expect(store.selectedIndices.size).toBe(2)

      store.selectSingle(2)
      expect(store.selectedIndices.size).toBe(1)
      expect(store.selectedIndices.has(2)).toBe(true)
      expect(store.selectedIndices.has(0)).toBe(false)
      expect(store.selectedIndices.has(1)).toBe(false)
    })

    it('should select all items', () => {
      const store = useCaptionStore()
      store.selectAll()
      expect(store.selectedIndices.size).toBe(5)
      expect(store.hasSelection).toBe(true)
    })

    it('should clear selection', () => {
      const store = useCaptionStore()
      store.selectAll()
      expect(store.hasSelection).toBe(true)

      store.clearSelection()
      expect(store.selectedIndices.size).toBe(0)
      expect(store.hasSelection).toBe(false)
    })

    it('should ignore invalid indices in toggleSelection', () => {
      const store = useCaptionStore()
      store.toggleSelection(-1)
      store.toggleSelection(10)
      expect(store.selectedIndices.size).toBe(0)
    })

    it('should return selected images', () => {
      const store = useCaptionStore()
      store.selectSingle(0)
      store.toggleSelection(2)

      const selected = store.selectedImages
      expect(selected.length).toBe(2)
      expect(selected[0].id).toBe('img1')
      expect(selected[1].id).toBe('img3')
    })

    it('should handle range selection with out-of-bounds indices', () => {
      const store = useCaptionStore()
      store.selectRange(-1, 10)
      // Should only select valid indices (0-4)
      expect(store.selectedIndices.size).toBe(5)
    })
  })

  describe('caption tracking', () => {
    it('should detect unsaved changes', () => {
      const store = useCaptionStore()
      store.setImages([createMockImage('img1', 'original caption')])
      expect(store.hasUnsavedChanges).toBe(false)

      store.updateCurrentCaption('modified caption')
      expect(store.hasUnsavedChanges).toBe(true)
    })

    it('should track modified images', () => {
      const store = useCaptionStore()
      store.setImages([
        createMockImage('img1', 'caption1'),
        createMockImage('img2', 'caption2'),
        createMockImage('img3', 'caption3')
      ])

      store.setCurrentIndex(0)
      store.updateCurrentCaption('modified1')
      store.setCurrentIndex(1)
      store.updateCurrentCaption('modified2')

      expect(store.modifiedImages.has('img1')).toBe(true)
      expect(store.modifiedImages.has('img2')).toBe(true)
      expect(store.modifiedImages.has('img3')).toBe(false)
    })

    it('should mark as saved and trim captions', () => {
      const store = useCaptionStore()
      store.setImages([createMockImage('img1', 'original')])
      store.updateCurrentCaption('  modified with spaces  ')

      expect(store.hasUnsavedChanges).toBe(true)
      store.markAsSaved()

      expect(store.hasUnsavedChanges).toBe(false)
      expect(store.images[0].currentCaption).toBe('modified with spaces')
      expect(store.images[0].originalCaption).toBe('modified with spaces')
    })

    it('should reset all changes', () => {
      const store = useCaptionStore()
      store.setImages([createMockImage('img1', 'original1'), createMockImage('img2', 'original2')])

      store.setCurrentIndex(0)
      store.updateCurrentCaption('modified1')
      store.setCurrentIndex(1)
      store.updateCurrentCaption('modified2')

      expect(store.hasUnsavedChanges).toBe(true)
      store.resetChanges()

      expect(store.hasUnsavedChanges).toBe(false)
      expect(store.images[0].currentCaption).toBe('original1')
      expect(store.images[1].currentCaption).toBe('original2')
    })

    it('should update caption for selected items', () => {
      const store = useCaptionStore()
      store.setImages([
        createMockImage('img1', 'caption1'),
        createMockImage('img2', 'caption2'),
        createMockImage('img3', 'caption3')
      ])

      store.selectSingle(0)
      store.toggleSelection(2)
      store.updateCaptionForSelected('new caption')

      expect(store.images[0].currentCaption).toBe('new caption')
      expect(store.images[1].currentCaption).toBe('caption2') // Not selected
      expect(store.images[2].currentCaption).toBe('new caption')
    })
  })

  describe('computed properties', () => {
    it('should calculate total images', () => {
      const store = useCaptionStore()
      store.setImages([createMockImage('img1'), createMockImage('img2'), createMockImage('img3')])
      expect(store.totalImages).toBe(3)
    })

    it('should calculate total size', () => {
      const store = useCaptionStore()
      const img1 = createMockImage('img1')
      img1.size = 1024
      const img2 = createMockImage('img2')
      img2.size = 2048
      store.setImages([img1, img2])
      expect(store.totalSize).toBe(3072)
    })

    it('should detect video media type', () => {
      const store = useCaptionStore()
      const video: ImageItem = {
        ...createMockImage('video1'),
        mediaType: 'video',
        duration: 120
      }
      store.setImages([createMockImage('img1'), video])

      expect(store.isCurrentMediaVideo).toBe(false)
      store.setCurrentIndex(1)
      expect(store.isCurrentMediaVideo).toBe(true)
    })
  })

  describe('clearAll', () => {
    it('should clear all state', () => {
      const store = useCaptionStore()
      store.setImages([createMockImage('img1')])
      store.setFolderPath('/test/path')
      store.selectSingle(0)
      store.updateCurrentCaption('modified')

      store.clearAll()

      expect(store.images).toEqual([])
      expect(store.folderPath).toBe('')
      expect(store.currentIndex).toBe(-1)
      expect(store.hasSelection).toBe(false)
      expect(store.lastSelectedIndex).toBeNull()
    })
  })
})
