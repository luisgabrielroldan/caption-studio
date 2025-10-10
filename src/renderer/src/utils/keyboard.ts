/**
 * Utility functions for keyboard handling
 */

import { KEY_MAP } from '../constants'

/**
 * Normalize keyboard event key to display format
 * @param key - The keyboard event key
 * @returns Normalized key string
 */
export function normalizeKey(key: string): string {
  if (KEY_MAP[key]) {
    return KEY_MAP[key]
  } else if (key.length === 1) {
    return key.toUpperCase()
  }
  return key
}

/**
 * Build a key combination string from modifiers and main key
 * @param event - Keyboard event
 * @returns Key combination string (e.g., "Ctrl + Shift + A")
 */
export function buildKeyCombination(event: KeyboardEvent): string {
  const parts: string[] = []

  // Build the key combination string
  if (event.ctrlKey || event.metaKey) {
    parts.push(event.metaKey && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl')
  }
  if (event.shiftKey) {
    parts.push('Shift')
  }
  if (event.altKey) {
    parts.push('Alt')
  }

  const mainKey = normalizeKey(event.key)
  parts.push(mainKey)

  return parts.join(' + ')
}

/**
 * Parse a key combination string and check if a keyboard event matches
 * @param combination - Key combination string (e.g., "Ctrl + A")
 * @param event - Keyboard event to check
 * @returns True if the event matches the combination
 */
export function matchesKeyCombination(combination: string, event: KeyboardEvent): boolean {
  if (!combination) return false

  const parts = combination.split(' + ').map((p) => p.trim())
  const mainKey = parts[parts.length - 1]
  const modifiers = parts.slice(0, -1)

  // Check modifiers
  const hasCtrl = modifiers.some((m) => m === 'Ctrl' || m === 'Cmd')
  const hasShift = modifiers.includes('Shift')
  const hasAlt = modifiers.includes('Alt')

  const eventHasCtrl = event.ctrlKey || event.metaKey
  const eventHasShift = event.shiftKey
  const eventHasAlt = event.altKey

  if (hasCtrl !== eventHasCtrl) return false
  if (hasShift !== eventHasShift) return false
  if (hasAlt !== eventHasAlt) return false

  // Check main key
  const eventKey = normalizeKey(event.key)
  return eventKey === mainKey
}
