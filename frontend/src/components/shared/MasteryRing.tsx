interface MasteryRingProps {
  value: number  // 0-100
  size?: number  // default 64
}

export default function MasteryRing({ value, size = 64 }: MasteryRingProps) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  let stroke = 'var(--primary)'
  if (value < 50) stroke = 'var(--destructive)'
  else if (value < 75) stroke = 'var(--warning)'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={stroke}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .5s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size < 48 ? 10 : 13}
        fontWeight="700"
        fill="var(--foreground)"
        fontFamily="'Space Grotesk', sans-serif"
      >
        {Math.round(value)}%
      </text>
    </svg>
  )
}
