import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './i18n'
import './styles/academis-tokens.css'
import './index.css'
import './styles/academis-primitives.css'
import './pages/ai-academis.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
