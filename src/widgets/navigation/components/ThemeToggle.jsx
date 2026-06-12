import React, { useEffect, useState } from 'react'
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi'

const ThemeToggle = () => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system'
    })

    useEffect(() => {
        const applyTheme = () => {
            const root = document.body
            root.classList.remove('dark-mode')

            if (theme === 'dark') {
                root.classList.add('dark-mode')
            } else if (theme === 'system') {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark-mode')
                }
            }
        }

        applyTheme()
        localStorage.setItem('theme', theme)

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleSystemChange = () => {
            if (theme === 'system') applyTheme()
        }

        mediaQuery.addEventListener('change', handleSystemChange)
        return () => mediaQuery.removeEventListener('change', handleSystemChange)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'light') return 'dark'
            if (prev === 'dark') return 'system'
            return 'light'
        })
    }

    const getThemeIcon = () => {
        if (theme === 'light') return <FiSun />
        if (theme === 'dark') return <FiMoon />
        return <FiMonitor />
    }

    return (
        <button
            className="top-action-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={`Режим: ${theme}`}
        >
            {getThemeIcon()}
        </button>
    )
}

export default ThemeToggle
