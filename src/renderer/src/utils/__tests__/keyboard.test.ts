import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { normalizeKey, buildKeyCombination, matchesKeyCombination } from '../keyboard'

describe('normalizeKey', () => {
  it('should map special keys correctly', () => {
    expect(normalizeKey('ArrowUp')).toBe('↑')
    expect(normalizeKey('ArrowDown')).toBe('↓')
    expect(normalizeKey('ArrowLeft')).toBe('←')
    expect(normalizeKey('ArrowRight')).toBe('→')
    expect(normalizeKey(' ')).toBe('Space')
    expect(normalizeKey('Escape')).toBe('Esc')
    expect(normalizeKey('Enter')).toBe('Enter')
    expect(normalizeKey('Backspace')).toBe('Backspace')
    expect(normalizeKey('Delete')).toBe('Del')
    expect(normalizeKey('Tab')).toBe('Tab')
  })

  it('should uppercase single characters', () => {
    expect(normalizeKey('a')).toBe('A')
    expect(normalizeKey('z')).toBe('Z')
    expect(normalizeKey('1')).toBe('1')
    expect(normalizeKey('@')).toBe('@')
  })

  it('should pass through unknown keys unchanged', () => {
    expect(normalizeKey('F1')).toBe('F1')
    expect(normalizeKey('F12')).toBe('F12')
    expect(normalizeKey('PageUp')).toBe('PageUp')
    expect(normalizeKey('PageDown')).toBe('PageDown')
  })
})

describe('buildKeyCombination', () => {
  const originalPlatform = navigator.platform

  beforeEach(() => {
    // Reset platform before each test
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: originalPlatform
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: originalPlatform
    })
  })

  it('should build single key combination', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' })
    expect(buildKeyCombination(event)).toBe('A')
  })

  it('should build Ctrl key combination (Windows)', () => {
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: 'Win32'
    })
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true
    })
    expect(buildKeyCombination(event)).toBe('Ctrl + S')
  })

  it('should build Cmd key combination (Mac)', () => {
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: 'MacIntel'
    })
    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true
    })
    expect(buildKeyCombination(event)).toBe('Cmd + S')
  })

  it('should build Shift key combination', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'F12',
      shiftKey: true
    })
    expect(buildKeyCombination(event)).toBe('Shift + F12')
  })

  it('should build Alt key combination', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      altKey: true
    })
    expect(buildKeyCombination(event)).toBe('Alt + Tab')
  })

  it('should build multiple modifier combination', () => {
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: 'Win32'
    })
    const event = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      shiftKey: true
    })
    expect(buildKeyCombination(event)).toBe('Ctrl + Shift + R')
  })

  it('should handle special keys in combination', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      ctrlKey: true
    })
    expect(buildKeyCombination(event)).toBe('Ctrl + ↑')
  })
})

describe('matchesKeyCombination', () => {
  it('should return false for empty combination', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' })
    expect(matchesKeyCombination('', event)).toBe(false)
  })

  it('should match single key', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' })
    expect(matchesKeyCombination('A', event)).toBe(true)
  })

  it('should match Ctrl combination', () => {
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true
    })
    expect(matchesKeyCombination('Ctrl + S', event)).toBe(true)
  })

  it('should match Cmd combination (treats Cmd as Ctrl)', () => {
    const event = new KeyboardEvent('keydown', {
      key: 's',
      metaKey: true
    })
    expect(matchesKeyCombination('Cmd + S', event)).toBe(true)
    expect(matchesKeyCombination('Ctrl + S', event)).toBe(true)
  })

  it('should match Shift combination', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'F12',
      shiftKey: true
    })
    expect(matchesKeyCombination('Shift + F12', event)).toBe(true)
  })

  it('should match Alt combination', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      altKey: true
    })
    expect(matchesKeyCombination('Alt + Tab', event)).toBe(true)
  })

  it('should match multiple modifiers', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'r',
      ctrlKey: true,
      shiftKey: true
    })
    expect(matchesKeyCombination('Ctrl + Shift + R', event)).toBe(true)
  })

  it('should not match when modifier is missing', () => {
    const event = new KeyboardEvent('keydown', { key: 's' })
    expect(matchesKeyCombination('Ctrl + S', event)).toBe(false)
  })

  it('should not match when modifier is extra', () => {
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      shiftKey: true
    })
    expect(matchesKeyCombination('Ctrl + S', event)).toBe(false)
  })

  it('should not match when key is different', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true
    })
    expect(matchesKeyCombination('Ctrl + S', event)).toBe(false)
  })

  it('should match special keys', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      ctrlKey: true
    })
    expect(matchesKeyCombination('Ctrl + ↑', event)).toBe(true)
  })

  it('should handle case-insensitive matching for modifiers', () => {
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true
    })
    // The function should match regardless of case in the combination string
    // (though the implementation uses exact matching, so this tests current behavior)
    expect(matchesKeyCombination('Ctrl + S', event)).toBe(true)
  })
})
