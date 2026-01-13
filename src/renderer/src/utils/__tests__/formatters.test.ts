import { describe, it, expect } from 'vitest'
import { formatFileSize } from '../formatters'

describe('formatFileSize', () => {
  it('should return "0 B" for zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('should format bytes correctly (1-1023)', () => {
    expect(formatFileSize(1)).toBe('1 B')
    expect(formatFileSize(100)).toBe('100 B')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('should format KB correctly at boundary (1024)', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })

  it('should format KB correctly (1024-1048575)', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(5120)).toBe('5.0 KB')
    expect(formatFileSize(10240)).toBe('10.0 KB')
    expect(formatFileSize(1048575)).toBe('1024.0 KB')
  })

  it('should format MB correctly at boundary (1048576)', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
  })

  it('should format MB correctly (1048576-1073741823)', () => {
    expect(formatFileSize(1572864)).toBe('1.5 MB')
    expect(formatFileSize(5242880)).toBe('5.0 MB')
    expect(formatFileSize(10485760)).toBe('10.0 MB')
    expect(formatFileSize(1073741823)).toBe('1024.0 MB')
  })

  it('should format GB correctly at boundary (1073741824)', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB')
  })

  it('should format GB correctly for large values', () => {
    expect(formatFileSize(1610612736)).toBe('1.5 GB')
    expect(formatFileSize(5368709120)).toBe('5.0 GB')
    expect(formatFileSize(10737418240)).toBe('10.0 GB')
  })

  it('should handle decimal precision correctly', () => {
    // Bytes should have no decimal places
    expect(formatFileSize(100)).toBe('100 B')

    // KB/MB/GB should have 1 decimal place
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1572864)).toBe('1.5 MB')
    expect(formatFileSize(1610612736)).toBe('1.5 GB')
  })
})
