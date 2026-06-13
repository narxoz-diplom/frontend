import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AiModelPicker from './AiModelPicker'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' }
  })
}))

const models = [
  {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    enabled: true,
    isDefault: true,
    tier: 'fast',
    description: 'Fast model',
    quota: { limitTokens: 500000, remainingTokens: 400000, period: 'monthly' }
  },
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    enabled: false,
    unavailableReason: 'Monthly token quota exceeded'
  }
]

describe('AiModelPicker', () => {
  it('shows loading state', () => {
    render(
      <AiModelPicker loading models={[]} selectedModelId={null} onSelect={() => {}} compact />
    )
    expect(screen.getByText('courseEdit.aiModelLoading')).toBeInTheDocument()
  })

  it('renders compact trigger with selected model', () => {
    render(
      <AiModelPicker
        compact
        models={models}
        selectedModelId="gemini-2.5-flash"
        onSelect={() => {}}
        selectedModel={models[0]}
      />
    )
    expect(screen.getByText('studio.aiModel')).toBeInTheDocument()
    expect(screen.getByText('Gemini 2.5 Flash')).toBeInTheDocument()
  })

  it('shows empty state when no models', () => {
    render(
      <AiModelPicker models={[]} selectedModelId={null} onSelect={() => {}} compact />
    )
    expect(screen.getByText('courseEdit.aiModelEmpty')).toBeInTheDocument()
  })
})
