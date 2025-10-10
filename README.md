# Caption Studio

A powerful Electron-based application for managing image captions in training datasets. Perfect for machine learning practitioners working with image datasets for diffusion models and other computer vision tasks.

## Features

### Core Functionality
- **Folder-based workflow**: Open any folder and recursively load all images with their captions
- **Supported formats**: JPG, JPEG, PNG, WEBP
- **In-memory editing**: All caption changes are kept in memory until you explicitly save
- **Modified indicators**: Visual indicators show which images have unsaved changes
- **Caption file format**: Text captions stored as `image_name.txt` alongside `image_name.jpg`

### User Interface
- **Three-panel layout**:
  - Left: Thumbnail list with visual indicators for modified captions
  - Center: Large image preview with aspect ratio preservation
  - Bottom: Caption editor with real-time change tracking
- **Keyboard-first workflow**: Navigate and edit entirely with keyboard shortcuts
- **Dark theme**: Easy on the eyes during long captioning sessions

### Safety Features
- **Unsaved changes warning**: Prompted before closing folder or app with unsaved changes
- **Modified counter**: Shows number of images with unsaved captions
- **Batch save**: Save all modified captions at once

## Keyboard Shortcuts

### Navigation
- `↑` or `K`: Previous image
- `↓` or `J`: Next image
- `Home`: Jump to first image
- `End`: Jump to last image
- `Ctrl/Cmd + Enter`: Toggle focus between navigation and caption editor
- `Tab`: Focus caption editor
- `Escape`: Unfocus caption editor (return to navigation mode)

### Image Viewing
- `Mouse Wheel` (over image): Zoom in/out (100% to 500%, zoom centered on mouse position)
- `Click & Drag` (when zoomed): Pan around the zoomed image (cursor changes to hand)
- `Reset Zoom Button`: Click to return to 100% zoom (appears when zoomed)
- **Pan boundaries**: Panning is constrained to image edges (no empty space visible)
- **Auto-scroll thumbnails**: The thumbnail list automatically scrolls to keep selected image visible

### Actions
- `Ctrl/Cmd + O`: Open folder
- `Ctrl/Cmd + S`: Save all captions
- `Ctrl/Cmd + W`: Close current folder

### Fast Workflow
1. Use `↑`/`↓` or `J`/`K` to navigate between images
2. Press `Ctrl/Cmd + Enter` or `Tab` to focus the caption editor
3. Type your caption
4. Press `Ctrl/Cmd + Enter` or `Escape` to return to navigation mode
5. Continue navigating with arrow keys or J/K

## Usage

1. **Open a folder**: Click "📁 Open Folder" or press `Ctrl/Cmd+O`
2. **Navigate images**: Use arrow keys or J/K to move between images
3. **Edit captions**: Click the caption area or press Tab to start editing
4. **Save changes**: Press `Ctrl/Cmd+S` or click "💾 Save All"
5. **Track progress**: Modified images show an orange indicator in the thumbnail list

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

## Future Enhancements

- [ ] Tag-based caption mode (Booru-style tags)
- [ ] Dataset-wide tag inventory and autocomplete
- [ ] Multiple view modes (different panel arrangements)
- [ ] Filter images (show only uncaptioned, modified, etc.)
- [ ] Search functionality
- [ ] Undo/redo support
- [ ] Image metadata display
- [ ] Export caption statistics

## Technical Stack

- **Electron**: Cross-platform desktop framework
- **Vue 3**: Modern reactive UI framework
- **Pinia**: State management
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling

## License

MIT
