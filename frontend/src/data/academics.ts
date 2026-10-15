// Academic data, question bank, resources, and utility functions

// ── Types ────────────────────────────────────────────────────────────────────

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

export type TopicStatus = 'Weak' | 'Revise' | 'Strong'

export interface TopicStat {
  subject: string
  topic: string
  pct: number
  attempts: number
  trend: number
  mistakes: string[]
  status: TopicStatus
}

export interface Resource {
  id: string
  title: string
  description: string
  subject: string
  topic: string
  kind: 'Video' | 'Article' | 'Practice' | 'Reference'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  minutes: number
  url: string
}

export interface AppQuestion {
  id: string
  subject: string
  topic: string
  question: string
  options: [string, string, string, string]
  correct_answer: string
  solution: string
  difficulty: 'easy' | 'medium' | 'hard'
  concept: string
}

// ── Static Data ──────────────────────────────────────────────────────────────

export const subjects = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'Computer Science',
] as const

export type SubjectName = (typeof subjects)[number]

export const topicsBySubject: Record<SubjectName, string[]> = {
  Physics: ['Projectile Motion', "Newton's Laws", 'Wave Optics', 'Thermodynamics', 'Electrostatics'],
  Chemistry: ['Chemical Bonding', 'Equilibrium', 'Organic Reactions', 'Electrochemistry', 'Mole Concept'],
  Mathematics: ['Quadratic Equations', 'Calculus', 'Matrices', 'Probability', 'Trigonometry'],
  Biology: ['Cell Division', 'Genetics', 'Photosynthesis', 'Human Physiology', 'Ecology'],
  'Computer Science': ['SQL Joins', 'Arrays', 'Sorting Algorithms', 'Object-Oriented Programming', 'Graph Theory'],
}

// ── Question Bank ────────────────────────────────────────────────────────────

export const questionBank: AppQuestion[] = [
  // Physics – Projectile Motion (3)
  {
    id: 'q-pm-1',
    subject: 'Physics',
    topic: 'Projectile Motion',
    question: 'A ball is thrown horizontally from a cliff at 20 m/s. What is its horizontal range after 3 seconds? (ignore air resistance)',
    options: ['30 m', '60 m', '90 m', '120 m'],
    correct_answer: '60 m',
    solution: 'Horizontal range = horizontal velocity × time = 20 m/s × 3 s = 60 m.',
    difficulty: 'easy',
    concept: 'Horizontal motion in projectile',
  },
  {
    id: 'q-pm-2',
    subject: 'Physics',
    topic: 'Projectile Motion',
    question: 'At what angle to the horizontal should a projectile be launched to achieve the maximum range on flat ground?',
    options: ['30°', '45°', '60°', '90°'],
    correct_answer: '45°',
    solution: 'Maximum range is achieved when sin 2θ = 1, i.e. 2θ = 90°, so θ = 45°.',
    difficulty: 'easy',
    concept: 'Maximum range angle',
  },
  {
    id: 'q-pm-3',
    subject: 'Physics',
    topic: 'Projectile Motion',
    question: 'A projectile is fired at 40 m/s at 30° above the horizontal. What is its vertical velocity component at the highest point?',
    options: ['40 m/s', '20 m/s', '0 m/s', '34.6 m/s'],
    correct_answer: '0 m/s',
    solution: 'At the highest point, vertical velocity is zero. Only horizontal velocity (40 cos 30°) remains.',
    difficulty: 'medium',
    concept: 'Velocity components at apex',
  },
  // Physics – Newton's Laws (2)
  {
    id: 'q-nl-1',
    subject: 'Physics',
    topic: "Newton's Laws",
    question: "According to Newton's Third Law, when a rocket expels gas downward, the reaction force acts:",
    options: [
      'Downward on the rocket',
      'Upward on the rocket',
      'Sideways on the gas',
      'There is no reaction force',
    ],
    correct_answer: 'Upward on the rocket',
    solution: "Every action has an equal and opposite reaction. Gas expelled downward → rocket pushed upward.",
    difficulty: 'easy',
    concept: "Action-reaction pairs",
  },
  {
    id: 'q-nl-2',
    subject: 'Physics',
    topic: "Newton's Laws",
    question: 'A 10 kg block accelerates at 3 m/s² across a frictionless surface. What net force acts on it?',
    options: ['3 N', '10 N', '30 N', '13 N'],
    correct_answer: '30 N',
    solution: 'F = ma = 10 kg × 3 m/s² = 30 N.',
    difficulty: 'easy',
    concept: "Newton's Second Law F=ma",
  },
  // Chemistry – Chemical Bonding (3)
  {
    id: 'q-cb-1',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    question: 'Which type of bond forms when electrons are transferred from a metal to a non-metal?',
    options: ['Covalent bond', 'Ionic bond', 'Metallic bond', 'Hydrogen bond'],
    correct_answer: 'Ionic bond',
    solution: 'Ionic bonds form via electron transfer, creating oppositely charged ions that attract electrostatically.',
    difficulty: 'easy',
    concept: 'Ionic bond formation',
  },
  {
    id: 'q-cb-2',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    question: 'What is the shape of a water molecule (H₂O)?',
    options: ['Linear', 'Trigonal planar', 'Bent (V-shaped)', 'Tetrahedral'],
    correct_answer: 'Bent (V-shaped)',
    solution: 'Oxygen has 2 bonding pairs and 2 lone pairs. VSEPR theory predicts a bent geometry (~104.5°).',
    difficulty: 'medium',
    concept: 'VSEPR theory and molecular geometry',
  },
  {
    id: 'q-cb-3',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    question: 'Which of the following compounds has the highest ionic character?',
    options: ['HCl', 'NaCl', 'CCl₄', 'PCl₃'],
    correct_answer: 'NaCl',
    solution: 'Ionic character increases with greater electronegativity difference. Na-Cl has the largest difference here.',
    difficulty: 'medium',
    concept: 'Electronegativity and bond character',
  },
  // Chemistry – Equilibrium (2)
  {
    id: 'q-eq-1',
    subject: 'Chemistry',
    topic: 'Equilibrium',
    question: 'For the reaction N₂ + 3H₂ ⇌ 2NH₃, increasing pressure will:',
    options: [
      'Shift equilibrium to the left',
      'Shift equilibrium to the right',
      'Have no effect',
      'Increase Kc',
    ],
    correct_answer: 'Shift equilibrium to the right',
    solution: 'Pressure increase favors the side with fewer gas moles. Products side has 2 moles vs 4 moles on reactant side.',
    difficulty: 'medium',
    concept: "Le Chatelier's Principle — pressure",
  },
  {
    id: 'q-eq-2',
    subject: 'Chemistry',
    topic: 'Equilibrium',
    question: 'What happens to Kc if we increase the temperature for an exothermic reaction?',
    options: ['Kc increases', 'Kc decreases', 'Kc stays the same', 'Kc becomes zero'],
    correct_answer: 'Kc decreases',
    solution: 'For exothermic reactions, temperature increase shifts equilibrium left (towards reactants), reducing Kc.',
    difficulty: 'hard',
    concept: 'Effect of temperature on equilibrium constant',
  },
  // Mathematics – Quadratic Equations (3)
  {
    id: 'q-qe-1',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    question: 'What are the roots of x² − 5x + 6 = 0?',
    options: ['x = 1, 6', 'x = 2, 3', 'x = −2, −3', 'x = −1, 6'],
    correct_answer: 'x = 2, 3',
    solution: 'Factor: (x − 2)(x − 3) = 0, so x = 2 or x = 3.',
    difficulty: 'easy',
    concept: 'Factoring quadratics',
  },
  {
    id: 'q-qe-2',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    question: 'The discriminant of ax² + bx + c = 0 determines:',
    options: [
      'The sum of roots',
      'The product of roots',
      'The nature of roots',
      'The vertex of the parabola',
    ],
    correct_answer: 'The nature of roots',
    solution: 'Discriminant Δ = b² − 4ac: Δ > 0 two real roots, Δ = 0 one real root, Δ < 0 complex roots.',
    difficulty: 'easy',
    concept: 'Discriminant and nature of roots',
  },
  {
    id: 'q-qe-3',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    question: 'If α and β are roots of x² + px + q = 0, then α + β equals:',
    options: ['q', 'p', '−p', '−q'],
    correct_answer: '−p',
    solution: 'By Vieta\'s formulas: sum of roots α + β = −b/a = −p/1 = −p.',
    difficulty: 'medium',
    concept: "Vieta's formulas",
  },
  // Mathematics – Calculus (2)
  {
    id: 'q-cal-1',
    subject: 'Mathematics',
    topic: 'Calculus',
    question: 'What is the derivative of f(x) = x³ + 2x² − 5x + 7?',
    options: ['3x² + 4x − 5', '3x² + 2x − 5', 'x² + 4x − 5', '3x³ + 4x − 5'],
    correct_answer: '3x² + 4x − 5',
    solution: 'd/dx(x³) = 3x², d/dx(2x²) = 4x, d/dx(−5x) = −5, constant vanishes. Result: 3x² + 4x − 5.',
    difficulty: 'easy',
    concept: 'Power rule differentiation',
  },
  {
    id: 'q-cal-2',
    subject: 'Mathematics',
    topic: 'Calculus',
    question: 'Evaluate ∫₀¹ 2x dx.',
    options: ['1', '2', '0', '4'],
    correct_answer: '1',
    solution: '∫2x dx = x². Evaluate from 0 to 1: 1² − 0² = 1.',
    difficulty: 'easy',
    concept: 'Definite integration',
  },
  // CS – SQL Joins (3)
  {
    id: 'q-sql-1',
    subject: 'Computer Science',
    topic: 'SQL Joins',
    question: 'Which SQL JOIN returns all rows from the left table and matching rows from the right table?',
    options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'],
    correct_answer: 'LEFT JOIN',
    solution: 'LEFT JOIN returns all left table rows; for unmatched right rows, NULL is returned.',
    difficulty: 'easy',
    concept: 'LEFT JOIN semantics',
  },
  {
    id: 'q-sql-2',
    subject: 'Computer Science',
    topic: 'SQL Joins',
    question: 'An INNER JOIN between tables A and B returns:',
    options: [
      'All rows from A',
      'All rows from B',
      'Only rows with matching keys in both A and B',
      'All rows from A and all rows from B',
    ],
    correct_answer: 'Only rows with matching keys in both A and B',
    solution: 'INNER JOIN is the intersection — only rows where the join condition is satisfied in both tables.',
    difficulty: 'easy',
    concept: 'INNER JOIN semantics',
  },
  {
    id: 'q-sql-3',
    subject: 'Computer Science',
    topic: 'SQL Joins',
    question: 'Which join produces a Cartesian product when no join condition is specified?',
    options: ['LEFT JOIN', 'INNER JOIN', 'CROSS JOIN', 'FULL OUTER JOIN'],
    correct_answer: 'CROSS JOIN',
    solution: 'CROSS JOIN produces every combination of rows from both tables, i.e. |A| × |B| rows.',
    difficulty: 'medium',
    concept: 'CROSS JOIN / Cartesian product',
  },
  // CS – Arrays (2)
  {
    id: 'q-arr-1',
    subject: 'Computer Science',
    topic: 'Arrays',
    question: 'In a zero-indexed array of size n, the last element is accessed at index:',
    options: ['n', 'n − 1', 'n + 1', '0'],
    correct_answer: 'n − 1',
    solution: 'Zero-indexed arrays start at 0. The last of n elements is at index n − 1.',
    difficulty: 'easy',
    concept: 'Array indexing',
  },
  {
    id: 'q-arr-2',
    subject: 'Computer Science',
    topic: 'Arrays',
    question: 'What is the time complexity of accessing an element by index in a static array?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
    correct_answer: 'O(1)',
    solution: 'Arrays store elements contiguously. Random access by index is constant time O(1).',
    difficulty: 'easy',
    concept: 'Array time complexity',
  },
]

// ── Resources ────────────────────────────────────────────────────────────────

export const resources: Resource[] = [
  {
    id: 'res-1',
    title: 'Projectile Motion — Khan Academy',
    description: 'Video walkthrough of 2D kinematics and projectile launch angles.',
    subject: 'Physics',
    topic: 'Projectile Motion',
    kind: 'Video',
    difficulty: 'Beginner',
    minutes: 12,
    url: 'https://www.khanacademy.org/science/physics/two-dimensional-motion',
  },
  {
    id: 'res-2',
    title: "Newton's Laws — BYJU'S",
    description: "Interactive article covering all three of Newton's laws with examples.",
    subject: 'Physics',
    topic: "Newton's Laws",
    kind: 'Article',
    difficulty: 'Beginner',
    minutes: 8,
    url: 'https://byjus.com/physics/newtons-laws-of-motion/',
  },
  {
    id: 'res-3',
    title: 'Chemical Bonding — Khan Academy',
    description: 'Comprehensive video on ionic, covalent, and metallic bonds.',
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    kind: 'Video',
    difficulty: 'Beginner',
    minutes: 15,
    url: 'https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:unit-3-intermolecular-forces-and-properties',
  },
  {
    id: 'res-4',
    title: "Le Chatelier's Principle — NCERT",
    description: 'Official NCERT chapter on chemical equilibrium with solved examples.',
    subject: 'Chemistry',
    topic: 'Equilibrium',
    kind: 'Reference',
    difficulty: 'Intermediate',
    minutes: 25,
    url: 'https://ncert.nic.in/textbook.php?lech1=7-7',
  },
  {
    id: 'res-5',
    title: 'Quadratic Equations — Khan Academy',
    description: 'Practice problems and video lectures on factoring and the quadratic formula.',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    kind: 'Practice',
    difficulty: 'Beginner',
    minutes: 20,
    url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:quadratic-functions-equations',
  },
  {
    id: 'res-6',
    title: 'Calculus — Differentiation Rules',
    description: 'Step-by-step article on power rule, product rule, and chain rule.',
    subject: 'Mathematics',
    topic: 'Calculus',
    kind: 'Article',
    difficulty: 'Intermediate',
    minutes: 18,
    url: 'https://byjus.com/maths/differentiation/',
  },
  {
    id: 'res-7',
    title: 'SQL JOIN Visualizer — GeeksforGeeks',
    description: 'Article with diagrams visualizing INNER, LEFT, RIGHT, and FULL JOINs.',
    subject: 'Computer Science',
    topic: 'SQL Joins',
    kind: 'Article',
    difficulty: 'Beginner',
    minutes: 10,
    url: 'https://www.geeksforgeeks.org/sql-join-set-1-inner-left-right-and-full-joins/',
  },
  {
    id: 'res-8',
    title: 'Sorting Algorithms — VisuAlgo',
    description: 'Interactive visualization of bubble, merge, quick, and heap sort.',
    subject: 'Computer Science',
    topic: 'Sorting Algorithms',
    kind: 'Practice',
    difficulty: 'Intermediate',
    minutes: 30,
    url: 'https://visualgo.net/en/sorting',
  },
  {
    id: 'res-9',
    title: 'Arrays — GeeksforGeeks',
    description: 'Complete guide to arrays including operations, complexity, and interview tips.',
    subject: 'Computer Science',
    topic: 'Arrays',
    kind: 'Reference',
    difficulty: 'Beginner',
    minutes: 15,
    url: 'https://www.geeksforgeeks.org/array-data-structure/',
  },
  {
    id: 'res-10',
    title: 'Cell Division — Khan Academy',
    description: 'Mitosis and meiosis explained with animations.',
    subject: 'Biology',
    topic: 'Cell Division',
    kind: 'Video',
    difficulty: 'Beginner',
    minutes: 14,
    url: 'https://www.khanacademy.org/science/ap-biology/cell-communication-and-cell-cycle/cell-cycle/a/steps-of-meiosis',
  },
  {
    id: 'res-11',
    title: 'Genetics — NCERT',
    description: 'NCERT chapter on heredity and variation with Mendel\'s experiments.',
    subject: 'Biology',
    topic: 'Genetics',
    kind: 'Reference',
    difficulty: 'Intermediate',
    minutes: 30,
    url: 'https://ncert.nic.in/textbook.php?kebo1=5-5',
  },
  {
    id: 'res-12',
    title: 'Thermodynamics — BYJU\'S',
    description: 'Detailed article on laws of thermodynamics and entropy.',
    subject: 'Physics',
    topic: 'Thermodynamics',
    kind: 'Article',
    difficulty: 'Intermediate',
    minutes: 20,
    url: 'https://byjus.com/physics/thermodynamics/',
  },
  {
    id: 'res-13',
    title: 'Graph Theory — GeeksforGeeks',
    description: 'Introduction to graphs: BFS, DFS, shortest paths, and applications.',
    subject: 'Computer Science',
    topic: 'Graph Theory',
    kind: 'Article',
    difficulty: 'Advanced',
    minutes: 35,
    url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/',
  },
  {
    id: 'res-14',
    title: 'Organic Reactions — Khan Academy',
    description: 'Video series on substitution, addition, and elimination reactions.',
    subject: 'Chemistry',
    topic: 'Organic Reactions',
    kind: 'Video',
    difficulty: 'Intermediate',
    minutes: 22,
    url: 'https://www.khanacademy.org/science/organic-chemistry',
  },
  {
    id: 'res-15',
    title: 'Probability — BYJU\'S',
    description: 'Comprehensive coverage of probability theory, Bayes theorem, and distributions.',
    subject: 'Mathematics',
    topic: 'Probability',
    kind: 'Reference',
    difficulty: 'Advanced',
    minutes: 28,
    url: 'https://byjus.com/maths/probability/',
  },
]

// ── Sample CSV ───────────────────────────────────────────────────────────────

export const sampleCsv = `id,subject,topic,score,max,date,type,mistakes
r1,Physics,Projectile Motion,72,100,2026-09-05,Quiz,"range formula,angle calculation"
r2,Chemistry,Chemical Bonding,55,100,2026-09-08,Exam,"ionic vs covalent,bond polarity"
r3,Mathematics,Quadratic Equations,88,100,2026-09-10,Assignment,
r4,Computer Science,SQL Joins,91,100,2026-09-12,Practice,
r5,Biology,Cell Division,48,100,2026-09-15,Quiz,"mitosis phases,chromosome behavior"`

// ── Pure Utility Functions ───────────────────────────────────────────────────

export function topicStats(records: PerfRecord[]): TopicStat[] {
  const map = new Map<string, PerfRecord[]>()
  for (const r of records) {
    const key = `${r.subject}::${r.topic}`
    const existing = map.get(key)
    if (existing) {
      existing.push(r)
    } else {
      map.set(key, [r])
    }
  }

  const stats: TopicStat[] = []
  map.forEach((recs, key) => {
    const [subject, topic] = key.split('::')
    const pcts = recs.map(r => (r.score / r.max) * 100)
    const pct = pcts.reduce((a, b) => a + b, 0) / pcts.length

    let trend = 0
    if (pcts.length >= 2) {
      trend = pcts[pcts.length - 1] - pcts[pcts.length - 2]
    }

    let status: TopicStatus
    if (pct < 50) {
      status = 'Weak'
    } else if (pct < 75) {
      status = 'Revise'
    } else {
      status = 'Strong'
    }

    const allMistakes = recs.flatMap(r =>
      r.mistakes
        ? r.mistakes.split(',').map(m => m.trim()).filter(Boolean)
        : []
    )
    const mistakes = [...new Set(allMistakes)]

    stats.push({ subject, topic, pct, attempts: recs.length, trend, mistakes, status })
  })

  return stats
}

export function subjectStats(records: PerfRecord[]): { subject: string; pct: number; count: number }[] {
  const map = new Map<string, number[]>()
  for (const r of records) {
    const pct = (r.score / r.max) * 100
    const existing = map.get(r.subject)
    if (existing) {
      existing.push(pct)
    } else {
      map.set(r.subject, [pct])
    }
  }

  const result: { subject: string; pct: number; count: number }[] = []
  map.forEach((pcts, subject) => {
    result.push({
      subject,
      pct: pcts.reduce((a, b) => a + b, 0) / pcts.length,
      count: pcts.length,
    })
  })
  return result
}

export function pickQuestions(
  subject: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): AppQuestion[] {
  const filtered = questionBank.filter(
    q => q.subject === subject && q.topic === topic && q.difficulty === difficulty
  )
  return filtered.slice(0, count)
}

export function parseCsv(text: string): { rows: PerfRecord[]; errors: { row: number; error: string }[] } {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { rows: [], errors: [] }

  const rows: PerfRecord[] = []
  const errors: { row: number; error: string }[] = []

  // Skip header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    // Handle quoted fields
    const cols = parseCsvLine(line)
    if (cols.length < 7) {
      errors.push({ row: i, error: `Expected at least 7 columns, got ${cols.length}` })
      continue
    }
    const [id, subject, topic, scoreStr, maxStr, date, type, mistakes = ''] = cols
    const score = Number(scoreStr)
    const max = Number(maxStr)
    if (isNaN(score) || isNaN(max)) {
      errors.push({ row: i, error: `score or max is not a number` })
      continue
    }
    if (!['Quiz', 'Exam', 'Assignment', 'Practice'].includes(type)) {
      errors.push({ row: i, error: `Invalid type: ${type}` })
      continue
    }
    rows.push({
      id,
      subject,
      topic,
      score,
      max,
      date,
      type: type as PerfRecordType,
      mistakes,
    })
  }

  return { rows, errors }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
