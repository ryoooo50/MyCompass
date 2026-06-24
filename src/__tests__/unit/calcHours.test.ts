import { describe, it, expect } from 'vitest'

// WorkList.tsx の calcHours 関数と同じロジック
function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60
}

describe('calcHours', () => {
  it('基本: 8時間シフト', () => expect(calcHours('09:00', '17:00')).toBe(8))
  it('分あり: 7時間30分', () => expect(calcHours('09:00', '16:30')).toBe(7.5))
  it('0時間: 同じ時刻', () => expect(calcHours('10:00', '10:00')).toBe(0))
  it('跨ぎなし: 1時間', () => expect(calcHours('23:00', '24:00')).toBe(1))
  it('深夜: 0時開始6時間', () => expect(calcHours('00:00', '06:00')).toBe(6))
  it('短時間: 30分', () => expect(calcHours('14:00', '14:30')).toBe(0.5))
})
