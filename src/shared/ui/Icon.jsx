import React from 'react'
import {
  FiAlertTriangle,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookmark,
  FiBook,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiCpu,
  FiDownload,
  FiEdit2,
  FiEdit3,
  FiEye,
  FiFile,
  FiFileText,
  FiFilter,
  FiFolder,
  FiGlobe,
  FiGrid,
  FiHome,
  FiInfo,
  FiLayers,
  FiLink2,
  FiList,
  FiLock,
  FiLogOut,
  FiMail,
  FiMenu,
  FiMessageSquare,
  FiMonitor,
  FiMoon,
  FiMoreHorizontal,
  FiPause,
  FiPlay,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiSettings,
  FiStar,
  FiSun,
  FiTarget,
  FiTrash2,
  FiTrendingUp,
  FiUpload,
  FiUser,
  FiUsers,
  FiVideo,
  FiX,
  FiXCircle,
  FiZap,
} from 'react-icons/fi'

const STROKE_WIDTH = 1.75

const svgProps = (size, className, style) => ({
  width: size,
  height: size,
  className: `ic ${className}`.trim(),
  style: { display: 'block', flexShrink: 0, ...style },
  'aria-hidden': true,
})

const strokeSvg = (size, className, style, children) => (
  <svg
    {...svgProps(size, className, style)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={STROKE_WIDTH}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

function IconSparkles({ size = 18, className = '', style = {} }) {
  return strokeSvg(size, className, style, (
    <>
      <path d="M12 3l1.2 3.4L16.6 8l-3.4 1.2L12 12.6 10.8 9.2 7.4 8l3.4-1.2z" />
      <path d="M19 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
      <path d="M5 15l.6 1.6 1.6.6-1.6.6L5 19.4l-.6-1.6-1.6-.6 1.6-.6z" />
    </>
  ))
}

function IconFire({ size = 18, className = '', style = {} }) {
  return strokeSvg(size, className, style, (
    <path d="M12 22c3.5-1.5 5.5-4.5 5.5-8.5C17.5 9 15.5 6 12 4c-1.5 2-3 3.5-3 6.5 0 1.2.4 2.2 1 3-1.2-.5-2-1.6-2-3 0-2.5 1.5-4.5 3-6-2.5 2-4 5-4 8.5 0 4 2 7 5 8.5z" />
  ))
}

function IconGem({ size = 18, className = '', style = {} }) {
  return strokeSvg(size, className, style, (
    <>
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20" />
      <path d="M12 21V9" />
      <path d="M6 3l6 6 6-6" />
    </>
  ))
}

function IconCoins({ size = 18, className = '', style = {} }) {
  return strokeSvg(size, className, style, (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" />
    </>
  ))
}

function IconEnroll({ size = 18, className = '', style = {} }) {
  return strokeSvg(size, className, style, (
    <>
      <path d="M12 3L2 8l10 5 8-3.6V15" />
      <path d="M6 13.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5" />
    </>
  ))
}

const ICON_COMPONENTS = {
  home: FiHome,
  book: FiBook,
  books: FiBookOpen,
  grade: FiClipboard,
  chart: FiBarChart2,
  file: FiFile,
  files: FiFolder,
  news: FiFileText,
  logout: FiLogOut,
  search: FiSearch,
  bell: FiBell,
  sun: FiSun,
  moon: FiMoon,
  globe: FiGlobe,
  user: FiUser,
  users: FiUsers,
  chevDown: FiChevronDown,
  chevRight: FiChevronRight,
  chevLeft: FiChevronLeft,
  arrowRight: FiArrowRight,
  plus: FiPlus,
  edit: FiEdit2,
  trash: FiTrash2,
  check: FiCheck,
  checkCircle: FiCheckCircle,
  x: FiX,
  xCircle: FiXCircle,
  upload: FiUpload,
  download: FiDownload,
  link: FiLink2,
  sparkles: IconSparkles,
  bolt: FiZap,
  play: FiPlay,
  pause: FiPause,
  video: FiVideo,
  send: FiSend,
  menu: FiMenu,
  dots: FiMoreHorizontal,
  eye: FiEye,
  lock: FiLock,
  mail: FiMail,
  settings: FiSettings,
  clock: FiClock,
  calendar: FiCalendar,
  fire: IconFire,
  award: FiAward,
  target: FiTarget,
  layers: FiLayers,
  doc: FiFileText,
  message: FiMessageSquare,
  robot: FiCpu,
  filter: FiFilter,
  star: FiStar,
  trend: FiTrendingUp,
  info: FiInfo,
  warn: FiAlertTriangle,
  gem: IconGem,
  coins: IconCoins,
  rename: FiEdit3,
  bookmark: FiBookmark,
  refresh: FiRefreshCw,
  enroll: IconEnroll,
  monitor: FiMonitor,
  list: FiList,
  grid: FiGrid,
}

const ICONS = Object.fromEntries(Object.keys(ICON_COMPONENTS).map((name) => [name, name]))

export function Icon({ name, size = 18, className = '', style = {} }) {
  const Component = ICON_COMPONENTS[name]
  if (!Component) {
    return (
      <span
        className={`ic ${className}`.trim()}
        style={{ width: size, height: size, display: 'inline-block', ...style }}
      />
    )
  }

  return (
    <Component
      className={`ic ${className}`.trim()}
      size={size}
      strokeWidth={STROKE_WIDTH}
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-hidden
    />
  )
}

export { ICONS }
