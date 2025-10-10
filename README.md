# Caption Studio

A powerful Electron-based application for managing image captions in training datasets. Perfect for machine learning practitioners working with image datasets for diffusion models and other computer vision tasks.

## Features

### Core Functionality

- **Folder-based workflow**: Open any folder and recursively load all images with their captions
- **Supported formats**: JPG, JPEG, PNG, WEBP
- **In-memory editing**: All caption changes are kept in memory until you explicitly save
- **Modified indicators**: Visual indicators show which images have unsaved changes
- **Caption file format**: Text captions stored as `image_name.txt` alongside `image_name.jpg`
- **Auto-trim captions**: Leading and trailing whitespace is automatically removed when saving

### AI-Powered Captioning

- **Auto Captioner**: Generate captions using LLM vision models
- **Multiple providers**: Support for custom OpenAI-compatible APIs (LM Studio, Ollama) and OpenAI ChatGPT
- **Batch generation**: Generate captions for multiple selected images
- **Two modes**: Replace existing captions or append to them
- **Configurable parameters**: Adjust temperature, max tokens, and system prompts
- **Visual progress**: Progress bar and status display during batch captioning
- **Cancellable operations**: Stop batch generation at any time

### Multi-Select Operations

- **Select multiple images**: Ctrl/Cmd+Click to toggle, Shift+Click for range selection
- **Batch editing**: Edit captions for multiple images simultaneously
- **Smart caption display**: Shows common caption if all selected images match, or placeholder for mixed captions
- **Ctrl/Cmd+A**: Select all images in the current dataset

### User Interface

- **Three-panel layout**:
  - Left: Thumbnail list with visual indicators for modified captions and selection states
  - Center: Canvas-based image preview with true zoom and aspect ratio preservation
  - Right: Caption editor with real-time change tracking
- **Dataset info**: Shows total image count and dataset size in top bar
- **Keyboard-first workflow**: Navigate and edit entirely with keyboard shortcuts
- **Dark/Light themes**: Easy on the eyes with system theme support

### Image Viewing

- **Canvas-based viewer**: True zoom with high-quality rendering
- **Mouse wheel zoom**: Zoom from 100% to 500%, centered on cursor position
- **Click & drag to pan**: Pan around zoomed images with constrained boundaries
- **Click zoom percentage**: Click the zoom indicator to reset to fit-to-screen
- **Smooth interactions**: Optimized rendering with proper HiDPI support

### Safety Features

- **Unsaved changes warning**: Prompted before closing folder or app with unsaved changes
- **Modified counter**: Shows number of images with unsaved captions
- **Discard changes confirmation**: Confirm before discarding all unsaved changes
- **Batch save**: Save all modified captions at once
- **Smart folder reopening**: Only auto-reopens last folder if app was closed with folder open (not if you explicitly closed the folder)

### System Tray Integration

- **Veil feature**: Hide the application window to the system tray with a configurable keyboard shortcut
- **Tray menu**: Right-click the tray icon to access "Show" and "Quit" options
- **Unsaved changes protection**: Quitting from the tray prompts you to save if there are unsaved changes

## Keyboard Shortcuts

### Navigation

- `↑` or `K`: Previous image
- `↓` or `J`: Next image
- `Home`: Jump to first image
- `End`: Jump to last image
- `Ctrl/Cmd + Enter`: Toggle focus between navigation and caption editor
- `Tab`: Focus caption editor
- `Escape`: Unfocus caption editor (return to navigation mode)

### Selection

- `Click`: Select single image
- `Ctrl/Cmd + Click`: Toggle image selection
- `Shift + Click`: Select range from last selected to clicked image
- `Ctrl/Cmd + A`: Select all images (works outside text inputs)

### Image Viewing

- `Mouse Wheel` (over image): Zoom in/out (100% to 500%, zoom centered on mouse position)
- `Click & Drag` (when zoomed): Pan around the zoomed image (cursor changes to hand)
- `Click zoom percentage`: Reset zoom to fit image to screen
- **Pan boundaries**: Panning is constrained to image edges (no empty space visible)
- **Auto-scroll thumbnails**: The thumbnail list automatically scrolls to keep selected image visible

### Actions

- `Ctrl/Cmd + O`: Open folder
- `Ctrl/Cmd + S`: Save all captions
- `Ctrl/Cmd + W`: Close current folder
- `Ctrl/Cmd + Shift + R`: Discard all unsaved changes (with confirmation)
- `Ctrl/Cmd + ,`: Open preferences
- `Shift + F12` (configurable): Veil to system tray (hide window)

### Fast Workflow

1. Use `↑`/`↓` or `J`/`K` to navigate between images
2. Press `Ctrl/Cmd + Enter` or `Tab` to focus the caption editor
3. Type your caption
4. Press `Ctrl/Cmd + Enter` or `Escape` to return to navigation mode
5. Continue navigating with arrow keys or J/K

## Auto Captioner Setup

### Custom Provider (LM Studio, Ollama, etc.)

1. Open Settings (`Ctrl/Cmd + ,`)
2. Go to "Auto Captioner" tab
3. Select "Custom" as provider
4. Configure:
   - **Base URL**: Your API endpoint (e.g., `http://127.0.0.1:1234/v1`)
   - **Model Name**: Your vision model (e.g., `llava:latest`)
5. Adjust generation parameters:
   - **Temperature**: 0-2 (higher = more creative)
   - **Max Caption Length**: 50-1000 tokens

### ChatGPT Provider

1. Open Settings (`Ctrl/Cmd + ,`)
2. Go to "Auto Captioner" tab
3. Select "ChatGPT" as provider
4. Enter your OpenAI API Key
5. Select model: `gpt-4o` or `gpt-4o-mini` (recommended)
6. Adjust generation parameters as needed

### Using Auto Captioner

1. Select one or more images
2. Click "Generate Caption" button (or the dropdown for append mode)
3. For batch operations:
   - Progress bar shows current status
   - Filename of current image being processed
   - Click "Cancel" to stop batch generation
4. Generated captions automatically update the selected images

## Usage

1. **Open a folder**: Click "📁 Open Folder" or press `Ctrl/Cmd+O`
2. **Navigate images**: Use arrow keys or J/K to move between images
3. **Select multiple**: Use Ctrl/Cmd+Click or Shift+Click for batch operations
4. **Edit captions**: Click the caption area or press Tab to start editing
5. **Generate captions**: Use the Auto Captioner for AI-powered captioning
6. **Save changes**: Press `Ctrl/Cmd+S` or click "💾 Save All"
7. **Track progress**: Modified images show an orange indicator in the thumbnail list

## Caption File Structure

For an image file `photo.jpg`, the caption is stored in `photo.txt` in the same directory:

```
dataset/
├── photo.jpg
├── photo.txt
├── subfolder/
│   ├── image001.png
│   └── image001.txt
```

If a caption file doesn't exist, the caption editor will be empty and a new file will be created when you save.

## Settings

Access settings via `Ctrl/Cmd + ,` or the application menu. Configurable options include:

### General Settings

- **Font Size**: Caption editor font size (10-24px)
- **Line Height**: Caption editor line height (1.0-3.0)
- **Theme**: Dark, Light, or System (follows OS preference)
- **Remember Last Folder**: Automatically reopen the last opened folder on launch
- **Veil Shortcut**: Customize the keyboard shortcut to hide the app to system tray

### Auto Captioner Settings

- **Provider**: Choose between Custom (local/self-hosted) or ChatGPT
- **System Prompt**: Customize the instructions given to the AI
- **Temperature**: Control randomness (0 = deterministic, 2 = very creative)
- **Max Caption Length**: Set maximum tokens for generated captions
- **Custom Provider**:
  - Base URL for OpenAI-compatible API
  - Model name (e.g., `llava:latest`, `cogvlm2:latest`)
- **ChatGPT Provider**:
  - API Key for OpenAI access
  - Model selection: `gpt-4o` or `gpt-4o-mini`

## Development

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
# For macOS
npm run build:mac

# For Windows
npm run build:win

# For Linux
npm run build:linux
```

### Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run lint -- --fix
```

## Technical Stack

- **Electron**: Cross-platform desktop framework
- **Vue 3**: Modern reactive UI framework (Composition API)
- **Pinia**: State management
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling
- **electron-builder**: Application packaging
- **OpenAI Node SDK**: LLM integration for auto-captioning

## Architecture

- **Main Process**: Node.js environment for file system operations, IPC handlers
- **Preload Script**: Secure bridge between main and renderer processes
- **Renderer Process**: Vue 3 application with composables for reusable logic
- **Canvas Rendering**: Custom canvas-based image viewer for true zoom
- **State Management**: Pinia stores for centralized state

## License

MIT
