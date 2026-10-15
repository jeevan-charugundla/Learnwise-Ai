import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  desc?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, desc, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      {desc && <p className="empty-state-desc">{desc}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
