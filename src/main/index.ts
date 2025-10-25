import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  protocol,
  Tray,
  Menu,
  nativeImage,
  dialog
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerImageHandlers } from './imageHandler'
import { createApplicationMenu } from './menu'
import { initStore, registerConfigHandlers } from './config'
import { registerAutoCaptionerHandlers } from './autoCaptionerService'
import { readFile, stat, open } from 'fs/promises'

let mainWindow: BrowserWindow | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let configStore: any = null
let tray: Tray | null = null

// Register privileged schemes before app is ready
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('caption-studio', process.execPath, [join(__dirname, '../..')])
  }
} else {
  app.setAsDefaultProtocolClient('caption-studio')
}

function createWindow(): void {
  // Get stored window bounds or use defaults
  const windowConfig = configStore ? configStore.get('window') : { width: 1400, height: 900 }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: windowConfig.width,
    height: windowConfig.height,
    x: windowConfig.x,
    y: windowConfig.y,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle window close - check for unsaved changes
  mainWindow.on('close', async (event) => {
    if (!mainWindow) return

    // Prevent the window from closing immediately
    event.preventDefault()

    // Check if there are unsaved changes
    const hasUnsaved = await mainWindow.webContents.executeJavaScript(
      'window.__hasUnsavedChanges ? window.__hasUnsavedChanges() : false'
    )

    if (hasUnsaved) {
      // Show dialog asking what to do
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Cancel', 'Discard Changes', 'Save and Close'],
        defaultId: 2,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. What would you like to do?',
        detail: "Your changes will be lost if you don't save them."
      })

      if (choice === 1) {
        // Discard changes - close window
        mainWindow.destroy()
      } else if (choice === 2) {
        // Save and close
        try {
          await mainWindow.webContents.executeJavaScript(
            'window.__saveChanges ? window.__saveChanges() : Promise.resolve()'
          )
          mainWindow.destroy()
        } catch (error) {
          console.error('Error saving changes:', error)
        }
      }
      // choice === 0 (Cancel) - do nothing, window stays open
    } else {
      // No unsaved changes, allow window to close
      mainWindow.destroy()
    }
  })

  // Save window bounds when resized or moved
  mainWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isMaximized() && !mainWindow.isMinimized() && configStore) {
      const bounds = mainWindow.getBounds()
      configStore.set('window', bounds)
    }
  })

  mainWindow.on('move', () => {
    if (mainWindow && !mainWindow.isMaximized() && !mainWindow.isMinimized() && configStore) {
      const bounds = mainWindow.getBounds()
      configStore.set('window', bounds)
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Create application menu
  createApplicationMenu(mainWindow)
}

function createTray(): void {
  // Create tray icon
  const trayIcon = nativeImage.createFromPath(icon)

  // Resize icon for tray (16x16 for most platforms)
  const resizedIcon = trayIcon.resize({ width: 16, height: 16 })

  tray = new Tray(resizedIcon)
  tray.setToolTip('Caption Studio')

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: async () => {
        // Ask renderer if there are unsaved changes
        if (mainWindow && !mainWindow.isDestroyed()) {
          const hasUnsaved = await mainWindow.webContents.executeJavaScript(
            'window.__hasUnsavedChanges ? window.__hasUnsavedChanges() : false'
          )

          if (hasUnsaved) {
            const choice = dialog.showMessageBoxSync({
              type: 'question',
              buttons: ['Cancel', 'Discard Changes', 'Save and Quit'],
              defaultId: 2,
              title: 'Unsaved Changes',
              message: 'You have unsaved changes. What would you like to do?'
            })

            if (choice === 0) {
              // Cancel
              return
            } else if (choice === 2) {
              // Save and quit
              await mainWindow.webContents.executeJavaScript(
                'window.__saveChanges ? window.__saveChanges() : Promise.resolve()'
              )
            }
          }
        }

        app.quit()
      }
    }
  ])

  // Right-click shows menu
  tray.setContextMenu(contextMenu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Register custom protocol for loading local images and videos
  // Videos require range request support for seeking
  protocol.handle('local-image', async (request) => {
    try {
      const url = request.url.replace('local-image://', '')
      const filePath = decodeURIComponent(url)

      // Determine mime type based on extension
      let mimeType = 'application/octet-stream'
      const lowerPath = filePath.toLowerCase()
      
      // Images
      if (lowerPath.endsWith('.png')) {
        mimeType = 'image/png'
      } else if (lowerPath.endsWith('.webp')) {
        mimeType = 'image/webp'
      } else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      }
      // Videos
      else if (lowerPath.endsWith('.mp4')) {
        mimeType = 'video/mp4'
      } else if (lowerPath.endsWith('.webm')) {
        mimeType = 'video/webm'
      } else if (lowerPath.endsWith('.mov')) {
        mimeType = 'video/quicktime'
      }

      // Get file stats for range request support
      const stats = await stat(filePath)
      const fileSize = stats.size

      // Check for range request (needed for video seeking)
      const rangeHeader = request.headers.get('range')
      
      if (rangeHeader) {
        // Parse range header (e.g., "bytes=0-1023")
        const parts = rangeHeader.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunkSize = end - start + 1

        // Read the requested chunk
        const fileHandle = await open(filePath, 'r')
        try {
          const buffer = Buffer.allocUnsafe(chunkSize)
          await fileHandle.read(buffer, 0, chunkSize, start)
          
          // Return partial content (206)
          return new Response(buffer, {
            status: 206,
            headers: {
              'Content-Type': mimeType,
              'Content-Length': chunkSize.toString(),
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes'
            }
          })
        } finally {
          await fileHandle.close()
        }
      } else {
        // No range request - return full file
        const data = await readFile(filePath)
        return new Response(data, {
          headers: {
            'Content-Type': mimeType,
            'Content-Length': fileSize.toString(),
            'Accept-Ranges': 'bytes'
          }
        })
      }
    } catch (error) {
      console.error('Error loading media file:', error)
      return new Response('Error loading media file', { status: 500 })
    }
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Initialize config store
  configStore = await initStore()

  // Register IPC handlers
  registerImageHandlers()
  await registerConfigHandlers()
  registerAutoCaptionerHandlers()

  // Register veil handler
  ipcMain.handle('window:veil', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  createWindow()
  createTray()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
