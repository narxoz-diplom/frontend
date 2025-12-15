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
      // Прямой вызов к Keycloak API для входа через username/password
      // Для этого нужно включить "Direct Access Grants" в настройках клиента Keycloak
      const tokenUrl = 'http://localhost:8080/realms/microservices-realm/protocol/openid-connect/token'
      
      const formData = new URLSearchParams()
      formData.append('grant_type', 'password')
      formData.append('client_id', 'microservices-client')
      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error_description || 'Неверное имя пользователя или пароль')
      }

      const tokenData = await response.json()
      
      // Сохраняем токены в localStorage для использования после перезагрузки
      localStorage.setItem('kc-access-token', tokenData.access_token)
      localStorage.setItem('kc-refresh-token', tokenData.refresh_token)
      if (tokenData.id_token) {
        localStorage.setItem('kc-id-token', tokenData.id_token)
      }
      
      // Устанавливаем токены в Keycloak
      keycloak.authenticated = true
      keycloak.token = tokenData.access_token
      keycloak.refreshToken = tokenData.refresh_token
      keycloak.idToken = tokenData.id_token
      
      // Парсим токен для получения информации о пользователе
      if (tokenData.access_token) {
        try {
          const payload = JSON.parse(atob(tokenData.access_token.split('.')[1]))
          keycloak.tokenParsed = payload
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
    keycloak.login()
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


