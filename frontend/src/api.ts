import { supabase } from './supabase'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Backend unavailable')
  return res.json() as Promise<{ status: string }>
}

// ---------------------------------------------------------------------------
// Subjects  (public)
// ---------------------------------------------------------------------------

export async function getSubjects(): Promise<{ name: string }[]> {
  const res = await fetch(`${API_BASE}/subjects`)
  if (!res.ok) throw new Error('Failed to fetch subjects')
  const data = await res.json()
  return data.items ?? []
}

// ---------------------------------------------------------------------------
// Learning resources  (public)
// ---------------------------------------------------------------------------

export async function getLearningResources(subject?: string, topic?: string) {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (topic) params.set('topic', topic)
  const res = await fetch(`${API_BASE}/learning-resources?${params}`)
  if (!res.ok) throw new Error('Failed to fetch resources')
  const data = await res.json()
  return data.items ?? []
}

// ---------------------------------------------------------------------------
// Dashboard & Topics  (auth)
// ---------------------------------------------------------------------------

export async function getDashboard() {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/dashboard`, { headers })
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  return res.json()
}

export async function getTopics() {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/topics`, { headers })
  if (!res.ok) throw new Error('Failed to fetch topics')
  const data = await res.json()
  return data.items ?? []
}

export async function getRecommendations() {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/recommendations`, { headers })
  if (!res.ok) throw new Error('Failed to fetch recommendations')
  const data = await res.json()
  return data.items ?? []
}

// ---------------------------------------------------------------------------
// Practice  (auth)
// ---------------------------------------------------------------------------

export interface PracticeGenerateRequest {
  subject: string
  topic: string
  difficulty?: string
  count?: number
  exam_track?: string
}

export interface PracticeQuestion {
  id: string
  question: string
  options: string[]
  difficulty: string
}

export interface PracticeSession {
  session_id: string
  topic: string
  subject: string
  provider: string
  questions: PracticeQuestion[]
  notice?: string
}

export async function generatePractice(req: PracticeGenerateRequest): Promise<PracticeSession> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/practice/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subject: req.subject,
      topic: req.topic,
      difficulty: req.difficulty ?? 'medium',
      count: req.count ?? 5,
      exam_track: req.exam_track ?? 'Class 11-12',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail ?? 'Failed to generate practice questions')
  }
  return res.json()
}

export interface SubmitAnswer {
  question_id: string
  selected_answer: string
}

export async function submitPractice(sessionId: string, answers: SubmitAnswer[]) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/practice/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sessionId, answers }),
  })
  if (!res.ok) throw new Error('Failed to submit answers')
  return res.json()
}

// ---------------------------------------------------------------------------
// Chat / Conversations  (auth)
// ---------------------------------------------------------------------------

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string | null
}

export interface ChatMsg {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function listConversations(): Promise<Conversation[]> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/chat/conversations`, { headers })
  if (!res.ok) throw new Error('Failed to fetch conversations')
  const data = await res.json()
  return data.items ?? []
}

export async function createConversation(title = 'New conversation'): Promise<Conversation> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/chat/conversations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('Failed to create conversation')
  return res.json()
}

export async function sendMessage(convId: string, content: string): Promise<ChatMsg> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/chat/conversations/${convId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}
