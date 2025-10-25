<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { formatFileSize } from '../utils/formatters'

interface Props {
  videoPath: string
  filename: string
  position: string
  fileSize?: number
}

const props = defineProps<Props>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isLoading = ref(true)
const isSeeking = ref(false)

// Format time to MM:SS
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

// Video metadata loaded
const handleLoadedMetadata = (): void => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
    isLoading.value = false
  }
}

// Video time update
const handleTimeUpdate = (): void => {
  if (videoRef.value && !isSeeking.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

// Toggle play/pause
const togglePlayPause = (): void => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
}

// Handle play event
const handlePlay = (): void => {
  isPlaying.value = true
}

// Handle pause event
const handlePause = (): void => {
  isPlaying.value = false
}

// Handle video error
const handleError = (event: Event): void => {
  const video = event.target as HTMLVideoElement
  const error = video.error
  
  if (error) {
    console.error('[VideoPreview] Video error:', {
      code: error.code,
      message: error.message,
      path: props.videoPath
    })
  }
  
  isLoading.value = false
}

// Handle seeking
const handleSeekStart = (): void => {
  isSeeking.value = true
}

const handleSeek = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const newTime = parseFloat(target.value)
  currentTime.value = newTime

  if (videoRef.value) {
    videoRef.value.currentTime = newTime
  }
}

const handleSeekEnd = (): void => {
  isSeeking.value = false
}

// Keyboard controls
const handleKeyDown = (event: KeyboardEvent): void => {
  if (!videoRef.value) return

  switch (event.code) {
    case 'Space':
      event.preventDefault()
      togglePlayPause()
      break
    case 'ArrowLeft':
      event.preventDefault()
      videoRef.value.currentTime = Math.max(0, videoRef.value.currentTime - 5)
      break
    case 'ArrowRight':
      event.preventDefault()
      videoRef.value.currentTime = Math.min(
        videoRef.value.duration,
        videoRef.value.currentTime + 5
      )
      break
  }
}

// Watch for video path changes
watch(
  () => props.videoPath,
  () => {
    isLoading.value = true
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
  }
)

// Emit duration to parent (for storing in the store)
const emit = defineEmits<{
  durationLoaded: [duration: number]
}>()

watch(duration, (newDuration) => {
  if (newDuration > 0) {
    emit('durationLoaded', newDuration)
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="video-preview">
    <div class="video-container">
      <video
        ref="videoRef"
        :src="`local-image://${encodeURIComponent(videoPath)}`"
        loop
        muted
        crossorigin="anonymous"
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @play="handlePlay"
        @pause="handlePause"
        @click="togglePlayPause"
        @error="handleError"
      />
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
      <div class="video-controls">
        <button class="control-btn play-pause" :title="isPlaying ? 'Pause' : 'Play'" @click.stop="togglePlayPause">
          <span v-if="isPlaying">⏸</span>
          <span v-else>▶</span>
        </button>
        <span class="time-display">{{ formattedCurrentTime }}</span>
        <input
          type="range"
          class="timeline-slider"
          :min="0"
          :max="duration"
          :value="currentTime"
          step="0.1"
          @mousedown="handleSeekStart"
          @input="handleSeek"
          @mouseup="handleSeekEnd"
          @change="handleSeekEnd"
        />
        <span class="time-display">{{ formattedDuration }}</span>
      </div>
    </div>
    <div class="video-info">
      <span class="video-position">{{ position }}</span>
      <span class="video-filename" :title="filename">{{ filename }}</span>
      <div v-if="fileSize" class="video-metadata">
        <span class="metadata-item">{{ formatFileSize(fileSize) }}</span>
        <span v-if="duration > 0" class="metadata-item">{{ formattedDuration }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.video-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  min-height: 0;
}

video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  cursor: pointer;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  backdrop-filter: blur(10px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-container:hover .video-controls {
  opacity: 1;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.time-display {
  font-size: 0.85em;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.timeline-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.timeline-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.timeline-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.timeline-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.video-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  gap: 12px;
}

.video-position {
  font-size: 0.9em;
  color: var(--text-tertiary);
  font-weight: 500;
  white-space: nowrap;
}

.video-filename {
  font-size: 0.85em;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: center;
  min-width: 0;
  padding: 0 8px;
}

.video-metadata {
  display: flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

.metadata-item {
  font-size: 0.8em;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: 1px 4px;
  background: var(--bg-hover);
  border-radius: 3px;
  border: 1px solid var(--border-color);
}
</style>

