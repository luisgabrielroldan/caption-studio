/**
 * Composable for managing custom dialogs
 * Replaces native alert/confirm with custom, styled dialogs
 */

import { ref } from 'vue'

export type DialogType = 'info' | 'confirm' | 'warning' | 'error'

interface DialogOptions {
  title?: string
  message: string
  type?: DialogType
  confirmText?: string
  cancelText?: string
}

interface DialogState extends Required<DialogOptions> {
  visible: boolean
  resolve: ((value: boolean) => void) | null
}

const dialogState = ref<DialogState>({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  confirmText: 'OK',
  cancelText: 'Cancel',
  resolve: null
})

export function useDialog(): {
  dialogState: typeof dialogState
  showInfo: (message: string, title?: string) => Promise<boolean>
  showConfirm: (
    message: string,
    title?: string,
    confirmText?: string,
    cancelText?: string
  ) => Promise<boolean>
  showWarning: (message: string, title?: string) => Promise<boolean>
  showError: (message: string, title?: string) => Promise<boolean>
  confirm: () => void
  cancel: () => void
} {
  /**
   * Show an informational dialog (like alert)
   */
  const showInfo = (message: string, title = 'Information'): Promise<boolean> => {
    return new Promise((resolve) => {
      dialogState.value = {
        visible: true,
        title,
        message,
        type: 'info',
        confirmText: 'OK',
        cancelText: 'Cancel',
        resolve
      }
    })
  }

  /**
   * Show a confirmation dialog (like confirm)
   */
  const showConfirm = (
    message: string,
    title = 'Confirm',
    confirmText = 'OK',
    cancelText = 'Cancel'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      dialogState.value = {
        visible: true,
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
        resolve
      }
    })
  }

  /**
   * Show a warning dialog
   */
  const showWarning = (message: string, title = 'Warning'): Promise<boolean> => {
    return new Promise((resolve) => {
      dialogState.value = {
        visible: true,
        title,
        message,
        type: 'warning',
        confirmText: 'OK',
        cancelText: 'Cancel',
        resolve
      }
    })
  }

  /**
   * Show an error dialog
   */
  const showError = (message: string, title = 'Error'): Promise<boolean> => {
    return new Promise((resolve) => {
      dialogState.value = {
        visible: true,
        title,
        message,
        type: 'error',
        confirmText: 'OK',
        cancelText: 'Cancel',
        resolve
      }
    })
  }

  /**
   * Confirm the dialog
   */
  const confirm = (): void => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(true)
    }
    dialogState.value.visible = false
    dialogState.value.resolve = null
  }

  /**
   * Cancel the dialog
   */
  const cancel = (): void => {
    if (dialogState.value.resolve) {
      dialogState.value.resolve(false)
    }
    dialogState.value.visible = false
    dialogState.value.resolve = null
  }

  return {
    dialogState,
    showInfo,
    showConfirm,
    showWarning,
    showError,
    confirm,
    cancel
  }
}
