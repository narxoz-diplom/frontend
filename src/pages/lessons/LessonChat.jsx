import React, { useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiMessageCircle, FiX, FiTrash2, FiChevronDown } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { AG_UI_URL } from '@/shared/api/ragApi'
import AGUIChat from './components/AGUIChat'
import SimpleLessonChat from './components/SimpleLessonChat'
import { useChatPanel } from './hooks/useChatPanel'
import './LessonChat.css'

export default function LessonChat({ lessonId, courseId, lessonTitle, courseTitle, lessonContent }) {
  const { t } = useTranslation()
  const chatRef = useRef(null)
  const { panelPhase, panelOpen, openPanel, closePanel, panelWidth, beginPanelResize } = useChatPanel()

  const portalContent = (
    <>
      {!panelOpen && (
        <button
          type="button"
          className="lesson-chat-fab"
          onClick={openPanel}
          aria-label={t('lessonChat.openAssistant')}
          title={t('lessonChat.assistantChat')}
        >
          <FiMessageCircle className="lesson-chat-fab-icon" aria-hidden />
          {AG_UI_URL && <span className="lesson-chat-fab-badge" aria-hidden>AG</span>}
        </button>
      )}

      {panelOpen && (
        <>
          <div
            className={[
              'lesson-chat-backdrop',
              panelPhase === 'entering' && 'is-entering',
              panelPhase === 'closing' && 'is-closing',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden
            onClick={closePanel}
          />
          <aside
            className={[
              'lesson-chat-panel',
              panelPhase === 'entering' && 'is-entering',
              panelPhase === 'closing' && 'is-closing',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ width: panelWidth }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-chat-panel-title"
          >
            <div
              className="lesson-chat-panel-resize"
              onMouseDown={e => {
                e.preventDefault()
                beginPanelResize(e.clientX)
              }}
              onTouchStart={e => {
                if (e.touches.length === 1) {
                  beginPanelResize(e.touches[0].clientX)
                }
              }}
              role="separator"
              aria-orientation="vertical"
              aria-label={t('lessonChat.resizePanel')}
            />
            <div className="lesson-chat-panel-inner">
              <div className="lesson-chat-header lesson-chat-panel-header">
                <div className="lesson-chat-panel-header-title">
                  <h2 id="lesson-chat-panel-title">
                    <FiMessageCircle aria-hidden /> {t('lessonChat.assistantTitle')}
                    {AG_UI_URL && <span className="lesson-chat-badge">AG-UI</span>}
                  </h2>
                </div>
                <div className="lesson-chat-panel-actions" role="toolbar" aria-label={t('lessonChat.chatActions')}>
                  <button
                    type="button"
                    className="lesson-chat-action-btn lesson-chat-action-btn--clear"
                    onClick={() => chatRef.current?.clear()}
                    title={t('lessonChat.clearHistory')}
                    aria-label={t('lessonChat.clearHistory')}
                  >
                    <FiTrash2 aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="lesson-chat-action-btn lesson-chat-action-btn--ghost"
                    onClick={() => chatRef.current?.scrollToBottom()}
                    title={t('lessonChat.scrollBottom')}
                    aria-label={t('lessonChat.scrollBottom')}
                  >
                    <FiChevronDown aria-hidden />
                  </button>
                  <span className="lesson-chat-panel-actions-divider" aria-hidden />
                  <button
                    type="button"
                    className="lesson-chat-action-btn lesson-chat-action-btn--close"
                    onClick={closePanel}
                    aria-label={t('lessonChat.closeChat')}
                    title={t('lessonChat.close')}
                  >
                    <FiX aria-hidden />
                  </button>
                </div>
              </div>
              <p className="lesson-chat-panel-subtitle">
                {lessonTitle
                  ? t('lessonChat.contextWithLesson', { lesson: lessonTitle })
                  : t('lessonChat.contextScope')}
              </p>

              <div className="lesson-chat-panel-body">
                <div className="lesson-chat-panel-chat-area">
                  {AG_UI_URL ? (
                    <AGUIChat
                      ref={chatRef}
                      panelOpen={panelOpen}
                      lessonId={lessonId}
                      courseId={courseId}
                      lessonTitle={lessonTitle}
                      courseTitle={courseTitle}
                      lessonContent={lessonContent}
                    />
                  ) : (
                    <SimpleLessonChat
                      ref={chatRef}
                      panelOpen={panelOpen}
                      lessonId={lessonId}
                      courseId={courseId}
                    />
                  )}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )

  return createPortal(<div className="lesson-chat-portal-root">{portalContent}</div>, document.body)
}
