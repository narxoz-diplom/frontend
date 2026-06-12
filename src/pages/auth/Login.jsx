import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import auth from '@/shared/config/auth'
import { useTranslation } from 'react-i18next'
import AuthAlert from '@/shared/ui/AuthAlert'
import { login } from '@/shared/api/authApi'
import { resolveLoginError } from '@/shared/lib/authErrors'
import AuthIllustration from './components/AuthIllustration'
import './Login.css'
import '@/shared/ui/auth-alert.css'

const Login = () => {
    const { t, i18n } = useTranslation()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [alert, setAlert] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        document.title = `Academis | ${t('auth.loginTitle')}`;
    }, [i18n.language, t]);

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
        <div className="login-page">
            <div className="login-container-wrapper">
                <AuthIllustration />

                <div className="login-form-section">
                    <div className="login-card">
                        <h1>{t('auth.loginTitle')}</h1>
                        <p className="login-subtitle">{t('auth.loginSubtitle')}</p>

                        {alert && (
                            <AuthAlert
                                variant="error"
                                title={alert.title}
                                message={alert.message}
                            />
                        )}

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label htmlFor="username">{t('auth.username')}</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t('auth.loginPlaceholder')}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">{t('auth.password')}</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-block btn-primary"
                                disabled={loading}
                            >
                                {loading ? t('common.loading') : t('auth.loginButton')}
                            </button>
                        </form>

                        <div className="login-help">
                            <span>{t('auth.noAccount')} </span>
                            <Link to="/register">{t('auth.registerLink')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
