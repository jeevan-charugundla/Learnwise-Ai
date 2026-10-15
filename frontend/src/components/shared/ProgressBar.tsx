interface ProgressBarProps {
  value: number
  max: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export default function ProgressBar({ value, max, variant = 'default' }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100)
  const fillClass = variant === 'default' ? 'progress-bar-fill' : `progress-bar-fill progress-bar-fill--${variant}`
  return (
    <div className="progress-bar-track">
      <div className={fillClass} style={{ width: `${pct}%` }} />
    </div>
  )
}
