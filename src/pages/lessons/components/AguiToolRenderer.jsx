import React from 'react'
import { useTranslation } from 'react-i18next'
import SummaryGenerativeUI from './SummaryGenerativeUI'
import AnalyticsGenerativeUI from './AnalyticsGenerativeUI'
import QuizGenerativeUI from './QuizGenerativeUI'
import GlossaryGenerativeUI from './GlossaryGenerativeUI'
import TimelineGenerativeUI from './TimelineGenerativeUI'
import ChecklistGenerativeUI from './ChecklistGenerativeUI'
import ComparisonGenerativeUI from './ComparisonGenerativeUI'
import FaqGenerativeUI from './FaqGenerativeUI'
import StepsGenerativeUI from './StepsGenerativeUI'
import MindmapGenerativeUI from './MindmapGenerativeUI'

function detectUiType(result) {
  if (!result || typeof result !== 'object') return null
  if (result.ui_type) return result.ui_type
  if (Array.isArray(result.questions) && result.questions.length > 0) return 'quiz'
  if (result.summary && (result.pie_chart || result.bar_chart || result.stat_cards?.length || result.insights?.length)) {
    return 'analytics'
  }
  if (result.summary) return 'summary'
  if (Array.isArray(result.terms) && result.terms.length > 0) return 'glossary'
  if (Array.isArray(result.events) && result.events.length > 0) return 'timeline'
  if (Array.isArray(result.items) && result.items[0]?.text != null) return 'checklist'
  if (Array.isArray(result.items) && result.items[0]?.question != null) return 'faq'
  if (Array.isArray(result.steps) && result.steps.length > 0) return 'steps'
  if (result.columns && Array.isArray(result.rows)) return 'comparison'
  if (result.central_topic || Array.isArray(result.branches)) return 'mindmap'
  return null
}

const UI_COMPONENTS = {
  summary: SummaryGenerativeUI,
  analytics: AnalyticsGenerativeUI,
  quiz: QuizGenerativeUI,
  glossary: GlossaryGenerativeUI,
  timeline: TimelineGenerativeUI,
  checklist: ChecklistGenerativeUI,
  comparison: ComparisonGenerativeUI,
  faq: FaqGenerativeUI,
  steps: StepsGenerativeUI,
  mindmap: MindmapGenerativeUI,
}

function AguiToolRenderer({ result }) {
  const { t } = useTranslation()
  const uiType = detectUiType(result)
  const theme = result?.theme || {}

  if (result?.status === 'error') {
    return (
      <div className="lesson-chat-msg assistant">
        <div className="ag-ui-gen-error">{result.message || t('ragPage.generationError')}</div>
      </div>
    )
  }

  if (!uiType) return null

  const Component = UI_COMPONENTS[uiType]
  if (!Component) return null

  return (
    <div className="lesson-chat-msg assistant lesson-chat-gen-ui">
      <Component result={result} theme={theme} />
    </div>
  )
}

export default AguiToolRenderer
