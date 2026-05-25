import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import AuthAlert from '../components/ui/AuthAlert'
import { getAuthApiBase, resolveRegisterError } from '../utils/authErrors'
import './Register.css'
import '../components/ui/auth-alert.css'

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

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode')
        } else {
            document.body.classList.remove('dark-mode')
        }
    }, [])

    // Очищаем форму при монтировании компонента
    useEffect(() => {
        setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            role: 'client'
        })
    }, [])
    const [alert, setAlert] = useState(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

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
            const {confirmPassword, ...registrationData} = formData

            await axios.post(`${getAuthApiBase()}/auth/register`, registrationData)

            setSuccess(true)
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err) {
            const resolved = resolveRegisterError(
                {
                    status: err.response?.status,
                    data: err.response?.data,
                },
                err,
                t
            )
            setAlert({ title: resolved.title, message: resolved.message })
            setLoading(false)
        }
    }

    // if (success) {
    //     return (
    //         <div className="login-page"> {/* Используем тот же класс страницы */}
    //             <div className="login-container-wrapper">
    //                 {/* Левая часть остается такой же для преемственности */}
    //                 <div className="login-illustration-section">
    //                     <div className="books-illustration">
    //                         <svg width="400" height="320" viewBox="0 0 700 420" fill="none"
    //                              xmlns="http://www.w3.org/2000/svg">
    //                             <line x1="80" y1="348" x2="620" y2="348" stroke="currentColor" strokeWidth="2.5"
    //                                   strokeLinecap="round"/>
    //                             <rect x="248" y="122" width="140" height="226" rx="5" stroke="currentColor"
    //                                   strokeWidth="2.5"/>
    //                             <polyline points="304,160 317,152 330,160" stroke="currentColor" strokeWidth="2"
    //                                       fill="white"/>
    //                             <rect x="272" y="177" width="94" height="56" rx="3" stroke="currentColor"
    //                                   strokeWidth="2"/>
    //                             {/* ... (остальной твой SVG) */}
    //                         </svg>
    //                     </div>
    //                     <div className="illustration-text">
    //                         <h2>ACADEMIS</h2>
    //                         <p>Инновационная среда для вашего обучения</p>
    //                     </div>
    //                 </div>
    //
    //                 <div className="login-form-section">
    //                     <div className="login-card">
    //                         <div className="success-message" style={{textAlign: 'center'}}>
    //                             <div style={{fontSize: '50px', marginBottom: '20px'}}>✅</div>
    //                             <h2 style={{color: 'var(--text-dark)', fontWeight: '800'}}>Регистрация успешна!</h2>
    //                             <p style={{color: 'var(--text-gray)'}}>Вы будете перенаправлены на страницу входа...</p>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

// Основная форма регистрации
    return (

        <div className="login-page">

            <div className="login-container-wrapper" style={{maxWidth: '1100px'}}> {/* Чуть шире для 2 колонок */}

                {/* Левая часть — Иллюстрация */}
                <div className="login-illustration-section">
                    <div className="books-illustration">
                        <svg width="400" height="320" viewBox="0 0 700 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="80" y1="348" x2="620" y2="348" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                            <line x1="95" y1="360" x2="200" y2="360" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
                            <line x1="80" y1="370" x2="218" y2="370" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.2"/>
                            <line x1="248" y1="360" x2="390" y2="360" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
                            <line x1="232" y1="370" x2="405" y2="370" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.2"/>
                            <line x1="428" y1="360" x2="535" y2="360" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
                            <line x1="415" y1="370" x2="548" y2="370" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.2"/>

                            <line x1="55" y1="288" x2="85" y2="288" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                            <line x1="402" y1="168" x2="432" y2="168" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                            <line x1="408" y1="182" x2="430" y2="182" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>

                            {/* Левая стопка */}

                            {/* Нижняя книга — верхний торец (объём) */}
                            <path
                                d="M 82,304 Q 160,310 234,304 L 240,298 Q 160,292 88,298 Z"
                                fill="currentColor" opacity="0.18"
                            />
                            <path
                                d="M 82,304 Q 160,310 234,304 L 240,298 Q 160,292 88,298 Z"
                                stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4"
                            />

                            {/* Нижняя книга — корпус */}
                            <path
                                d="M 88,304 L 228,304 Q 218,326 228,348 L 88,348 Q 82,348 82,342 L 82,310 Q 82,304 88,304 Z"
                                stroke="currentColor" strokeWidth="2.2" fill="none"
                            />

                            {/* Линии страниц — изогнуты под кривую правой стороны */}
                            <path d="M 86,316 Q 204,314 224,316" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 86,325 Q 204,323 224,326" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 86,336 Q 204,334 224,337" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>

                            {/* Страницы — срез справа */}
                            <path d="M 228,304 Q 208,326 228,348" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.25"/>
                            <path d="M 225,304 Q 205,326 225,348" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.18"/>
                            <path d="M 222,304 Q 202,326 222,348" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.12"/>

                            {/* Правый торец нижней книги */}
                            <path
                                d="M 225,304 L 240,298 Q 230,320 237,345 L 223,348 Z"
                                fill="currentColor" opacity="0.12"
                            />

                            {/* Верхняя книга — верхний торец (объём) */}
                            <path
                                d="M 92,263 Q 160,269 227,263 L 233,257 Q 160,251 98,257 Z"
                                fill="currentColor" opacity="0.18"
                            />
                            <path
                                d="M 92,263 Q 160,269 227,263 L 233,257 Q 160,251 98,257 Z"
                                stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4"
                            />

                            {/* Верхняя книга — корпус */}
                            <path
                                d="M 98,263 L 221,263 Q 211,284 221,305 L 98,305 Q 92,305 92,299 L 92,269 Q 92,263 98,263 Z"
                                stroke="currentColor" strokeWidth="2.2" fill="none"
                            />

                            {/* Линии страниц — изогнуты под кривую правой стороны */}
                            <path d="M 96,271 Q 196,269 217,271" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 96,280 Q 196,278 217,280" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 96,289 Q 196,287 217,290" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 96,298 Q 196,296 217,299" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>

                            {/* Страницы — срез справа */}
                            <path d="M 221,263 Q 201,284 221,305" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.25"/>
                            <path d="M 218,263 Q 198,284 218,305" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.18"/>
                            <path d="M 215,263 Q 195,284 215,305" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.12"/>

                            {/* Правый торец верхней книги */}
                            <path
                                d="M 217,263 L 233,257 Q 223,278 230,299 L 217,305 Z"
                                fill="currentColor" opacity="0.12"
                            />       {/* Центр */}

                            {/* Верхний торец центральной книги (объём) */}
                            <polygon points="248,122 388,122 396,114 256,114" fill="currentColor" opacity="0.18"/>
                            <polygon points="248,122 388,122 396,114 256,114" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>

                            {/* Корешок центральной книги (объём) */}
                            <polygon points="248,122 256,114 256,340 248,348" fill="currentColor" opacity="0.22"/>
                            <polygon points="248,122 256,114 256,340 248,348" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>

                            {/* Правый торец (страницы) */}
                            <polygon points="388,122 396,114 396,340 388,348" fill="currentColor" opacity="0.08"/>
                            <line x1="389" y1="125" x2="389" y2="342" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3"/>

                            <rect x="248" y="122" width="140" height="226" rx="5" stroke="currentColor" strokeWidth="2.5"/>
                            <polyline points="304,160 317,152 330,160" stroke="currentColor" strokeWidth="2" fill="var(--bg-container)"/>
                            <rect x="272" y="177" width="94" height="56" rx="3" stroke="currentColor" strokeWidth="2"/>

                            {/* Закладка центральной книги */}
                            <polygon points="306,122 318,122 318,148 312,140 306,148" fill="currentColor" opacity="0.5"/>

                            {/* Правая книга */}

                            {/* Верхний торец правой книги (объём) */}
                            <polygon points="418,210 530,210 537,203 425,203" fill="currentColor" opacity="0.18"/>
                            <polygon points="418,210 530,210 537,203 425,203" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>

                            {/* Корешок правой книги (объём) */}
                            <polygon points="418,210 425,203 425,343 418,348" fill="currentColor" opacity="0.22"/>
                            <polygon points="418,210 425,203 425,343 418,348" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>

                            {/* Правый торец (страницы) */}
                            <polygon points="530,210 537,203 537,343 530,348" fill="currentColor" opacity="0.08"/>
                            <line x1="531" y1="213" x2="531" y2="342" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3"/>

                            <rect x="418" y="210" width="112" height="138" rx="4" stroke="currentColor" strokeWidth="2.2"/>
                            <rect x="438" y="243" width="72" height="44" rx="3" stroke="currentColor" strokeWidth="2"/>

                            {/* Закладка правой книги */}
                            <polygon points="495,210 505,210 505,232 500,225 495,232" fill="currentColor" opacity="0.5"/>
                        </svg>
                    </div>
                    <div className="illustration-text">
                        <h2>ACADEMIS</h2>
                        <p>{t('auth.brandSubtitle')}</p>
                    </div>
                </div>

                {/* Правая часть — Форма регистрации */}
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

