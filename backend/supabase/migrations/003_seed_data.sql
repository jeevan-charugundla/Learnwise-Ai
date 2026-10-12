-- =============================================================================
-- Migration 003: Idempotent seed data for subjects, topics, and learning_resources
-- Safe to run multiple times — all inserts use ON CONFLICT DO NOTHING.
-- Seed records carry source_note='demo-seed' so they can be identified and
-- excluded from production aggregates if needed.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Subjects
-- ---------------------------------------------------------------------------
INSERT INTO public.subjects (name, description)
VALUES
    ('Physics',          'The study of matter, energy, and the fundamental forces of nature'),
    ('Chemistry',        'The study of substances, their properties, structure, and reactions'),
    ('Mathematics',      'The study of numbers, quantities, structures, and logical reasoning'),
    ('Biology',          'The study of living organisms and their interactions with the environment'),
    ('Computer Science', 'The study of computation, algorithms, data structures, and software systems')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Topics — keyed by subject name to avoid hard-coding serial IDs
-- ---------------------------------------------------------------------------
WITH subject_map AS (
    SELECT id, name AS subject_name FROM public.subjects
),
topic_data (subject_name, topic_name, description, difficulty) AS (
    VALUES
        -- Physics
        ('Physics',          'Projectile Motion',          'Analysis of objects moving under gravity alone after being launched at an angle', 'medium'),
        ('Physics',          'Newton''s Laws',             'Three fundamental laws describing the relationship between force, mass, and motion', 'easy'),
        ('Physics',          'Thermodynamics',             'Study of heat, work, temperature, and the laws governing energy transfer', 'hard'),
        ('Physics',          'Waves',                      'Oscillations that transfer energy through a medium or vacuum', 'medium'),

        -- Chemistry
        ('Chemistry',        'Chemical Bonding',           'How atoms combine through ionic, covalent, and metallic bonds to form compounds', 'medium'),
        ('Chemistry',        'Acid-Base Reactions',        'Reactions between proton donors and acceptors and their practical applications', 'easy'),
        ('Chemistry',        'Periodic Table Trends',      'Patterns in atomic radius, ionisation energy, electronegativity across the periodic table', 'medium'),
        ('Chemistry',        'Organic Chemistry Basics',   'Introduction to carbon compounds, functional groups, and nomenclature', 'hard'),

        -- Mathematics
        ('Mathematics',      'Quadratic Equations',        'Polynomial equations of degree two and methods for finding their roots', 'easy'),
        ('Mathematics',      'Trigonometry',               'Study of angles, triangles, and the trigonometric functions', 'medium'),
        ('Mathematics',      'Calculus Basics',            'Foundations of differentiation and integration and their applications', 'hard'),
        ('Mathematics',      'Probability',                'Measuring the likelihood of events and the rules of chance', 'medium'),

        -- Biology
        ('Biology',          'Cell Biology',               'Structure and function of cells, the basic unit of all living organisms', 'easy'),
        ('Biology',          'Genetics Basics',            'Inheritance, DNA structure, and the principles of heredity', 'medium'),
        ('Biology',          'Photosynthesis',             'The process by which plants convert light energy into chemical energy', 'medium'),
        ('Biology',          'Human Anatomy Intro',        'Overview of major organ systems and their roles in the human body', 'easy'),

        -- Computer Science
        ('Computer Science', 'SQL Joins',                  'Combining rows from two or more tables using INNER, LEFT, RIGHT, and FULL joins', 'medium'),
        ('Computer Science', 'Sorting Algorithms',         'Comparison and non-comparison sorting techniques: bubble, merge, quick, heap sort', 'medium'),
        ('Computer Science', 'Object-Oriented Programming','Principles of encapsulation, inheritance, polymorphism, and abstraction', 'easy'),
        ('Computer Science', 'Data Structures',            'Arrays, linked lists, stacks, queues, trees, and hash tables', 'hard')
)
INSERT INTO public.topics (subject_id, name, description, difficulty)
SELECT sm.id, td.topic_name, td.description, td.difficulty
FROM   topic_data td
JOIN   subject_map sm ON sm.subject_name = td.subject_name
ON CONFLICT (subject_id, name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Learning resources — 8 demo records, no live URLs
-- ---------------------------------------------------------------------------

-- Ensure idempotency: use a unique index on (title) if one exists, otherwise
-- guard each insert with NOT EXISTS.  Because learning_resources has no UNIQUE
-- constraint on title by default, we use NOT EXISTS to be safe.

INSERT INTO public.learning_resources (title, description, subject, topic, resource_type, url, source_note)
SELECT v.title, v.description, v.subject, v.topic, v.resource_type, v.url, v.source_note
FROM (
    VALUES
        ('Projectile Motion Fundamentals',
         'A step-by-step guide to understanding the components of projectile motion including range, height, and time of flight.',
         'Physics', 'Projectile Motion', 'article', NULL, 'demo-seed'),

        ('Introduction to Newton''s Laws',
         'Clear explanations and worked examples covering all three of Newton''s Laws of Motion.',
         'Physics', 'Newton''s Laws', 'article', NULL, 'demo-seed'),

        ('Chemical Bonding Explained',
         'Visual explanations of ionic, covalent, and metallic bonding with real-world examples.',
         'Chemistry', 'Chemical Bonding', 'article', NULL, 'demo-seed'),

        ('Quadratic Equations Practice',
         'Worked examples and practice problems for solving quadratic equations by factoring, completing the square, and the quadratic formula.',
         'Mathematics', 'Quadratic Equations', 'article', NULL, 'demo-seed'),

        ('Cell Biology Overview',
         'An illustrated overview of prokaryotic and eukaryotic cell structure, organelles, and their functions.',
         'Biology', 'Cell Biology', 'article', NULL, 'demo-seed'),

        ('SQL Joins Tutorial',
         'Practical guide to INNER, LEFT, RIGHT, and FULL OUTER joins with diagrams and worked SQL queries.',
         'Computer Science', 'SQL Joins', 'article', NULL, 'demo-seed'),

        ('Sorting Algorithms Visual Guide',
         'Step-by-step visual walkthroughs of bubble sort, merge sort, quicksort, and heap sort with time-complexity comparisons.',
         'Computer Science', 'Sorting Algorithms', 'article', NULL, 'demo-seed'),

        ('Genetics and DNA Basics',
         'Introduction to DNA structure, replication, and the principles of Mendelian inheritance.',
         'Biology', 'Genetics Basics', 'article', NULL, 'demo-seed')
) AS v(title, description, subject, topic, resource_type, url, source_note)
WHERE NOT EXISTS (
    SELECT 1 FROM public.learning_resources lr
    WHERE lr.title = v.title
      AND lr.source_note = 'demo-seed'
);

-- =============================================================================
-- End of migration 003
-- =============================================================================
