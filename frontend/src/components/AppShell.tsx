import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Library,
  BrainCircuit,
  ChartNoAxesCombined,
  Sparkles,
  Settings,
  Menu,
  X,
  CheckCircle2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Page } from '../context/AppContext'

interface NavItem {
  label: Page
  icon: React.ComponentType<{ size?: number }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',               icon: LayoutDashboard },
  { label: 'My Learning',            icon: BookOpen },
  { label: 'Performance Lab',        icon: GraduationCap },
  { label: 'AI Study Planner',       icon: CalendarDays },
  { label: 'Learning Resources',     icon: Library },
  { label: 'Practice Studio',        icon: BrainCircuit },
  { label: 'Progress Reports',       icon: ChartNoAxesCombined },
  { label: 'AI Learning Assistant',  icon: Sparkles },
  { label: 'Settings',               icon: Settings },
]

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { page, setPage, online, toast, setToast } = useApp()
  const [mobile, setMobile] = useState(false)

  function navigate(p: Page) {
    setPage(p)
    setMobile(false)
  }

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className={`sidebar${mobile ? ' sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="brand-name">LearnWise AI</div>
            <div className="brand-sub">Student Dashboard</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item${page === label ? ' nav-item--active' : ''}`}
              onClick={() => navigate(label)}
              aria-current={page === label ? 'page' : undefined}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* Profile */}
        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">JS</div>
            <div className="profile-info">
              <div className="profile-name">Jay Student</div>
              <div className="profile-role">Student · DEMO</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile scrim */}
      {mobile && (
        <button
          className="scrim"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Main */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <nav className="breadcrumb" aria-label="Breadcrumb">
              Workspace / <b>{page}</b>
            </nav>
          </div>
          <div className="topbar-right">
            <span className="demo-badge">DEMO MODE</span>
            <span
              className={`api-dot${online ? ' api-dot--online' : ''}`}
              title={online ? 'API connected' : 'Using demo data'}
              aria-label={online ? 'API connected' : 'Using demo data'}
            />
            <div className="avatar">JS</div>
          </div>
        </header>

        {/* Page content */}
        <div className="content">{children}</div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
          <button onClick={() => setToast('')} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
