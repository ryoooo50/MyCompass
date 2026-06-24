import { describe, it, expect } from 'vitest'

// FinanceSummary.tsx の収入・支出・残額計算ロジックと同じ実装
interface FinanceRecord {
  type: 'income' | 'expense'
  amount: number
}

function calcTotalIncome(records: FinanceRecord[]): number {
  return records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)
}

function calcTotalExpense(records: FinanceRecord[]): number {
  return records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)
}

function calcBalance(records: FinanceRecord[]): number {
  return calcTotalIncome(records) - calcTotalExpense(records)
}

describe('財務計算', () => {
  describe('calcTotalIncome', () => {
    it('収入レコードのみを合計する', () => {
      const records: FinanceRecord[] = [
        { type: 'income', amount: 50000 },
        { type: 'expense', amount: 10000 },
        { type: 'income', amount: 30000 },
      ]
      expect(calcTotalIncome(records)).toBe(80000)
    })

    it('レコードが空の場合は0', () => {
      expect(calcTotalIncome([])).toBe(0)
    })

    it('支出のみの場合は0', () => {
      const records: FinanceRecord[] = [
        { type: 'expense', amount: 20000 },
      ]
      expect(calcTotalIncome(records)).toBe(0)
    })
  })

  describe('calcTotalExpense', () => {
    it('支出レコードのみを合計する', () => {
      const records: FinanceRecord[] = [
        { type: 'income', amount: 50000 },
        { type: 'expense', amount: 10000 },
        { type: 'expense', amount: 5000 },
      ]
      expect(calcTotalExpense(records)).toBe(15000)
    })

    it('レコードが空の場合は0', () => {
      expect(calcTotalExpense([])).toBe(0)
    })
  })

  describe('calcBalance', () => {
    it('収入 - 支出 = 残額', () => {
      const records: FinanceRecord[] = [
        { type: 'income', amount: 100000 },
        { type: 'expense', amount: 30000 },
        { type: 'expense', amount: 20000 },
      ]
      expect(calcBalance(records)).toBe(50000)
    })

    it('支出 > 収入のとき残額はマイナス', () => {
      const records: FinanceRecord[] = [
        { type: 'income', amount: 10000 },
        { type: 'expense', amount: 30000 },
      ]
      expect(calcBalance(records)).toBe(-20000)
    })

    it('レコードが空の場合は0', () => {
      expect(calcBalance([])).toBe(0)
    })
  })
})
