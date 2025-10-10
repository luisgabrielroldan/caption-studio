# Configuration System Documentation

## Overview

Caption Studio now has a comprehensive configuration management system using `electron-store` for persistent user settings across sessions.

## Architecture

### Main Process (`src/main/config.ts`)
- Uses `electron-store` for persistent storage
- Defines typed configuration schema
- Provides IPC handlers for renderer access
- Auto-saves window bounds (size and position)

### Preload (`src/preload/index.ts`)
- Exposes config APIs via `window.api.config`
- Type-safe configuration access

### Renderer Composable (`src/renderer/src/composables/useConfig.ts`)
- Easy-to-use composable for accessing config
- Reactive config values
- Async get/set operations

## Configuration Schema

```typescript
{
  // Window settings
  window: {
    width: number        // Default: 1400
    height: number       // Default: 900
    x?: number          // Window X position
    y?: number          // Window Y position
  },

  // Panel settings
  thumbnailPanelWidth: number  // Default: 280

  // Recent folders
  recentFolders: string[]      // Array of recent folder paths
  maxRecentFolders: number     // Default: 10

  // Editor settings
  editor: {
    fontSize: number           // Default: 14
    lineHeight: number         // Default: 1.6
    autoSave: boolean         // Default: false
    autoSaveDelay: number     // Default: 2000ms
  },

  // UI preferences
  ui: {
    showImageInfo: boolean          // Default: true
    showThumbnailFilenames: boolean // Default: true
    thumbnailSize: 'small' | 'medium' | 'large'  // Default: 'medium'
    theme: 'dark' | 'light' | 'system'           // Default: 'dark'
  },

  // Behavior
  behavior: {
    warnOnUnsavedChanges: boolean  // Default: true
    rememberLastFolder: boolean    // Default: true
    lastOpenedFolder?: string      // Path to last opened folder
  }
}
```

## Usage Examples

### In Renderer Components/Composables

```typescript
import { useConfig } from './composables/useConfig'

// Basic usage
const config = useConfig()

// Get a value
const fontSize = await config.get('editor.fontSize')

// Set a value
await config.set('editor.fontSize', 16)

// Get all config
const allConfig = await config.getAll()

// Reset to defaults
await config.reset()

// Recent folders
const recentFolders = await config.getRecentFolders()
await config.addRecentFolder('/path/to/folder')

// Create reactive config value
const { value: panelWidth, save } = config.createReactive('thumbnailPanelWidth', 280)
// Use panelWidth.value in templates
// Call save() when you want to persist changes
```

### Automatic Features

1. **Window Size & Position**
   - Automatically restored on app launch
   - Automatically saved on resize/move
   - Respects maximized/minimized state

2. **Thumbnail Panel Width**
   - Now uses config instead of localStorage
   - Persists across sessions
   - Integrated with `useResizableSplitter`

3. **Recent Folders**
   - Automatically added when opening folders
   - Limited to 10 most recent
   - Duplicate prevention

4. **Last Opened Folder**
   - Optionally remembers last folder
   - Can be used to auto-open on launch

## Configuration Storage Location

The configuration file is stored at:
- **macOS**: `~/Library/Application Support/caption-studio/config.json`
- **Windows**: `%APPDATA%\caption-studio\config.json`
- **Linux**: `~/.config/caption-studio/config.json`

## API Reference

### Main Process

```typescript
import { store } from './config'

// Direct access
const value = store.get('someKey')
store.set('someKey', value)

// Register IPC handlers
registerConfigHandlers()
```

### Renderer Process

```typescript
// Via window.api
window.api.config.get(key)
window.api.config.set(key, value)
window.api.config.getAll()
window.api.config.reset()
window.api.config.addRecentFolder(path)
window.api.config.getRecentFolders()

// Via composable (recommended)
const config = useConfig()
await config.get('key')
await config.set('key', value)
```

## Integration Status

### ✅ Implemented
- Window size and position persistence
- Thumbnail panel width persistence
- Recent folders tracking
- Last opened folder tracking
- Config storage and retrieval
- Type-safe configuration schema

### 🚧 Ready for Implementation
- Auto-save feature
- Editor font size customization
- Theme switching (dark/light/system)
- Thumbnail size options
- Show/hide UI elements
- Custom keyboard shortcuts

### 📋 Future Enhancements
- Preferences UI dialog
- Import/Export configuration
- Multiple configuration profiles
- Configuration validation
- Migration system for config updates
- Per-project settings

## Migration from localStorage

Updated components:
- `useResizableSplitter`: Now uses config instead of localStorage
- `useFileOperations`: Tracks recent folders in config

## Best Practices

1. **Always use the composable** in renderer code
2. **Use typed keys** from the schema
3. **Provide defaults** when getting values
4. **Batch updates** when changing multiple values
5. **Don't store sensitive data** in config

## Example: Creating a Settings Component

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfig } from '../composables/useConfig'

const config = useConfig()
const fontSize = ref(14)
const autoSave = ref(false)

onMounted(async () => {
  fontSize.value = await config.get('editor.fontSize')
  autoSave.value = await config.get('editor.autoSave')
})

const saveSettings = async () => {
  await config.set('editor.fontSize', fontSize.value)
  await config.set('editor.autoSave', autoSave.value)
  alert('Settings saved!')
}
</script>

<template>
  <div class="settings">
    <label>
      Font Size:
      <input v-model.number="fontSize" type="number" min="10" max="24" />
    </label>
    
    <label>
      <input v-model="autoSave" type="checkbox" />
      Enable Auto-save
    </label>
    
    <button @click="saveSettings">Save Settings</button>
  </div>
</template>
```

## Notes

- Configuration is immediately persisted to disk on every change
- The store is crash-resistant and atomic
- All config operations are asynchronous in the renderer
- Config keys use dot notation for nested values (e.g., 'editor.fontSize')
- The system is ready for future expansion without breaking changes

