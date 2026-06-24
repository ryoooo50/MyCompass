import { describe, it, expect } from 'vitest'

// AppLauncher.tsx の isValidAppUrl 関数と同じロジック
function isValidAppUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return ['https:', 'http:', 'obsidian:'].includes(u.protocol)
  } catch {
    return false
  }
}

describe('isValidAppUrl', () => {
  it('https: は有効', () => expect(isValidAppUrl('https://example.com')).toBe(true))
  it('http: は有効', () => expect(isValidAppUrl('http://localhost')).toBe(true))
  it('obsidian: は有効', () => expect(isValidAppUrl('obsidian://open?vault=test')).toBe(true))
  it('javascript: は無効', () => expect(isValidAppUrl('javascript:alert(1)')).toBe(false))
  it('空文字は無効', () => expect(isValidAppUrl('')).toBe(false))
  it('文字列のみは無効', () => expect(isValidAppUrl('not-a-url')).toBe(false))
  it('ftp: は無効', () => expect(isValidAppUrl('ftp://example.com')).toBe(false))
  it('obsidianのvault名にスペースが含まれても有効', () =>
    expect(isValidAppUrl('obsidian://open?vault=My%20Vault')).toBe(true))
})
