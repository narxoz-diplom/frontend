import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import keycloak from '../config/keycloak'
import './Login.css'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Проверяем, не авторизован ли уже пользователь
    // Инициализация Keycloak происходит в App.jsx, здесь мы только проверяем состояние
    if (keycloak.authenticated) {
      window.location.reload()
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Используем auth-service через API Gateway
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8083'
      const loginUrl = `${apiUrl}/api/auth/login`
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Неверное имя пользователя или пароль')
      }

      const tokenData = await response.json()
      
      // Сохраняем токены в localStorage для использования после перезагрузки
      localStorage.setItem('kc-access-token', tokenData.accessToken)
      localStorage.setItem('kc-refresh-token', tokenData.refreshToken)
      if (tokenData.idToken) {
        localStorage.setItem('kc-id-token', tokenData.idToken)
      }
      
      // Устанавливаем токены в Keycloak объект для совместимости
      keycloak.authenticated = true
      keycloak.token = tokenData.accessToken
      keycloak.refreshToken = tokenData.refreshToken
      keycloak.idToken = tokenData.idToken
      
      // Парсим токен для получения информации о пользователе
      if (tokenData.accessToken) {
        try {
          // Добавляем padding если нужно
          let payload = tokenData.accessToken.split('.')[1]
          switch (payload.length % 4) {
            case 2: payload += '=='; break
            case 3: payload += '='; break
          }
          const decoded = JSON.parse(atob(payload))
          keycloak.tokenParsed = decoded
        } catch (e) {
          console.error('Error parsing token', e)
        }
      }
      
      // Сохраняем информацию об аутентификации
      localStorage.setItem('kc-authenticated', 'true')
      
      // Убеждаемся, что keycloak доступен в window
      if (typeof window !== 'undefined') {
        window.keycloak = keycloak
      }
      
      // Обновляем состояние инициализации
      keycloak.initialized = true
      
      // Перезагружаем страницу
      window.location.reload()
    } catch (err) {
      setError(err.message || 'Ошибка входа. Проверьте имя пользователя и пароль.')
      setLoading(false)
    }
  }

  const handleKeycloakLogin = () => {
    // Указываем redirectUri для правильного возврата после логина
    const redirectUri = window.location.origin + window.location.pathname
    keycloak.login({ redirectUri })
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1>Вход в систему</h1>
          <p className="login-subtitle">Образовательная платформа</p>
          
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="login-divider">
            <span>или</span>
          </div>

          <button 
            onClick={handleKeycloakLogin}
            className="btn btn-secondary btn-block"
            disabled={loading}
          >
            Войти через Keycloak
          </button>

          <p className="login-help">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login


