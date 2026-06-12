import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AiUsageDashboard from './AiUsageDashboard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' }
  })
}))

describe('AiUsageDashboard', () => {
  it('shows empty state when report is null', () => {
    render(<AiUsageDashboard report={null} loading={false} error={null} />)
    expect(screen.getByText('dashboard.aiUsage.empty')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<AiUsageDashboard loading error={null} report={null} />)
    expect(screen.getByText('dashboard.aiUsage.loading')).toBeInTheDocument()
  })

  it('renders summary cards from report', () => {
    const report = {
      period: { from: '2026-06-01', to: '2026-06-30' },
      summary: {
        totalTokens: 1000,
        inputTokens: 400,
        outputTokens: 600,
        costMicros: 5000,
        currency: 'USD',
        generationCount: 2,
        failedCount: 0
      },
      timeSeries: [],
      byModel: []
    }
    render(<AiUsageDashboard report={report} loading={false} error={null} />)
    expect(screen.getByText('dashboard.aiUsage.title')).toBeInTheDocument()
    expect(screen.getByText('dashboard.aiUsage.totalTokens')).toBeInTheDocument()
  })
})
