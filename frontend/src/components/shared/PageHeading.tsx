import type { ReactNode } from 'react'

interface PageHeadingProps {
  eyebrow: string
  title: string
  desc?: string
  action?: ReactNode
}

export default function PageHeading({ eyebrow, title, desc, action }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div className="page-heading__row">
        <div>
          <p className="page-heading__eyebrow">{eyebrow}</p>
          <h1 className="page-heading__title">{title}</h1>
          {desc && <p className="page-heading__desc">{desc}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
