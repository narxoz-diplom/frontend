import { describe, expect, it } from 'vitest'
import {
  computeUserQuotaPct,
  formatMicrosToCurrency,
  formatTokenCount,
  resolveAiApiErrorMessage
} from './aiUsageFormat'

describe('aiUsageFormat', () => {
  it('formats token counts with grouping', () => {
    expect(formatTokenCount(1500)).toBe('1,500')
    expect(formatTokenCount(null)).toBeNull()
  })

  it('formats micros to currency', () => {
    expect(formatMicrosToCurrency(1_500_000, 'USD', 'en')).toMatch(/\$1\.50/)
  })

  it('computes teacher account quota percentage', () => {
    expect(computeUserQuotaPct({
      monthlyUsed: 42_000,
      monthlyLimit: 1_000_000,
      unlimited: false,
    })).toEqual({
      pct: 4,
      unlimited: false,
      monthlyUsed: 42_000,
      monthlyLimit: 1_000_000,
    })
  })

  it('maps quota exceeded API errors', () => {
    const err = {
      response: {
        data: { code: 'QUOTA_EXCEEDED', message: 'Monthly token quota exceeded' }
      }
    }
    const t = (key) => key
    expect(resolveAiApiErrorMessage(err, t)).toBe('Monthly token quota exceeded')
  })
})
