/**
 * Utility functions for IPC event management
 * Provides type-safe helpers for registering and cleaning up IPC listeners
 */

type IpcEventHandler = (...args: unknown[]) => void | Promise<void>

interface IpcListenerRegistry {
  [channel: string]: IpcEventHandler
}

/**
 * Register multiple IPC event listeners at once
 * Returns a cleanup function to remove all registered listeners
 */
export function registerIpcListeners(listeners: IpcListenerRegistry): () => void {
  const channels: string[] = []

  // Register all listeners
  for (const [channel, handler] of Object.entries(listeners)) {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on(channel, handler)
      channels.push(channel)
    }
  }

  // Return cleanup function
  return () => {
    if (window.electron?.ipcRenderer?.removeAllListeners) {
      for (const channel of channels) {
        window.electron.ipcRenderer.removeAllListeners(channel)
      }
    }
  }
}

/**
 * Register a single IPC event listener
 * Returns a cleanup function to remove the listener
 */
export function registerIpcListener(channel: string, handler: IpcEventHandler): () => void {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.on(channel, handler)
  }

  return () => {
    if (window.electron?.ipcRenderer?.removeAllListeners) {
      window.electron.ipcRenderer.removeAllListeners(channel)
    }
  }
}

/**
 * Check if IPC is available
 */
export function isIpcAvailable(): boolean {
  return !!window.electron?.ipcRenderer
}
