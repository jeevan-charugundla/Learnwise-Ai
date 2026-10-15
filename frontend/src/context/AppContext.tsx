import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { demoDashboard } from '../data/demo'
import type { Dashboard } from '../data/demo'

// ── Page type ────────────────────────────────────────────────────────────────

export type Page =
  | 'Overview'
  | 'My Learning'
  | 'Performance Lab'
  | 'AI Study Planner'
  | 'Learning Resources'
  | 'Practice Studio'
  | 'Progress Reports'
  | 'AI Learning Assistant'
  | 'Settings'

// ── Context shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  dashboard: Dashboard
  online: boolean
  loading: boolean
  toast: string
  setToast: (msg: string) => void
  refresh: () => Promise<void>
  bookmarks: Set<string>
  toggleBookmark: (id: string) => void
  page: Page
  setPage: (p: Page) => void
  practicePreset: { topic: string; subject: string } | null
  setPracticePreset: (p: { topic: string; subject: string } | null) => void
}

// ── Context creation ─────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [dashboard, setDashboard] = useState<Dashboard>(demoDashboard)
  const [online, setOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToastState] = useState('')
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [page, setPage] = useState<Page>('Overview')
  const [practicePreset, setPracticePreset] = useState<{
    topic: string
    subject: string
  } | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setToast(msg: string) {
    setToastState(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    if (msg) {
      toastTimer.current = setTimeout(() => setToastState(''), 4500)
    }
  }

  function toggleBookmark(id: string) {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function refresh() {
    setLoading(true)
    try {
      // Attempt to fetch live dashboard — gracefully fall back to demo data
      const res = await fetch(
        (import.meta.env.VITE_API_URL || 'http://localhost:8000/api') + '/dashboard'
      )
      if (!res.ok) throw new Error('Non-OK response')
      const data = (await res.json()) as Dashboard
      setDashboard(data)
      setOnline(true)
    } catch {
      setOnline(false)
      setDashboard(demoDashboard)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value: AppContextValue = {
    dashboard,
    online,
    loading,
    toast,
    setToast,
    refresh,
    bookmarks,
    toggleBookmark,
    page,
    setPage,
    practicePreset,
    setPracticePreset,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used inside <AppProvider>')
  }
  return ctx
}
