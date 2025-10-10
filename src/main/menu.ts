import { Menu, BrowserWindow, app, shell } from 'electron'

export function createApplicationMenu(mainWindow: BrowserWindow | null): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    // App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu:open-folder')
          }
        },
        {
          label: 'Open Recent',
          submenu: [
            {
              label: 'Recent folders will appear here',
              enabled: false
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Save All Captions',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:save-captions')
          }
        },
        {
          label: 'Discard All Changes',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow?.webContents.send('menu:reset-changes')
          }
        },
        { type: 'separator' },
        {
          label: 'Close Folder',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow?.webContents.send('menu:close-folder')
          }
        },
        { type: 'separator' },
        ...(isMac
          ? [
              {
                label: 'Preferences...',
                accelerator: 'Cmd+,',
                click: () => {
                  mainWindow?.webContents.send('menu:show-preferences')
                }
              },
              { type: 'separator' as const }
            ]
          : []),
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' as const },
              { role: 'delete' as const },
              { role: 'selectAll' as const }
            ]
          : [
              { role: 'delete' as const },
              { type: 'separator' as const },
              { role: 'selectAll' as const }
            ])
      ]
    },

    // Navigation Menu
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Previous Image',
          accelerator: 'Up',
          click: () => {
            mainWindow?.webContents.send('menu:previous-image')
          }
        },
        {
          label: 'Next Image',
          accelerator: 'Down',
          click: () => {
            mainWindow?.webContents.send('menu:next-image')
          }
        },
        { type: 'separator' },
        {
          label: 'First Image',
          accelerator: 'Home',
          click: () => {
            mainWindow?.webContents.send('menu:first-image')
          }
        },
        {
          label: 'Last Image',
          accelerator: 'End',
          click: () => {
            mainWindow?.webContents.send('menu:last-image')
          }
        },
        { type: 'separator' },
        {
          label: 'Focus Caption Editor',
          accelerator: 'Tab',
          click: () => {
            mainWindow?.webContents.send('menu:focus-editor')
          }
        }
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const }
            ]
          : [{ role: 'close' as const }])
      ]
    },

    // Help Menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            mainWindow?.webContents.send('menu:show-shortcuts')
          }
        },
        { type: 'separator' },
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/caption-studio')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
