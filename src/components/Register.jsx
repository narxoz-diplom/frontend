import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import './Register.css'

const Register = () => {
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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Все поля обязательны для заполнения')
      return false
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Некорректный email адрес')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registrationData } = formData
      
      const response = await axios.post('http://localhost:8083/api/auth/register', registrationData)
      
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error)
      } else if (err.response?.status === 409) {
        setError('Пользователь с таким именем или email уже существует')
      } else {
        setError('Ошибка регистрации. Попробуйте еще раз.')
      }
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="register-page">
        <div className="register-container">
          <div className="register-card">
            <div className="success-message">
              <h2>Регистрация успешна!</h2>
              <p>Вы будете перенаправлены на страницу входа...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <h1>Регистрация</h1>
          <p className="register-subtitle">Создайте новый аккаунт</p>
          
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form" autoComplete="off">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Имя</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Введите имя"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Фамилия</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Введите фамилию"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Введите имя пользователя"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Роль</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
              >
                <option value="client">Студент (Client)</option>
                <option value="teacher">Преподаватель (Teacher)</option>
              </select>
              <small className="form-help-text">
                {formData.role === 'client' 
                  ? 'Студенты могут просматривать курсы и проходить обучение'
                  : 'Преподаватели могут создавать курсы и загружать видео'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Минимум 6 символов"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите пароль</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Повторите пароль"
                required
                autoComplete="new-password"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="register-help">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

