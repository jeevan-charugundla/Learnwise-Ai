import type { ReactNode } from 'react'

type ColorVariant = 'purple' | 'blue' | 'orange' | 'green' | 'cyan'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string
  change?: string
  changeDir?: 'up' | 'down'
  detail?: string
  color?: ColorVariant
}

export default function StatCard({
  icon,
  label,
  value,
  change,
  changeDir,
  detail,
  color = 'purple',
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-card-icon stat-card-icon--${color}`}>{icon}</div>
        {change && changeDir && (
          <span className={`stat-card-badge stat-card-badge--${changeDir}`}>
            {changeDir === 'up' ? '▲' : '▼'} {change}
          </span>
        )}
      </div>
      <div>
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{value}</p>
        {detail && <p className="stat-card-detail">{detail}</p>}
      </div>
    </div>
  )
}
