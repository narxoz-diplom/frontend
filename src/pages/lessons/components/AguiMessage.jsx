import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getMessageText } from '../lib/chatMessages'
import QuizGenerativeUI from './QuizGenerativeUI'
import SummaryGenerativeUI from './SummaryGenerativeUI'
import AnalyticsGenerativeUI from './AnalyticsGenerativeUI'

const DEFAULT_THEME = { primary: '#e41616', accent: '#ed5a5a' }

function AguiMessage({ msg }) {
  if (msg.role === 'activity') return null
  if (msg.role === 'tool' && typeof msg.content === 'string') {
    let result
    try {
      result = JSON.parse(msg.content)
    } catch {
      return null
    }
    if (result?.questions?.length) {
      return (
        <div className="lesson-chat ag-ui-inline-quiz">
          <QuizGenerativeUI result={result} theme={result?.theme || DEFAULT_THEME} />
        </div>
      )
    }
    if (result?.summary != null) {
      if (result?.ui_type === 'analytics') {
        return (
          <div className="lesson-chat ag-ui-inline-gen">
            <AnalyticsGenerativeUI result={result} theme={result?.theme || DEFAULT_THEME} />
          </div>
        )
      }
      return (
        <div className="lesson-chat ag-ui-inline-gen">
          <SummaryGenerativeUI result={result} theme={result?.theme || DEFAULT_THEME} />
        </div>
      )
    }
    return null
  }
  const text = getMessageText(msg)
  if (!text && msg.role !== 'user') return null
  if (msg.role === 'assistant') {
    return (
      <div className="lesson-chat-msg assistant lesson-chat-msg-md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    )
  }
  return (
    <div className={`lesson-chat-msg ${msg.role}`}>
      {text}
    </div>
  )
}

export default AguiMessage
