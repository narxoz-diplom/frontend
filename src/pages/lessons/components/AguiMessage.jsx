import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getMessageText } from '../lib/chatMessages'
import AguiToolRenderer from './AguiToolRenderer'

function AguiMessage({ msg }) {
  if (msg.role === 'activity') return null
  if (msg.role === 'tool' && typeof msg.content === 'string') {
    let result
    try {
      result = JSON.parse(msg.content)
    } catch {
      return null
    }
    return <AguiToolRenderer result={result} />
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
