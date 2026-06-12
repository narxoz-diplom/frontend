import React from 'react'
import { FiMail, FiUserPlus, FiX, FiTrash2, FiLoader } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const AllowedEmailsModal = ({
  allowedEmails,
  newEmailsText,
  onNewEmailsTextChange,
  error,
  saving,
  onAdd,
  onRemove,
  onSave,
  onClose
}) => {
  const { t } = useTranslation()

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emails-modal-title"
    >
      <div
        className="modal-dialog modal-emails"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="emails-modal-title">
            <FiMail /> {t('courseEdit.emailAccessTitle')}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label={t('courseEdit.closeLabel')}
          >
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-emails-desc">
            {allowedEmails.length === 0
              ? t('courseEdit.emailAccessDescEmpty')
              : t('courseEdit.emailAccessDescFilled', { count: allowedEmails.length })}
          </p>
          {error && (
            <div className="modal-emails-error">{error}</div>
          )}
          <div className="modal-emails-add">
            <textarea
              placeholder={t('courseEdit.emailPlaceholder')}
              value={newEmailsText}
              onChange={(e) => onNewEmailsTextChange(e.target.value)}
              className="modal-emails-textarea"
              rows={4}
              autoFocus
              aria-label={t('courseEdit.emailFieldLabel')}
            />
            <button
              type="button"
              className="btn btn-primary modal-emails-add-btn"
              onClick={onAdd}
              disabled={!newEmailsText.trim()}
              title={t('courseEdit.addValidEmails')}
            >
              <FiUserPlus /> {t('courseEdit.add')}
            </button>
          </div>
          {allowedEmails.length > 0 ? (
            <div className="modal-emails-list-wrap">
              <ul className="modal-emails-list">
                {allowedEmails.map((email) => (
                  <li key={email} className="modal-emails-item">
                    <span className="modal-emails-item-text">{email}</span>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => onRemove(email)}
                      title={t('courseEdit.removeFromList')}
                    >
                      <FiTrash2 />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="modal-emails-empty">{t('courseEdit.emailListEmpty')}</p>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            {t('courseEdit.close')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? <><FiLoader className="spin" /> {t('courseEdit.saving')}</> : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AllowedEmailsModal
