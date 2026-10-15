import React, { useState, useEffect, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import {
  getSubjects,
  getLearningResources,
  getDashboard,
  getTopics,
  generatePractice,
  submitPractice,
  listConversations,
  createConversation,
  sendMessage,
} from './api'
import type {
  SubjectItem,
  LearningResource,
  TopicAnalytics,
  PracticeQuestion,
  PracticeResult,
  Conversation,
  ChatMsg,
  DashboardSummary,
} from './types'
import { BookOpen, LogOut, Send, MessageCircle, Dumbbell, BarChart2, Library } from 'lucide-react'

// ---------------------------------------------------------------------------
// Top-level page type
// ---------------------------------------------------------------------------
type Page = 'dashboard' | 'practice' | 'chat' | 'resources'

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-indigo-600 text-xl font-semibold animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return <MainApp session={session} onLogout={handleLogout} />
}

// ---------------------------------------------------------------------------
// Auth Page
// ---------------------------------------------------------------------------

function AuthPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setInfo('Check your email for a confirmation link.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="text-indigo-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">LearnWise AI</h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        {info && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{info}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {busy ? 'Please wait…' : isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignup(!isSignup); setError(null); setInfo(null) }}
            className="text-indigo-600 font-semibold hover:underline"
          >
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </p>

        {/* Demo hint */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Running locally with SUPABASE_URL unset? The backend works in demo mode — skip login by setting VITE_DEMO_MODE=true.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main App (after login)
// ---------------------------------------------------------------------------

interface MainAppProps {
  session: Session
  onLogout: () => void
}

function MainApp({ session, onLogout }: MainAppProps) {
  const [page, setPage] = useState<Page>('dashboard')

  const nav = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: <BarChart2 size={18} /> },
    { id: 'practice' as Page, label: 'Practice', icon: <Dumbbell size={18} /> },
    { id: 'chat' as Page, label: 'AI Chat', icon: <MessageCircle size={18} /> },
    { id: 'resources' as Page, label: 'Resources', icon: <Library size={18} /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={26} />
            <span className="text-xl font-bold text-gray-900">LearnWise AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-500">{session.user.email}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
        {/* Sub-nav */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-0">
          {nav.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                page === n.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'practice' && <PracticePage />}
        {page === 'chat' && <ChatPage />}
        {page === 'resources' && <ResourcesPage />}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [topics, setTopics] = useState<TopicAnalytics[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDashboard()
      .then(d => setData(d))
      .catch(e => setError(e.message))
    getTopics()
      .then(t => setTopics(t))
      .catch(() => {/* non-fatal */})
  }, [])

  if (error) return <ErrorBox message={error} />

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Attempts" value={data.total_attempts} />
          <StatCard label="Correct Answers" value={data.correct_answers} />
          <StatCard label="Accuracy" value={`${data.overall_accuracy ?? 0}%`} />
          <StatCard label="Subjects Studied" value={data.subjects_studied} />
        </div>
      )}

      {!data && <div className="text-gray-500 animate-pulse">Loading stats…</div>}

      {topics.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Topic Progress</h2>
          <div className="space-y-3">
            {topics.slice(0, 8).map((t, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-700 truncate">{t.topic}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min(t.accuracy ?? 0, 100)}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500 w-12 text-right">{t.accuracy ?? 0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Practice Page
// ---------------------------------------------------------------------------

type PracticeState = 'setup' | 'active' | 'results'

function PracticePage() {
  const [state, setState] = useState<PracticeState>('setup')
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [subject, setSubject] = useState('Physics')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState(5)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState('')
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<PracticeResult | null>(null)

  useEffect(() => {
    getSubjects().then(s => {
      setSubjects(s)
      if (s.length > 0) setSubject(s[0].name)
    }).catch(() => {/* use default */})
  }, [])

  const start = async () => {
    if (!topic.trim()) { setError('Enter a topic.'); return }
    setBusy(true)
    setError(null)
    try {
      const session = await generatePractice({ subject, topic, difficulty, count })
      setSessionId(session.session_id)
      setQuestions(session.questions)
      setAnswers({})
      setState('active')
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const answerList = questions.map(q => ({
        question_id: q.id,
        selected_answer: answers[q.id] ?? '',
      }))
      const res = await submitPractice(sessionId, answerList)
      setResult(res)
      setState('results')
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  if (state === 'results' && result) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <div className={`p-6 rounded-xl text-center ${result.percentage >= 60 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-5xl font-bold mb-2">{result.percentage}%</div>
          <div className="text-gray-600">{result.correct} / {result.total} correct</div>
        </div>
        <button
          onClick={() => { setState('setup'); setResult(null) }}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          Try Another
        </button>
      </div>
    )
  }

  if (state === 'active') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Practice: {topic}</h1>
        {error && <ErrorBox message={error} />}

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <p className="font-semibold text-gray-900">{idx + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map(opt => (
                <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  answers[q.id] === opt
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-800">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={submit}
          disabled={busy || questions.some(q => !answers[q.id])}
          className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {busy ? 'Submitting…' : 'Submit Answers'}
        </button>
      </div>
    )
  }

  // Setup state
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Start Practice</h1>
      {error && <ErrorBox message={error} />}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {subjects.length > 0
              ? subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)
              : ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))
            }
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Newton's Laws of Motion"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Questions</label>
            <select
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={start}
          disabled={busy}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {busy ? 'Generating…' : 'Generate Practice Questions'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chat Page
// ---------------------------------------------------------------------------

function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listConversations()
      .then(c => { setConversations(c); if (c.length > 0) setActiveConv(c[0]) })
      .catch(e => setError(e.message))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const newConversation = async () => {
    try {
      const conv = await createConversation('New conversation')
      setConversations(prev => [conv, ...prev])
      setActiveConv(conv)
      setMessages([])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const send = async () => {
    if (!input.trim() || !activeConv) return
    const userMsg: ChatMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setBusy(true)
    try {
      const reply = await sendMessage(activeConv.id, userMsg.content)
      setMessages(prev => [...prev, reply])
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 space-y-2">
        <button
          onClick={newConversation}
          className="w-full bg-indigo-600 text-white text-sm font-semibold px-3 py-2.5 rounded-lg hover:bg-indigo-700 transition"
        >
          + New Chat
        </button>
        <div className="space-y-1 overflow-y-auto max-h-full">
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => { setActiveConv(c); setMessages([]) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                activeConv?.id === c.id
                  ? 'bg-indigo-100 text-indigo-800 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
        {error && <div className="p-3 bg-red-50 text-red-700 text-sm">{error}</div>}

        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Start a new chat to begin
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-8">Ask anything about your studies…</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-500 text-sm px-4 py-3 rounded-2xl rounded-bl-sm animate-pulse">
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-gray-100 p-4 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask a question…"
                disabled={busy}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Resources Page
// ---------------------------------------------------------------------------

function ResourcesPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [resources, setResources] = useState<LearningResource[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSubjects()
      .then(s => { setSubjects(s); if (s.length) setSelectedSubject(s[0].name) })
      .catch(e => setError(e.message))
  }, [])

  useEffect(() => {
    if (!selectedSubject) return
    getLearningResources(selectedSubject)
      .then(r => setResources(r))
      .catch(e => setError(e.message))
  }, [selectedSubject])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Learning Resources</h1>
      {error && <ErrorBox message={error} />}

      <div className="flex gap-2 flex-wrap">
        {subjects.map(s => (
          <button
            key={s.name}
            onClick={() => setSelectedSubject(s.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedSubject === s.name
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {resources.length === 0 && (
        <p className="text-gray-400 text-sm">No resources found for this subject. Import a CSV or add resources via the API.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map(r => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900">{r.title}</h3>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                {r.resource_type}
              </span>
            </div>
            {r.description && <p className="text-sm text-gray-600">{r.description}</p>}
            {r.topic && <p className="text-xs text-gray-400">Topic: {r.topic}</p>}
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline"
              >
                View Resource →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 text-center">
      <div className="text-2xl font-bold text-indigo-600">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      {message}
    </div>
  )
}
