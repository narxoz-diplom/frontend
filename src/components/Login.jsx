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

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (auth.authenticated) {
      window.location.reload()
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
        throw new Error(errorData.message || errorData.error || 'Неверное имя пользователя или пароль')
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

      window.location.reload()
    } catch (err) {
      setError(err.message || 'Ошибка входа.')
      setLoading(false)
    }
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

          <p className="login-help">
            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login


