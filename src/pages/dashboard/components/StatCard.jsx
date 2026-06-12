import React from 'react'

const StatCard = ({ icon, tone, value, label }) => (
    <div className="stat-card">
        <div className={`stat-icon stat-icon-${tone}`}>{icon}</div>
        <div className="stat-content">
            <p className="stat-value">{value}</p>
            <p className="stat-label">{label}</p>
        </div>
    </div>
)

export default StatCard
