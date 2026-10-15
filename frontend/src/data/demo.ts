// Demo dashboard data (static, used when API is unavailable)

export interface DemoSubject {
  name: string
  score: number
  topics: number
  mastered: number
}

export interface DemoRecommendation {
  title: string
  subject: string
  topic: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface Dashboard {
  student_name: string
  overall_score: number
  study_streak: number
  topics_mastered: number
  total_topics: number
  subjects: DemoSubject[]
  recommendations: DemoRecommendation[]
  recent_activity: string
}

export const demoDashboard: Dashboard = {
  student_name: 'Jay Student',
  overall_score: 72,
  study_streak: 5,
  topics_mastered: 14,
  total_topics: 42,
  subjects: [
    { name: 'Physics', score: 68, topics: 8, mastered: 3 },
    { name: 'Chemistry', score: 74, topics: 9, mastered: 4 },
    { name: 'Mathematics', score: 81, topics: 10, mastered: 5 },
    { name: 'Biology', score: 65, topics: 7, mastered: 1 },
    { name: 'Computer Science', score: 88, topics: 8, mastered: 6 },
  ],
  recommendations: [
    {
      title: 'Review Newton\'s Laws',
      subject: 'Physics',
      topic: 'Newton\'s Laws',
      reason: 'Low quiz score (42%) — needs revision',
      priority: 'high',
    },
    {
      title: 'Practice Chemical Bonding',
      subject: 'Chemistry',
      topic: 'Chemical Bonding',
      reason: 'Two consecutive low scores',
      priority: 'high',
    },
    {
      title: 'Strengthen Calculus',
      subject: 'Mathematics',
      topic: 'Calculus',
      reason: 'Topic not yet attempted',
      priority: 'medium',
    },
    {
      title: 'Explore SQL Joins',
      subject: 'Computer Science',
      topic: 'SQL Joins',
      reason: 'Foundation topic for data work',
      priority: 'low',
    },
  ],
  recent_activity: '2026-10-14T18:30:00Z',
}

export interface WeeklyActivity {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  score: number
  sessions: number
}

export const weeklyActivity: WeeklyActivity[] = [
  { day: 'Mon', score: 62, sessions: 2 },
  { day: 'Tue', score: 75, sessions: 3 },
  { day: 'Wed', score: 58, sessions: 1 },
  { day: 'Thu', score: 84, sessions: 2 },
  { day: 'Fri', score: 91, sessions: 3 },
  { day: 'Sat', score: 40, sessions: 1 },
  { day: 'Sun', score: 78, sessions: 2 },
]

export type PerfRecordType = 'Quiz' | 'Exam' | 'Assignment' | 'Practice'

export interface PerfRecord {
  id: string
  subject: string
  topic: string
  score: number
  max: number
  date: string
  type: PerfRecordType
  mistakes: string
}

export const demoPerfRecords: PerfRecord[] = [
  { id: 'r1',  subject: 'Physics',          topic: 'Projectile Motion', score: 72, max: 100, date: '2026-09-05', type: 'Quiz',       mistakes: 'range formula,angle calculation' },
  { id: 'r2',  subject: 'Chemistry',         topic: 'Chemical Bonding',  score: 55, max: 100, date: '2026-09-08', type: 'Exam',       mistakes: 'ionic vs covalent,bond polarity' },
  { id: 'r3',  subject: 'Mathematics',       topic: 'Quadratic Equations', score: 88, max: 100, date: '2026-09-10', type: 'Assignment', mistakes: '' },
  { id: 'r4',  subject: 'Computer Science',  topic: 'SQL Joins',         score: 91, max: 100, date: '2026-09-12', type: 'Practice',   mistakes: '' },
  { id: 'r5',  subject: 'Biology',           topic: 'Cell Division',     score: 48, max: 100, date: '2026-09-15', type: 'Quiz',       mistakes: 'mitosis phases,chromosome behavior' },
  { id: 'r6',  subject: 'Physics',           topic: "Newton's Laws",     score: 42, max: 100, date: '2026-09-18', type: 'Exam',       mistakes: 'third law application,friction' },
  { id: 'r7',  subject: 'Chemistry',         topic: 'Equilibrium',       score: 67, max: 100, date: '2026-09-20', type: 'Assignment', mistakes: 'Le Chatelier principle' },
  { id: 'r8',  subject: 'Mathematics',       topic: 'Calculus',          score: 79, max: 100, date: '2026-09-22', type: 'Practice',   mistakes: 'chain rule' },
  { id: 'r9',  subject: 'Computer Science',  topic: 'Arrays',            score: 95, max: 100, date: '2026-09-25', type: 'Quiz',       mistakes: '' },
  { id: 'r10', subject: 'Physics',           topic: 'Projectile Motion', score: 80, max: 100, date: '2026-09-28', type: 'Assignment', mistakes: 'time of flight' },
  { id: 'r11', subject: 'Chemistry',         topic: 'Chemical Bonding',  score: 63, max: 100, date: '2026-10-02', type: 'Practice',   mistakes: 'hydrogen bonding' },
  { id: 'r12', subject: 'Mathematics',       topic: 'Quadratic Equations', score: 93, max: 100, date: '2026-10-06', type: 'Exam',     mistakes: '' },
]
