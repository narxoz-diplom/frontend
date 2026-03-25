import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import auth from '../config/auth'
import './Login.css'

const parseJwtPayload = (token) => {
    if (!token) return null
    try {
        let payload = token.split('.')[1]
        if (!payload) return null
        switch (payload.length % 4) {
            case 2: payload += '=='; break
            case 3: payload += '='; break
        }
        return JSON.parse(atob(payload))
    } catch {
        return null
    }
}

const translations = {
    ru: {
        brandSubtitle: "Инновационная среда для вашего обучения",
        formTitle: "Вход в систему",
        formSubtitle: "Введите ваши учетные данные",
        labelUser: "Имя пользователя",
        labelPass: "Пароль",
        placeholderUser: "Логин или Email",
        btnLog: "Войти",
        btnLoading: "Загрузка...",
        noAccount: "Нет аккаунта?",
        linkReg: "Зарегистрироваться",
        errorLabel: "Ошибка входа",
        errInvalid: "Неверное имя пользователя или пароль",
        errServer: "Сервис временно недоступен",
        errDefault: "Не удалось войти в систему"
    },
    en: {
        brandSubtitle: "Innovative environment for your learning",
        formTitle: "Sign In",
        formSubtitle: "Enter your credentials",
        labelUser: "Username",
        labelPass: "Password",
        placeholderUser: "Login or Email",
        btnLog: "Login",
        btnLoading: "Loading...",
        noAccount: "No account?",
        linkReg: "Register now",
        errorLabel: "Login Error",
        errInvalid: "Invalid username or password",
        errServer: "Service temporarily unavailable",
        errDefault: "Could not log in"
    },
    kk: {
        brandSubtitle: "Оқуыңызға арналған инновациялық орта",
        formTitle: "Жүйеге кіру",
        formSubtitle: "Тіркелгі деректерін енгізіңіз",
        labelUser: "Пайдаланушы аты",
        labelPass: "Құпия сөз",
        placeholderUser: "Логин немесе Email",
        btnLog: "Кіру",
        btnLoading: "Жүктеу...",
        noAccount: "Тіркелгі жоқ па?",
        linkReg: "Тіркелу",
        errorLabel: "Кіру қатесі",
        errInvalid: "Пайдаланушы аты немесе құпия сөз қате",
        errServer: "Сервис уақытша қолжетімсіз",
        errDefault: "Жүйеге кіру мүмкін болмады"
    }
}

const Login = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const currentLang = localStorage.getItem('language') || 'ru'
    const t = translations[currentLang] || translations.ru

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        document.title = currentLang === 'ru' ? 'Academis | Вход' : (currentLang === 'kk' ? 'Academis | Кіру' : 'Academis | Login');
    }, [currentLang]);

    useEffect(() => {
        if (auth.authenticated) {
            window.location.replace('/')
        }
    }, [])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8083'
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))

                // ИСПРАВЛЕННАЯ ЛОГИКА:
                if (response.status === 401) {
                    throw new Error(t.errInvalid); // Точно неверный пароль/логин
                } else if (response.status === 404 || response.status >= 500) {
                    throw new Error(t.errServer);  // Проблемы с сервером
                } else {
                    throw new Error(errorData.message || t.errDefault); // Остальные ошибки
                }
            }

            const tokenData = await response.json()
            const accessToken = tokenData.accessToken || tokenData.access_token
            const refreshToken = tokenData.refreshToken || tokenData.refresh_token

            localStorage.setItem('kc-access-token', accessToken)
            localStorage.setItem('kc-refresh-token', refreshToken || '')
            if (tokenData.idToken) localStorage.setItem('kc-id-token', tokenData.idToken)
            localStorage.setItem('kc-authenticated', 'true')

            auth.authenticated = true
            auth.token = accessToken
            auth.refreshToken = refreshToken
            auth.tokenParsed = parseJwtPayload(accessToken)
            if (typeof window !== 'undefined') window.keycloak = auth

            window.location.replace('/')
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-container-wrapper">
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
                            <path d="M 82,304 Q 160,310 234,304 L 240,298 Q 160,292 88,298 Z" fill="currentColor" opacity="0.18"/>
                            <path d="M 82,304 Q 160,310 234,304 L 240,298 Q 160,292 88,298 Z" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4"/>
                            <path d="M 88,304 L 228,304 Q 218,326 228,348 L 88,348 Q 82,348 82,342 L 82,310 Q 82,304 88,304 Z" stroke="currentColor" strokeWidth="2.2" fill="none"/>
                            <path d="M 86,316 Q 204,314 224,316" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 86,325 Q 204,323 224,326" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 86,336 Q 204,334 224,337" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 228,304 Q 208,326 228,348" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.25"/>
                            <path d="M 225,304 Q 205,326 225,348" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.18"/>
                            <path d="M 222,304 Q 202,326 222,348" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.12"/>
                            <path d="M 225,304 L 240,298 Q 230,320 237,345 L 223,348 Z" fill="currentColor" opacity="0.12"/>
                            <path d="M 92,263 Q 160,269 227,263 L 233,257 Q 160,251 98,257 Z" fill="currentColor" opacity="0.18"/>
                            <path d="M 92,263 Q 160,269 227,263 L 233,257 Q 160,251 98,257 Z" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.4"/>
                            <path d="M 98,263 L 221,263 Q 211,284 221,305 L 98,305 Q 92,305 92,299 L 92,269 Q 92,263 98,263 Z" stroke="currentColor" strokeWidth="2.2" fill="none"/>
                            <path d="M 96,271 Q 196,269 217,271" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 96,280 Q 196,278 217,280" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 96,289 Q 196,287 217,290" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 96,298 Q 196,296 217,299" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.45"/>
                            <path d="M 221,263 Q 201,284 221,305" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.25"/>
                            <path d="M 218,263 Q 198,284 218,305" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.18"/>
                            <path d="M 215,263 Q 195,284 215,305" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.12"/>
                            <path d="M 217,263 L 233,257 Q 223,278 230,299 L 217,305 Z" fill="currentColor" opacity="0.12"/>
                            <polygon points="248,122 388,122 396,114 256,114" fill="currentColor" opacity="0.18"/>
                            <polygon points="248,122 388,122 396,114 256,114" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>
                            <polygon points="248,122 256,114 256,340 248,348" fill="currentColor" opacity="0.22"/>
                            <polygon points="248,122 256,114 256,340 248,348" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>
                            <polygon points="388,122 396,114 396,340 388,348" fill="currentColor" opacity="0.08"/>
                            <line x1="389" y1="125" x2="389" y2="342" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3"/>
                            <rect x="248" y="122" width="140" height="226" rx="5" stroke="currentColor" strokeWidth="2.5"/>
                            <polyline points="304,160 317,152 330,160" stroke="currentColor" strokeWidth="2" fill="var(--bg-container)"/>
                            <rect x="272" y="177" width="94" height="56" rx="3" stroke="currentColor" strokeWidth="2"/>
                            <polygon points="306,122 318,122 318,148 312,140 306,148" fill="currentColor" opacity="0.5"/>
                            <polygon points="418,210 530,210 537,203 425,203" fill="currentColor" opacity="0.18"/>
                            <polygon points="418,210 530,210 537,203 425,203" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>
                            <polygon points="418,210 425,203 425,343 418,348" fill="currentColor" opacity="0.22"/>
                            <polygon points="418,210 425,203 425,343 418,348" stroke="currentColor" strokeWidth="1.5" opacity="0.45"/>
                            <polygon points="530,210 537,203 537,343 530,348" fill="currentColor" opacity="0.08"/>
                            <line x1="531" y1="213" x2="531" y2="342" stroke="currentColor" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3"/>
                            <rect x="418" y="210" width="112" height="138" rx="4" stroke="currentColor" strokeWidth="2.2"/>
                            <rect x="438" y="243" width="72" height="44" rx="3" stroke="currentColor" strokeWidth="2"/>
                            <polygon points="495,210 505,210 505,232 500,225 495,232" fill="currentColor" opacity="0.5"/>
                        </svg>
                    </div>
                    <div className="illustration-text">
                        <h2>ACADEMIS</h2>
                        <p>{t.brandSubtitle}</p>
                    </div>
                </div>

                <div className="login-form-section">
                    <div className="login-card">
                        <h1>{t.formTitle}</h1>
                        <p className="login-subtitle">{t.formSubtitle}</p>

                        {error && (
                            <div className="error-alert">
                                <span className="error-icon">!</span>
                                <div className="error-text-wrapper">
                                    <strong>{t.errorLabel}</strong>
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label htmlFor="username">{t.labelUser}</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t.placeholderUser}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">{t.labelPass}</label>
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
                                {loading ? t.btnLoading : t.btnLog}
                            </button>
                        </form>

                        <div className="login-help">
                            <span>{t.noAccount} </span>
                            <Link to="/register">{t.linkReg}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login