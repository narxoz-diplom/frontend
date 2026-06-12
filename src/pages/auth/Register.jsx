import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthAlert from '@/shared/ui/AuthAlert'
import { register } from '@/shared/api/authApi'
import { resolveRegisterError } from '@/shared/lib/authErrors'
import AuthIllustration from './components/AuthIllustration'
import './Register.css'
import '@/shared/ui/auth-alert.css'

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
        role: 'client'
    })
    const [alert, setAlert] = useState(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode')
        } else {
            document.body.classList.remove('dark-mode')
        }
    }, [])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
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
        <div className="login-page">
            <div className="login-container-wrapper" style={{maxWidth: '1100px'}}>
                <AuthIllustration />

                <div className="login-form-section">
                    <div className="login-card" style={{maxWidth: '480px'}}>
                        <h1>{t('auth.registerTitle')}</h1>
                        <p className="login-subtitle">{t('auth.registerSubtitle')}</p>

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

                        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('auth.firstName')}</label>
                                    <input
                                        name="firstName"
                                        type="text"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Иван"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('auth.lastName')}</label>
                                    <input
                                        name="lastName"
                                        type="text"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Иванов"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t('auth.username')}</label>
                                <input
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="ivan_pro"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="example@mail.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('auth.role')}</label>
                                <select name="role" value={formData.role} onChange={handleChange}>
                                    <option value="client">{t('auth.student')}</option>
                                    <option value="teacher">{t('auth.teacher')}</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>{t('auth.password')}</label>
                                    <input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('auth.confirmPassword')}</label>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-block btn-primary"
                                disabled={loading}
                            >
                                {loading ? t('auth.registerLoading') : t('auth.registerButton')}
                            </button>
                        </form>

                        <div className="login-help">
                            <span>{t('auth.alreadyHaveAccount')} </span>
                            <Link to="/login">{t('nav.login')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register
