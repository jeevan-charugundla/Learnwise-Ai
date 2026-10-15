-- Review before applying. This prototype has no authentication or per-user authorization.
create table if not exists public.assessment_records (
 id bigserial primary key, student_id text not null, subject text not null, topic text not null,
 score numeric not null check(score >= 0), max_score numeric not null check(max_score > 0 and score <= max_score),
 assessment_date date not null, difficulty text not null default 'medium' check(difficulty in ('easy','medium','hard')),
 created_at timestamptz not null default now()
);
create index if not exists assessment_student_idx on public.assessment_records(student_id);
create index if not exists assessment_topic_idx on public.assessment_records(student_id,subject,topic);
create table if not exists public.practice_attempts (
 id bigserial primary key, student_id text not null, subject text not null, topic text not null,
 question text not null, selected_answer text not null, correct_answer text not null, is_correct boolean not null,
 difficulty text not null default 'medium', created_at timestamptz not null default now()
);
create index if not exists practice_student_idx on public.practice_attempts(student_id);
-- Before real use: use auth.users UUID foreign keys, enable RLS, configure explicit least-privilege policies,
-- and test both allowed and denied operations. Do not expose these tables through the Data API before this.
