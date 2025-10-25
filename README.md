# Caption Studio

A powerful Electron-based application for managing image and video captions in training datasets. Perfect for machine learning practitioners working with image datasets for diffusion models, video generation models, and other computer vision tasks.

## Features

### Core Functionality

- **Folder-based workflow**: Open any folder and recursively load all media files with their captions
- **Supported formats**: 
  - **Images**: JPG, JPEG, PNG, WEBP
  - **Videos**: MP4, WEBM, MOV
- **In-memory editing**: All caption changes are kept in memory until you explicitly save
- **Modified indicators**: Visual indicators show which files have unsaved changes
- **Caption file format**: Text captions stored as `filename.txt` alongside media files
- **Auto-trim captions**: Leading and trailing whitespace is automatically removed when saving

### AI-Powered Captioning

- **Auto Captioner**: Generate captions using LLM vision models for both images and videos
- **Multiple providers**: Support for custom OpenAI-compatible APIs (LM Studio, Ollama) and OpenAI ChatGPT
- **Batch generation**: Generate captions for multiple selected items (images and videos)
- **Two modes**: Replace existing captions or append to them
- **Configurable parameters**: Adjust temperature, max tokens, and system prompts
- **Visual progress**: Progress bar and status display during batch captioning
- **Cancellable operations**: Stop batch generation at any time
- **Video captioning**: 
  - Single video: Captures current visible frame when viewing
  - Batch videos: Automatically uses first frame for captioning

### Multi-Select Operations

- **Select multiple items**: Ctrl/Cmd+Click to toggle, Shift+Click for range selection
- **Batch editing**: Edit captions for multiple files simultaneously
- **Smart caption display**: Shows common caption if all selected items match, or placeholder for mixed captions
- **Ctrl/Cmd+A**: Select all items in the current dataset

### User Interface

- **Three-panel layout**:
  - Left: Thumbnail list with visual indicators for modified captions, selection states, and video badges
  - Center: Media viewer - Canvas-based image viewer with zoom/pan, or video player with controls
  - Right: Caption editor with real-time change tracking
- **Dataset info**: Shows total file count and dataset size in top bar
- **Keyboard-first workflow**: Navigate and edit entirely with keyboard shortcuts
- **Dark/Light themes**: Easy on the eyes with system theme support

### Media Viewing

**Image Viewer:**
- **Canvas-based viewer**: True zoom with high-quality rendering
- **Mouse wheel zoom**: Zoom from 100% to 500%, centered on cursor position
- **Click & drag to pan**: Pan around zoomed images with constrained boundaries
- **Click zoom percentage**: Click the zoom indicator to reset to fit-to-screen
- **Smooth interactions**: Optimized rendering with proper HiDPI support

**Video Player:**
- **Looping playback**: Videos loop automatically by default
- **Play/pause controls**: Click video or use control button
- **Timeline seeking**: Scrub through video with the timeline slider
- **Time display**: Shows current time and total duration
- **Keyboard controls**: Space to play/pause, arrow keys to skip ±5 seconds
- **Middle-frame thumbnails**: Thumbnail list shows the middle frame of each video

### Safety Features

- **Unsaved changes warning**: Prompted before closing folder or app with unsaved changes
- **Modified counter**: Shows number of files with unsaved captions
- **Discard changes confirmation**: Confirm before discarding all unsaved changes
- **Batch save**: Save all modified captions at once
- **Smart folder reopening**: Only auto-reopens last folder if app was closed with folder open (not if you explicitly closed the folder)

### System Tray Integration

- **Veil feature**: Hide the application window to the system tray with a configurable keyboard shortcut
- **Tray menu**: Right-click the tray icon to access "Show" and "Quit" options
- **Unsaved changes protection**: Quitting from the tray prompts you to save if there are unsaved changes

## Keyboard Shortcuts

### Navigation

- `↑` or `K`: Previous item
- `↓` or `J`: Next item
- `Home`: Jump to first item
- `End`: Jump to last item
- `Ctrl/Cmd + Enter`: Toggle focus between navigation and caption editor
- `Tab`: Focus caption editor
- `Escape`: Unfocus caption editor (return to navigation mode)

### Selection

- `Click`: Select single item
- `Ctrl/Cmd + Click`: Toggle item selection
- `Shift + Click`: Select range from last selected to clicked item
- `Ctrl/Cmd + A`: Select all items (works outside text inputs)

### Image Viewing

- `Mouse Wheel` (over image): Zoom in/out (100% to 500%, zoom centered on mouse position)
- `Click & Drag` (when zoomed): Pan around the zoomed image (cursor changes to hand)
- `Click zoom percentage`: Reset zoom to fit image to screen
- **Pan boundaries**: Panning is constrained to image edges (no empty space visible)
- **Auto-scroll thumbnails**: The thumbnail list automatically scrolls to keep selected item visible

### Video Viewing

- `Click video` or `Space`: Play/pause video
- `Arrow Left`: Skip backward 5 seconds
- `Arrow Right`: Skip forward 5 seconds
- `Timeline slider`: Click or drag to seek to specific time
- **Note**: Videos loop automatically and are muted by default

### Actions

- `Ctrl/Cmd + O`: Open folder
- `Ctrl/Cmd + S`: Save all captions
- `Ctrl/Cmd + W`: Close current folder
- `Ctrl/Cmd + Shift + R`: Discard all unsaved changes (with confirmation)
- `Ctrl/Cmd + ,`: Open preferences
- `Shift + F12` (configurable): Veil to system tray (hide window)

### Fast Workflow

1. Use `↑`/`↓` or `J`/`K` to navigate between images and videos
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

1. Select one or more images/videos
2. Click "Generate Caption" button (or the dropdown for append mode)
3. **For single videos**: 
   - Pause or scrub to the frame you want to caption
   - Click "Generate Caption" to caption the current visible frame
4. **For batch operations**:
   - Progress bar shows current status
   - Filename of current item being processed
   - Videos automatically use their first frame
   - Click "Cancel" to stop batch generation
5. Generated captions automatically update the selected items

## Usage

1. **Open a folder**: Click "📁 Open Folder" or press `Ctrl/Cmd+O`
2. **Navigate media**: Use arrow keys or J/K to move between images and videos
3. **Select multiple**: Use Ctrl/Cmd+Click or Shift+Click for batch operations
4. **Edit captions**: Click the caption area or press Tab to start editing
5. **Generate captions**: Use the Auto Captioner for AI-powered image captioning
6. **Save changes**: Press `Ctrl/Cmd+S` or click "💾 Save All"
7. **Track progress**: Modified files show an orange indicator in the thumbnail list
8. **Video playback**: Click video to play/pause, use controls to seek through timeline

## Caption File Structure

Captions are stored as `.txt` files alongside media files with the same base name:

```
dataset/
├── photo.jpg
├── photo.txt
├── video_clip.mp4
├── video_clip.txt
├── subfolder/
│   ├── image001.png
│   ├── image001.txt
│   ├── video002.webm
│   └── video002.txt
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
