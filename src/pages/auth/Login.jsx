import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import auth from '@/shared/config/auth'
import { useTranslation } from 'react-i18next'
import AuthAlert from '@/shared/ui/AuthAlert'
import { login } from '@/shared/api/authApi'
import { resolveLoginError } from '@/shared/lib/authErrors'
import { applyTheme } from '@/shared/lib/theme'
import { Icon, Logo, Spinner } from '@/shared/ui/academis'
import AuthShell from './components/AuthShell'
import '@/shared/ui/auth-alert.css'

const Login = () => {
  const { t, i18n } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    applyTheme()
    document.title = `Academis | ${t('auth.loginTitle')}`
  }, [i18n.language, t])

  useEffect(() => {
    if (auth.authenticated) {
      window.location.replace('/')
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAlert(null)
    setLoading(true)

    try {
      const { ok, status, data } = await login({ username, password })

      if (!ok) {
        const resolved = resolveLoginError({ status, data }, null, t)
        setAlert({ title: resolved.title, message: resolved.message })
        setLoading(false)
        return
      }

      auth.applyTokens({
        accessToken: data.accessToken || data.access_token,
        refreshToken: data.refreshToken || data.refresh_token,
        idToken: data.idToken,
      })

      window.location.replace('/')
    } catch (err) {
      const resolved = resolveLoginError({ status: null, data: null }, err, t)
      setAlert({ title: resolved.title, message: resolved.message })
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <form className="auth-form auth-fade-up" onSubmit={handleLogin}>
        <div style={{ marginBottom: 26 }}>
          <Logo size={34} />
        </div>

        <h1 className="h1" style={{ marginBottom: 6 }}>{t('auth.loginTitle')}</h1>
        <p className="muted" style={{ marginBottom: 26 }}>{t('auth.loginSubtitle')}</p>

        {alert && (
          <AuthAlert
            variant="error"
            title={alert.title}
            message={alert.message}
          />
        )}

        <div className="field" style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="username">{t('auth.username')}</label>
          <div className="input-icon">
            <Icon name="user" size={17} />
            <input
              id="username"
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.loginPlaceholder')}
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 10 }}>
          <label className="label" htmlFor="password">{t('auth.password')}</label>
          <div className="input-icon">
            <Icon name="lock" size={17} />
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg btn-block"
          disabled={loading}
          style={{ marginTop: 14 }}
        >
          {loading && <Spinner size={16} color="#fff" />}
          {loading ? t('common.loading') : t('auth.loginButton')}
        </button>

        <p className="auth-switch">
          {t('auth.noAccount')}
          {' '}
          <Link to="/register">{t('auth.registerLink')}</Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default Login
