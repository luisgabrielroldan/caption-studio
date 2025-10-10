import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ImageItem {
  id: string // unique identifier
  path: string // full path to image
  filename: string // just the filename
  captionPath: string // path to caption file
  originalCaption: string // caption loaded from disk
  currentCaption: string // current caption in editor
}

export const useCaptionStore = defineStore('caption', () => {
  // State
  const images = ref<ImageItem[]>([])
  const currentIndex = ref<number>(0)
  const folderPath = ref<string>('')
  const isLoading = ref<boolean>(false)

  // Computed
  const currentImage = computed(() => {
    if (images.value.length === 0 || currentIndex.value < 0) return null
    return images.value[currentIndex.value] || null
  })

  const hasUnsavedChanges = computed(() => {
    return images.value.some(img => img.originalCaption !== img.currentCaption)
  })

  const modifiedImages = computed(() => {
    return new Set(
      images.value
        .filter(img => img.originalCaption !== img.currentCaption)
        .map(img => img.id)
    )
  })

  const totalImages = computed(() => images.value.length)

  const hasImages = computed(() => images.value.length > 0)

  // Actions
  function setImages(newImages: ImageItem[]) {
    images.value = newImages
    currentIndex.value = newImages.length > 0 ? 0 : -1
  }

  function setFolderPath(path: string) {
    folderPath.value = path
  }

  function setCurrentIndex(index: number) {
    if (index >= 0 && index < images.value.length) {
      currentIndex.value = index
    }
  }

  function nextImage() {
    if (currentIndex.value < images.value.length - 1) {
      currentIndex.value++
    }
  }

  function previousImage() {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function updateCurrentCaption(caption: string) {
    if (currentImage.value) {
      currentImage.value.currentCaption = caption
    }
  }

  function resetChanges() {
    images.value.forEach(img => {
      img.currentCaption = img.originalCaption
    })
  }

  function markAsSaved() {
    images.value.forEach(img => {
      img.originalCaption = img.currentCaption
    })
  }

  function clearAll() {
    images.value = []
    currentIndex.value = -1
    folderPath.value = ''
  }

  return {
    // State
    images,
    currentIndex,
    folderPath,
    isLoading,
    // Computed
    currentImage,
    hasUnsavedChanges,
    modifiedImages,
    totalImages,
    hasImages,
    // Actions
    setImages,
    setFolderPath,
    setCurrentIndex,
    nextImage,
    previousImage,
    updateCurrentCaption,
    resetChanges,
    markAsSaved,
    clearAll
  }
})

