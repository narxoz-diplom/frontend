import React from 'react'
import AuthIllustration from './AuthIllustration'
import AuthLangTheme from './AuthLangTheme'
import '../auth.css'

const AuthShell = ({ children }) => {
  return (
    <div className="auth-wrap">
      <AuthIllustration />
      <div className="auth-form-side">
        <AuthLangTheme />
        {children}
      </div>
    </div>
  )
}

export default AuthShell
