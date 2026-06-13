import React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalHeader, Icon, Spinner } from '@/shared/ui/academis'

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
    <Modal open onClose={onClose}>
      <ModalHeader
        title={t('courseEdit.emailAccessTitle')}
        subtitle={
          allowedEmails.length === 0
            ? t('courseEdit.emailAccessDescEmpty')
            : t('courseEdit.emailAccessDescFilled', { count: allowedEmails.length })
        }
        icon="mail"
        onClose={onClose}
      />
      <div className="modal-body">
        {error && (
          <div className="rag-out-academis error" style={{ marginBottom: 12 }}>{error}</div>
        )}
        <div className="field">
          <label className="label" htmlFor="emails-textarea">
            {t('courseEdit.emailFieldLabel')}
          </label>
          <textarea
            id="emails-textarea"
            className="input"
            placeholder={t('courseEdit.emailPlaceholder')}
            value={newEmailsText}
            onChange={(e) => onNewEmailsTextChange(e.target.value)}
            rows={4}
            autoFocus
          />
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onAdd}
          disabled={!newEmailsText.trim()}
          title={t('courseEdit.addValidEmails')}
          style={{ marginTop: 10 }}
        >
          <Icon name="user" size={16} />
          {t('courseEdit.add')}
        </button>

        {allowedEmails.length > 0 ? (
          <div className="email-tag-list">
            {allowedEmails.map((email) => (
              <span key={email} className="email-tag">
                {email}
                <button
                  type="button"
                  className="btn btn-icon btn-ghost btn-sm"
                  onClick={() => onRemove(email)}
                  title={t('courseEdit.removeFromList')}
                  aria-label={t('courseEdit.removeFromList')}
                >
                  <Icon name="x" size={14} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
            {t('courseEdit.emailListEmpty')}
          </p>
        )}
      </div>
      <div className="modal-foot row gap10" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>
          {t('courseEdit.close')}
        </button>
        <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <Spinner size={16} />
              {t('courseEdit.saving')}
            </>
          ) : (
            t('common.save')
          )}
        </button>
      </div>
    </Modal>
  )
}

export default AllowedEmailsModal
