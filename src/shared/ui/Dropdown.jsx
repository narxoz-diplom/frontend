import React, { useEffect, useRef, useState } from 'react'

const Dropdown = ({ trigger, children, align = 'right', width, className = '' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onMouseDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [open])

  return (
    <div className={`dropdown-wrap ${className}`.trim()} ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen((value) => !value)} role="presentation">
        {trigger}
      </div>
      {open && (
        <div
          className="dropdown-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            [align]: 0,
            zIndex: 600,
            width,
          }}
          onClick={(event) => {
            if (event.target.closest('.menu-item, a[role="menuitem"]')) {
              setOpen(false)
            }
          }}
        >
          <div className="menu" style={width ? { width: '100%' } : undefined}>
            {typeof children === 'function' ? children(() => setOpen(false)) : children}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dropdown
