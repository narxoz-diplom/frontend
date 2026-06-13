import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthAlert from '@/shared/ui/AuthAlert'
import { register } from '@/shared/api/authApi'
import { resolveRegisterError } from '@/shared/lib/authErrors'
import { applyTheme } from '@/shared/lib/theme'
import { Logo, Spinner } from '@/shared/ui/academis'
import AuthShell from './components/AuthShell'
import '@/shared/ui/auth-alert.css'

const RegField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  fullWidth = false,
  placeholder,
}) => (
  <div className={`field${fullWidth ? ' field--full' : ''}`}>
    <label className="label" htmlFor={name}>
      {label}
      {required && <span style={{ color: 'var(--brand)' }}> *</span>}
    </label>
    <input
      id={name}
      name={name}
      className="input"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      autoComplete={type === 'password' ? 'new-password' : name}
    />
  </div>
)

const Register = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'client',
  })
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    applyTheme()
    document.title = `Academis | ${t('auth.registerTitle')}`
  }, [t])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setAlert(null)
  }

  const showError = (message) => {
    setAlert({ title: null, message })
  }

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      showError(t('auth.fillAllRequired'))
      return false
    }

    if (formData.password.length < 6) {
      showError(t('auth.passwordTooShort'))
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      showError(t('auth.passwordsMismatch'))
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showError(t('auth.invalidEmail'))
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlert(null)
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registrationData } = formData
      const { ok, status, data } = await register(registrationData)

      if (!ok) {
        const resolved = resolveRegisterError({ status, data }, null, t)
        setAlert({ title: resolved.title, message: resolved.message })
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const resolved = resolveRegisterError({ status: null, data: null }, err, t)
      setAlert({ title: resolved.title, message: resolved.message })
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <form className="auth-form auth-form-wide auth-fade-up" onSubmit={handleSubmit} autoComplete="off">
        <div style={{ marginBottom: 22 }}>
          <Logo size={32} />
        </div>

        <h1 className="h1" style={{ marginBottom: 6 }}>{t('auth.registerTitle')}</h1>
        <p className="muted" style={{ marginBottom: 22 }}>{t('auth.registerSubtitle')}</p>

        {alert && (
          <AuthAlert
            variant="error"
            title={alert.title}
            message={alert.message}
          />
        )}
        {success && (
          <AuthAlert
            variant="success"
            message={t('auth.registerSuccess')}
          />
        )}

        <div className="reg-grid">
          <RegField
            label={t('auth.firstName')}
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <RegField
            label={t('auth.lastName')}
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          <RegField
            label={t('auth.username')}
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            fullWidth
          />
          <RegField
            label={t('auth.email')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
          />

          <div className="field field--full">
            <label className="label" htmlFor="role">{t('auth.role')}</label>
            <select
              id="role"
              name="role"
              className="select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="client">{t('auth.student')}</option>
              <option value="teacher">{t('auth.teacher')}</option>
            </select>
          </div>

          <RegField
            label={t('auth.password')}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••"
          />
          <RegField
            label={t('auth.confirmPassword')}
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="••••••"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={loading || success}
          style={{ marginTop: 18 }}
        >
          {loading && <Spinner size={16} color="#fff" />}
          {loading ? t('auth.registerLoading') : t('auth.registerButton')}
        </button>

        <p className="auth-switch">
          {t('auth.alreadyHaveAccount')}
          {' '}
          <Link to="/login">{t('nav.login')}</Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default Register
