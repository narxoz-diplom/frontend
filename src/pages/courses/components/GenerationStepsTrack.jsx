import React from 'react'
import { useTranslation } from 'react-i18next'

const GenerationStepsTrack = ({ activeStep, hasFiles, hasOutline, lessonsReady }) => {
  const { t } = useTranslation()

  const steps = [
    { n: 1, label: t('courseEdit.materials'), done: hasFiles },
    { n: 2, label: t('courseEdit.params'), done: activeStep >= 2 },
    { n: 3, label: t('courseEdit.plan'), done: hasOutline },
    { n: 4, label: t('courseEdit.lessons'), done: lessonsReady }
  ]

  return (
    <div className="gen-track" role="navigation" aria-label={t('courseEdit.generationStages')}>
      {steps.flatMap((step, i, arr) => {
        const state =
          activeStep === step.n ? 'active' : step.done ? 'done' : 'todo'
        const nodes = [
          <div
            key={`seg-${step.n}`}
            className={`gen-track__segment gen-track__segment--${state}`}
          >
            <span className="gen-track__num" aria-hidden>
              {step.done && state !== 'active' ? '✓' : step.n}
            </span>
            <span className="gen-track__label">{step.label}</span>
          </div>
        ]
        if (i < arr.length - 1) {
          const prevDone = step.done
          nodes.push(
            <div
              key={`bar-${step.n}`}
              className={`gen-track__connector${prevDone ? ' gen-track__connector--done' : ''}`}
              aria-hidden
            />
          )
        }
        return nodes
      })}
    </div>
  )
}

export default GenerationStepsTrack
