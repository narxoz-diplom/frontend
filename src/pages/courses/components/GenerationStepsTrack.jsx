import React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, Spinner } from '@/shared/ui/academis'

const GenerationStepsTrack = ({ activeStep, hasFiles, hasOutline, lessonsReady }) => {
  const { t } = useTranslation()

  const steps = [
    { n: 1, icon: 'files', label: t('studio.materials'), done: hasFiles },
    { n: 2, icon: 'settings', label: t('studio.params'), done: activeStep >= 2 },
    { n: 3, icon: 'list', label: t('studio.plan'), done: hasOutline },
    { n: 4, icon: 'book', label: t('studio.lessonsStep'), done: lessonsReady },
  ]

  return (
    <div className="step-track" role="navigation" aria-label={t('courseEdit.generationStages')}>
      {steps.map((step, index) => {
        const isActive = activeStep === step.n
        const isDone = step.done && !isActive
        const state = isActive ? 'active' : isDone ? 'done' : ''
        return (
          <React.Fragment key={step.n}>
            <div className={`step${state ? ` ${state}` : ''}`}>
              <span className="step-dot" aria-hidden>
                {isDone ? <Icon name="check" size={14} /> : <Icon name={step.icon} size={14} />}
              </span>
              <span className="step-lbl">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-line${isDone ? ' done' : ''}`} aria-hidden />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default GenerationStepsTrack
