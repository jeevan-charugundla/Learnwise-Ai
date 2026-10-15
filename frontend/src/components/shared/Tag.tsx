interface TagProps {
  variant: 'weak' | 'revise' | 'strong' | 'info' | 'warning' | 'success'
  label: string
}

export default function Tag({ variant, label }: TagProps) {
  return <span className={`tag tag--${variant}`}>{label}</span>
}
