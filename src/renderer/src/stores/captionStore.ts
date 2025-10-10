import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ImageItem {
  id: string // unique identifier
  path: string // full path to image
  filename: string // just the filename
  captionPath: string // path to caption file
  originalCaption: string // caption loaded from disk
  currentCaption: string // current caption in editor
  size: number // file size in bytes
}

export const useCaptionStore = defineStore('caption', () => {
  // State
  const images = ref<ImageItem[]>([])
  const currentIndex = ref<number>(0)
  const folderPath = ref<string>('')
  const isLoading = ref<boolean>(false)
  const selectedIndices = ref<Set<number>>(new Set())
  const lastSelectedIndex = ref<number | null>(null)
  const isBatchGenerating = ref<boolean>(false)

  // Computed
  const currentImage = computed(() => {
    if (images.value.length === 0 || currentIndex.value < 0) return null
    return images.value[currentIndex.value] || null
  })

  const hasUnsavedChanges = computed(() => {
    return images.value.some((img) => img.originalCaption !== img.currentCaption)
  })

  const modifiedImages = computed(() => {
    return new Set(
      images.value.filter((img) => img.originalCaption !== img.currentCaption).map((img) => img.id)
    )
  })

  const totalImages = computed(() => images.value.length)

  const totalSize = computed(() => {
    return images.value.reduce((sum, img) => sum + img.size, 0)
  })

  const hasImages = computed(() => images.value.length > 0)

  const selectedImages = computed(() => {
    return Array.from(selectedIndices.value)
      .filter((index) => index >= 0 && index < images.value.length)
      .map((index) => images.value[index])
  })

  const hasSelection = computed(() => selectedIndices.value.size > 0)

  // Actions
  function setImages(newImages: ImageItem[]): void {
    images.value = newImages
    currentIndex.value = newImages.length > 0 ? 0 : -1
    // Clear selection when loading new images
    selectedIndices.value.clear()
    lastSelectedIndex.value = null
  }

  function setFolderPath(path: string): void {
    folderPath.value = path
  }

  function setCurrentIndex(index: number): void {
    if (index >= 0 && index < images.value.length) {
      currentIndex.value = index
    }
  }

  function nextImage(): void {
    if (currentIndex.value < images.value.length - 1) {
      currentIndex.value++
    }
  }

  function previousImage(): void {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function updateCurrentCaption(caption: string): void {
    if (currentImage.value) {
      currentImage.value.currentCaption = caption
    }
  }

  function resetChanges(): void {
    images.value.forEach((img) => {
      img.currentCaption = img.originalCaption
    })
  }

  function markAsSaved(): void {
    images.value.forEach((img) => {
      // Trim captions when marking as saved to ensure consistency with saved files
      const trimmedCaption = img.currentCaption.trim()
      img.currentCaption = trimmedCaption
      img.originalCaption = trimmedCaption
    })
  }

  function clearAll(): void {
    images.value = []
    currentIndex.value = -1
    folderPath.value = ''
    selectedIndices.value.clear()
    lastSelectedIndex.value = null
  }

  function toggleSelection(index: number): void {
    if (index < 0 || index >= images.value.length) return

    if (selectedIndices.value.has(index)) {
      selectedIndices.value.delete(index)
    } else {
      selectedIndices.value.add(index)
    }
    lastSelectedIndex.value = index
  }

  function selectRange(fromIndex: number, toIndex: number): void {
    const start = Math.min(fromIndex, toIndex)
    const end = Math.max(fromIndex, toIndex)

    selectedIndices.value.clear()
    for (let i = start; i <= end; i++) {
      if (i >= 0 && i < images.value.length) {
        selectedIndices.value.add(i)
      }
    }
    lastSelectedIndex.value = toIndex
  }

  function selectSingle(index: number): void {
    if (index < 0 || index >= images.value.length) return

    selectedIndices.value.clear()
    selectedIndices.value.add(index)
    lastSelectedIndex.value = index
  }

  function selectAll(): void {
    selectedIndices.value.clear()
    for (let i = 0; i < images.value.length; i++) {
      selectedIndices.value.add(i)
    }
    if (images.value.length > 0) {
      lastSelectedIndex.value = images.value.length - 1
    }
  }

  function clearSelection(): void {
    selectedIndices.value.clear()
    lastSelectedIndex.value = null
  }

  function updateCaptionForSelected(caption: string): void {
    selectedIndices.value.forEach((index) => {
      if (index >= 0 && index < images.value.length) {
        images.value[index].currentCaption = caption
      }
    })
  }

  function setBatchGenerating(value: boolean): void {
    isBatchGenerating.value = value
  }

  return {
    // State
    images,
    currentIndex,
    folderPath,
    isLoading,
    selectedIndices,
    lastSelectedIndex,
    isBatchGenerating,
    // Computed
    currentImage,
    hasUnsavedChanges,
    modifiedImages,
    totalImages,
    totalSize,
    hasImages,
    selectedImages,
    hasSelection,
    // Actions
    setImages,
    setFolderPath,
    setCurrentIndex,
    nextImage,
    previousImage,
    updateCurrentCaption,
    resetChanges,
    markAsSaved,
    clearAll,
    toggleSelection,
    selectRange,
    selectSingle,
    selectAll,
    clearSelection,
    updateCaptionForSelected,
    setBatchGenerating
  }
})
