-- =============================================================================
-- Migration 002: Auth columns, new tables, RLS, and security policies
-- Safe to run on a fresh Supabase project OR one that already has 001 tables.
-- Uses CREATE TABLE IF NOT EXISTS and ALTER TABLE ... ADD COLUMN IF NOT EXISTS
-- for full idempotency.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Add user_id foreign key to existing tables created in 001
-- ---------------------------------------------------------------------------

-- assessment_records: add nullable user_id referencing auth.users
ALTER TABLE public.assessment_records
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS assessment_user_id_idx
    ON public.assessment_records(user_id);

-- practice_attempts: add nullable user_id referencing auth.users
ALTER TABLE public.practice_attempts
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS practice_attempts_user_id_idx
    ON public.practice_attempts(user_id);

-- ---------------------------------------------------------------------------
-- 2. profiles — one row per authenticated user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name     text,
    education_level  text,
    preferred_subjects text[],
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. subjects — public lookup table (no per-user data)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id          serial      PRIMARY KEY,
    name        text        NOT NULL UNIQUE,
    description text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. topics — linked to subjects; public lookup table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topics (
    id              serial      PRIMARY KEY,
    subject_id      integer     REFERENCES public.subjects(id) ON DELETE CASCADE,
    name            text        NOT NULL,
    description     text,
    difficulty      text        NOT NULL DEFAULT 'medium'
                                CHECK (difficulty IN ('easy', 'medium', 'hard')),
    curriculum_tags text[],
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (subject_id, name)
);

-- ---------------------------------------------------------------------------
-- 5. practice_sessions — per-user, stores full question set (with answers)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject      text        NOT NULL,
    topic        text        NOT NULL,
    difficulty   text        NOT NULL DEFAULT 'medium',
    questions_json jsonb     NOT NULL DEFAULT '[]'::jsonb,
    status       text        NOT NULL DEFAULT 'active',
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practice_sessions_user_idx
    ON public.practice_sessions(user_id);

-- ---------------------------------------------------------------------------
-- 6. conversations — chat history per user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title      text        NOT NULL DEFAULT 'New conversation',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_user_idx
    ON public.conversations(user_id);

-- ---------------------------------------------------------------------------
-- 7. messages — belong to a conversation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role            text        NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content         text        NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx
    ON public.messages(conversation_id);

-- ---------------------------------------------------------------------------
-- 8. learning_resources — public lookup table (curated content)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id            serial      PRIMARY KEY,
    title         text        NOT NULL,
    description   text,
    subject       text        NOT NULL,
    topic         text,
    resource_type text        NOT NULL DEFAULT 'article',
    url           text,
    source_note   text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resources_subject_idx
    ON public.learning_resources(subject);

-- ---------------------------------------------------------------------------
-- 9. topic_mastery — per-user mastery tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topic_mastery (
    id            serial      PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic         text        NOT NULL,
    subject       text        NOT NULL,
    mastery_score numeric     NOT NULL DEFAULT 0,
    confidence    text        NOT NULL DEFAULT 'low',
    evidence_count integer    NOT NULL DEFAULT 0,
    last_updated  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, subject, topic)
);

CREATE INDEX IF NOT EXISTS topic_mastery_user_idx
    ON public.topic_mastery(user_id);

-- ---------------------------------------------------------------------------
-- 10. csv_import_jobs — async import tracking, optionally linked to a user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.csv_import_jobs (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    filename           text,
    file_size_bytes    bigint,
    status             text        NOT NULL DEFAULT 'pending',
    rows_accepted      integer     NOT NULL DEFAULT 0,
    rows_rejected      integer     NOT NULL DEFAULT 0,
    validation_errors  jsonb       NOT NULL DEFAULT '[]'::jsonb,
    created_at         timestamptz NOT NULL DEFAULT now(),
    completed_at       timestamptz
);

CREATE INDEX IF NOT EXISTS csv_import_jobs_user_idx
    ON public.csv_import_jobs(user_id);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY on all user-owned tables
-- =============================================================================

ALTER TABLE public.assessment_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_import_jobs     ENABLE ROW LEVEL SECURITY;

-- Also enable on reference/lookup tables so explicit SELECT policies are required
ALTER TABLE public.subjects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources  ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- assessment_records — owner full access
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can manage own assessments"
    ON public.assessment_records
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- practice_attempts — owner full access
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can manage own practice attempts"
    ON public.practice_attempts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- practice_sessions — owner full access
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can manage own practice sessions"
    ON public.practice_sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- profiles — owner full access
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can manage own profile"
    ON public.profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- conversations — owner full access
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can manage own conversations"
    ON public.conversations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- messages — access via conversation ownership
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can manage messages in own conversations"
    ON public.messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
              AND c.user_id = auth.uid()
        )
    );

-- ---------------------------------------------------------------------------
-- topic_mastery — owner full access
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can manage own topic mastery"
    ON public.topic_mastery
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- csv_import_jobs — owner can select/insert; no update/delete from client
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Users can view own import jobs"
    ON public.csv_import_jobs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create import jobs"
    ON public.csv_import_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- subjects — public SELECT only
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Public read subjects"
    ON public.subjects
    FOR SELECT
    USING (true);

-- ---------------------------------------------------------------------------
-- topics — public SELECT only
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Public read topics"
    ON public.topics
    FOR SELECT
    USING (true);

-- ---------------------------------------------------------------------------
-- learning_resources — public SELECT only
-- ---------------------------------------------------------------------------
CREATE POLICY IF NOT EXISTS "Public read learning resources"
    ON public.learning_resources
    FOR SELECT
    USING (true);

-- =============================================================================
-- End of migration 002
-- =============================================================================
