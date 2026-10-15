// ---------------------------------------------------------------------------
// Subjects & Resources
// ---------------------------------------------------------------------------

export interface SubjectItem {
  name: string
}

export interface LearningResource {
  id: number
  title: string
  description: string | null
  subject: string
  topic: string | null
  resource_type: string
  url: string | null
}

// ---------------------------------------------------------------------------
// Topics & Progress (from /api/topics)
// ---------------------------------------------------------------------------

export interface TopicAnalytics {
  topic: string
  subject: string
  attempts: number
  correct: number
  accuracy: number
  avg_score: number
}

// ---------------------------------------------------------------------------
// Practice Session
// ---------------------------------------------------------------------------

export interface PracticeQuestion {
  id: string
  question: string
  options: string[]
  difficulty: string
}

export interface PracticeResult {
  session_id: string
  correct: number
  total: number
  percentage: number
  updated_topics: TopicAnalytics[]
}

// ---------------------------------------------------------------------------
// Chat
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

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  total_attempts: number
  correct_answers: number
  overall_accuracy: number
  subjects_studied: number
  topics_covered: number
  recent_topics: TopicAnalytics[]
}
