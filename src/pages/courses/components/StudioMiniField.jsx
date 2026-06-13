import React from 'react'

const StudioMiniField = ({ label, children, style }) => (
  <div className="field" style={{ gap: 5, ...style }}>
    <label className="label" style={{ fontSize: 11.5 }}>
      {label}
    </label>
    {children}
  </div>
)

export default StudioMiniField
