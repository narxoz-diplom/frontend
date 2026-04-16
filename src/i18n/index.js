import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const STORAGE_KEY = 'lang'

const resources = {
  ru: {
    translation: {
      lang: 'Язык',
      ru: 'Русский',
      en: 'English',
      kz: 'Қазақша',

      nav: {
        courses: 'Курсы',
        files: 'Файлы',
        notifications: 'Уведомления',
        profile: 'Профиль',
        rag: 'RAG',
        adminNews: 'Новости (админ)',
        login: 'Вход',
        register: 'Регистрация',
        logout: 'Выйти',
      },
    },
  },
  en: {
    translation: {
      lang: 'Language',
      ru: 'Russian',
      en: 'English',
      kz: 'Kazakh',

      nav: {
        courses: 'Courses',
        files: 'Files',
        notifications: 'Notifications',
        profile: 'Profile',
        rag: 'RAG',
        adminNews: 'News (admin)',
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
      },
    },
  },
  kz: {
    translation: {
      lang: 'Тіл',
      ru: 'Орысша',
      en: 'Ағылшынша',
      kz: 'Қазақша',

      nav: {
        courses: 'Курстар',
        files: 'Файлдар',
        notifications: 'Хабарламалар',
        profile: 'Профиль',
        rag: 'RAG',
        adminNews: 'Жаңалықтар (админ)',
        login: 'Кіру',
        register: 'Тіркелу',
        logout: 'Шығу',
      },
    },
  },
}

function getInitialLang() {
  if (typeof window === 'undefined') return 'ru'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'ru' || saved === 'en' || saved === 'kz') return saved
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('kk') || nav.startsWith('kz')) return 'kz'
  if (nav.startsWith('en')) return 'en'
  return 'ru'
}

export function setLang(lang) {
  const next = lang === 'ru' || lang === 'en' || lang === 'kz' ? lang : 'ru'
  i18n.changeLanguage(next)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLang(),
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
})

export default i18n

