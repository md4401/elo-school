-- ============================================================
-- ELO SCHOOL MANAGEMENT PLATFORM — PRODUCTION SCHEMA v2
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ============================================================
-- SCHOOLS  (multi-tenant anchor)
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  cnpj       TEXT,
  address    TEXT,
  phone      TEXT,
  email      TEXT,
  logo_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default school seed (used when multi-tenant not needed yet)
INSERT INTO schools (id, name, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Escola João Paulo II', 'contato@escola.edu.br')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PROFILES  (extends auth.users — one row per auth user)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id         UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'aluno'
                    CHECK (role IN ('aluno','pai','professor','coordenador','diretor')),
  avatar            TEXT,
  phone             TEXT,
  bio               TEXT,
  date_of_birth     DATE,
  is_active         BOOLEAN DEFAULT TRUE,
  -- student fields
  enrollment_number TEXT,
  class_id          UUID,          -- FK added after classes table
  year              INT,
  -- teacher/coordinator
  subject_ids       UUID[] DEFAULT '{}',
  class_ids         UUID[] DEFAULT '{}',
  -- parent
  child_ra          TEXT,
  child_id          UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, enrollment_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_school_idx ON profiles (school_id, email);

-- ============================================================
-- CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  name          TEXT NOT NULL,
  year          INT NOT NULL,
  grade_level   TEXT NOT NULL DEFAULT '',
  coordinator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  teacher_ids   UUID[] DEFAULT '{}',
  student_ids   UUID[] DEFAULT '{}',
  subject_ids   UUID[] DEFAULT '{}',
  shift         TEXT DEFAULT 'manha' CHECK (shift IN ('manha','tarde','noite','integral')),
  academic_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  max_students  INT DEFAULT 40,
  room          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from profiles.class_id now that classes exists
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_class
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
  NOT VALID;

-- ============================================================
-- SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  name           TEXT NOT NULL,
  code           TEXT NOT NULL,
  description    TEXT,
  color          TEXT NOT NULL DEFAULT '#F59E0B',
  icon           TEXT,
  workload_hours INT DEFAULT 80
);

-- ============================================================
-- CLASS SUBJECTS  (class ↔ subject ↔ teacher link)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_subjects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  trimester     INT NOT NULL DEFAULT 1 CHECK (trimester IN (1,2,3))
);

-- ============================================================
-- ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('prova','atividade','trabalho','simulado','participacao')),
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trimester   INT NOT NULL CHECK (trimester IN (1,2,3)),
  weight      NUMERIC(5,2) NOT NULL DEFAULT 1,
  max_score   NUMERIC(5,2) NOT NULL DEFAULT 10,
  date        DATE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ASSESSMENT GRADES
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_grades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score         NUMERIC(5,2),
  observation   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, student_id)
);

-- ============================================================
-- ATTENDANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS attendances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  present     BOOLEAN NOT NULL DEFAULT TRUE,
  justified   BOOLEAN NOT NULL DEFAULT FALSE,
  observation TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, subject_id, date)
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id             UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  subject_id            UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id              UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL DEFAULT 'atividade'
                        CHECK (type IN ('atividade','trabalho','formulario','recurso','aviso')),
  due_date              TIMESTAMPTZ NOT NULL,
  max_score             NUMERIC(5,2),
  allow_late_submission BOOLEAN DEFAULT FALSE,
  attachments           JSONB DEFAULT '[]',
  questions             JSONB DEFAULT '[]',
  is_published          BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASK SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS task_submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pendente'
               CHECK (status IN ('pendente','entregue','atrasado','corrigido')),
  submitted_at TIMESTAMPTZ,
  grade        NUMERIC(5,2),
  feedback     TEXT,
  answers      JSONB DEFAULT '[]',
  attachments  JSONB DEFAULT '[]',
  corrected_at TIMESTAMPTZ,
  corrected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE (task_id, student_id)
);

-- ============================================================
-- CLASSROOM POSTS  (feed / announcements)
-- ============================================================
CREATE TABLE IF NOT EXISTS classroom_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES subjects(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'aviso'
              CHECK (type IN ('aviso','atividade','recurso','formulario')),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]',
  task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
  pinned      BOOLEAN DEFAULT FALSE,
  comments    JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONVERSATIONS  (chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  type            TEXT NOT NULL DEFAULT 'direct'
                  CHECK (type IN ('direct','group','class','subject')),
  name            TEXT,
  avatar          TEXT,
  participant_ids UUID[] NOT NULL DEFAULT '{}',
  class_id        UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject_id      UUID REFERENCES subjects(id) ON DELETE SET NULL,
  last_message    JSONB,
  last_message_at TIMESTAMPTZ,
  unread_count    INT DEFAULT 0,
  pinned          BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','file','audio')),
  content         TEXT NOT NULL DEFAULT '',
  attachment      JSONB,
  read_by         UUID[] DEFAULT '{}',
  reactions       JSONB DEFAULT '[]',
  reply_to        UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_pinned       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  edited_at       TIMESTAMPTZ
);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL DEFAULT 'evento'
                   CHECK (category IN ('prova','trabalho','evento','feriado','reuniao','atividade','pessoal')),
  color            TEXT,
  start_date       TIMESTAMPTZ NOT NULL,
  end_date         TIMESTAMPTZ,
  all_day          BOOLEAN DEFAULT FALSE,
  class_id         UUID REFERENCES classes(id) ON DELETE SET NULL,
  class_ids        UUID[] DEFAULT '{}',
  subject_id       UUID REFERENCES subjects(id) ON DELETE SET NULL,
  created_by       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_global        BOOLEAN DEFAULT FALSE,
  is_personal      BOOLEAN DEFAULT FALSE,
  recurrence       TEXT CHECK (recurrence IN ('daily','weekly','monthly','yearly')),
  reminder_minutes INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATERIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'pdf'
              CHECK (type IN ('pdf','doc','image','link','presentation','spreadsheet','other')),
  url         TEXT NOT NULL,
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  size        INT,
  downloads   INT DEFAULT 0,
  tags        TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT TRUE,
  trimester   INT NOT NULL DEFAULT 1 CHECK (trimester IN (1,2,3)),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIDEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title            TEXT NOT NULL,
  description      TEXT,
  url              TEXT NOT NULL,
  thumbnail        TEXT,
  duration_seconds INT DEFAULT 0,
  subject_id       UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  views            INT DEFAULT 0,
  tags             TEXT[] DEFAULT '{}',
  is_published     BOOLEAN DEFAULT TRUE,
  trimester        INT NOT NULL DEFAULT 1 CHECK (trimester IN (1,2,3)),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUIZZES / SIMULADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  title              TEXT NOT NULL,
  description        TEXT,
  type               TEXT NOT NULL DEFAULT 'multipla_escolha'
                     CHECK (type IN ('multipla_escolha','verdadeiro_falso','dissertativa','enem','desafio')),
  subject_id         UUID REFERENCES subjects(id) ON DELETE SET NULL,
  class_id           UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_limit_minutes INT,
  questions          JSONB NOT NULL DEFAULT '[]',
  due_date           TIMESTAMPTZ,
  is_published       BOOLEAN DEFAULT TRUE,
  attempts_allowed   INT DEFAULT 3,
  show_answers_after BOOLEAN DEFAULT TRUE,
  trimester          INT DEFAULT 1 CHECK (trimester IN (1,2,3)),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  quiz_id            UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers            JSONB NOT NULL DEFAULT '[]',
  score              NUMERIC(8,2) DEFAULT 0,
  max_score          NUMERIC(8,2) DEFAULT 0,
  percentage         NUMERIC(5,2) DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  started_at         TIMESTAMPTZ DEFAULT NOW(),
  finished_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'general'
             CHECK (type IN ('grade','attendance','task','event','message','system','achievement','general')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  priority   TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  read       BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GAMIFICATION
-- ============================================================
CREATE TABLE IF NOT EXISTS gamification (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id               UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id              UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  xp                      INT DEFAULT 0,
  level                   INT DEFAULT 1,
  league                  TEXT DEFAULT 'bronze'
                          CHECK (league IN ('bronze','prata','ouro','platina','diamante')),
  streak_days             INT DEFAULT 0,
  last_activity_date      DATE DEFAULT CURRENT_DATE,
  total_tasks_completed   INT DEFAULT 0,
  total_quizzes_completed INT DEFAULT 0,
  total_logins            INT DEFAULT 0,
  total_study_minutes     INT DEFAULT 0,
  achievements            JSONB DEFAULT '[]',
  daily_missions          JSONB DEFAULT '[]',
  weekly_missions         JSONB DEFAULT '[]',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLASS SCHEDULES  (Horários)
-- ============================================================
CREATE TABLE IF NOT EXISTS class_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  class_id      UUID NOT NULL UNIQUE REFERENCES classes(id) ON DELETE CASCADE,
  academic_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  slots         JSONB NOT NULL DEFAULT '[]',
  created_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_school        ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role          ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment    ON profiles(enrollment_number) WHERE enrollment_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_classes_school         ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class      ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student         ON assessment_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment      ON assessment_grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student     ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date        ON attendances(date);
CREATE INDEX IF NOT EXISTS idx_tasks_class            ON tasks(class_id);
CREATE INDEX IF NOT EXISTS idx_tasks_teacher          ON tasks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student    ON task_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_posts_class            ON classroom_posts(class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv          ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user     ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student  ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz     ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher ON class_subjects(teacher_id);

-- Full-text search on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON profiles USING GIN (name gin_trgm_ops);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['profiles','tasks','task_submissions','classroom_posts','gamification','class_schedules','assessment_grades']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- AUTO-CREATE PROFILE TRIGGER  (on Supabase auth user creation)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, school_id, name, email, role, is_active)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno'),
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
DO $$ DECLARE tbl TEXT; BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles','classes','subjects','class_subjects',
    'assessments','assessment_grades','attendances',
    'tasks','task_submissions','classroom_posts',
    'conversations','messages','calendar_events',
    'materials','videos','quizzes','quiz_attempts',
    'notifications','gamification','class_schedules'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END; $$;

-- ── Helper functions ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_school_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role IN ('professor','coordenador','diretor') FROM profiles WHERE id = auth.uid()), FALSE)
$$;

CREATE OR REPLACE FUNCTION is_management()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role IN ('coordenador','diretor') FROM profiles WHERE id = auth.uid()), FALSE)
$$;

-- ── PROFILES ──────────────────────────────────────────────────
CREATE POLICY "profiles: own or same school staff"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR (school_id = auth_school_id() AND is_staff()));

CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles: insert management"
  ON profiles FOR INSERT WITH CHECK (is_management() OR id = auth.uid());

CREATE POLICY "profiles: delete director"
  ON profiles FOR DELETE USING (auth_role() = 'diretor');

-- ── CLASSES / SUBJECTS / CLASS_SUBJECTS ───────────────────────
CREATE POLICY "classes: same school read"
  ON classes FOR SELECT USING (school_id = auth_school_id());
CREATE POLICY "classes: management write"
  ON classes FOR ALL USING (school_id = auth_school_id() AND is_management());

CREATE POLICY "subjects: same school read"
  ON subjects FOR SELECT USING (school_id = auth_school_id());
CREATE POLICY "subjects: management write"
  ON subjects FOR ALL USING (school_id = auth_school_id() AND is_management());

CREATE POLICY "class_subjects: same school read"
  ON class_subjects FOR SELECT USING (school_id = auth_school_id());
CREATE POLICY "class_subjects: management write"
  ON class_subjects FOR ALL USING (school_id = auth_school_id() AND is_management());

-- ── ASSESSMENTS ───────────────────────────────────────────────
CREATE POLICY "assessments: class members"
  ON assessments FOR SELECT USING (
    school_id = auth_school_id() AND (
      is_staff() OR
      class_id IN (SELECT class_id FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "assessments: staff write"
  ON assessments FOR ALL USING (school_id = auth_school_id() AND is_staff());

-- ── GRADES ────────────────────────────────────────────────────
CREATE POLICY "grades: staff or own"
  ON assessment_grades FOR SELECT USING (
    school_id = auth_school_id() AND (is_staff() OR student_id = auth.uid())
  );
CREATE POLICY "grades: staff write"
  ON assessment_grades FOR ALL USING (school_id = auth_school_id() AND is_staff());

-- ── ATTENDANCE ────────────────────────────────────────────────
CREATE POLICY "attendance: staff or own"
  ON attendances FOR SELECT USING (
    school_id = auth_school_id() AND (
      is_staff() OR
      student_id = auth.uid() OR
      student_id IN (SELECT id FROM profiles WHERE child_id = auth.uid())
    )
  );
CREATE POLICY "attendance: staff write"
  ON attendances FOR ALL USING (school_id = auth_school_id() AND is_staff());

-- ── TASKS & SUBMISSIONS ───────────────────────────────────────
CREATE POLICY "tasks: class members"
  ON tasks FOR SELECT USING (
    school_id = auth_school_id() AND (
      is_staff() OR
      class_id IN (SELECT class_id FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "tasks: staff write"
  ON tasks FOR ALL USING (school_id = auth_school_id() AND is_staff());

CREATE POLICY "submissions: staff or own"
  ON task_submissions FOR SELECT USING (
    school_id = auth_school_id() AND (is_staff() OR student_id = auth.uid())
  );
CREATE POLICY "submissions: student insert"
  ON task_submissions FOR INSERT WITH CHECK (school_id = auth_school_id() AND student_id = auth.uid());
CREATE POLICY "submissions: staff or own update"
  ON task_submissions FOR UPDATE USING (school_id = auth_school_id() AND (is_staff() OR student_id = auth.uid()));

-- ── CLASSROOM POSTS ───────────────────────────────────────────
CREATE POLICY "posts: class members"
  ON classroom_posts FOR SELECT USING (
    school_id = auth_school_id() AND (
      is_staff() OR
      class_id IN (SELECT class_id FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "posts: staff write"
  ON classroom_posts FOR ALL USING (school_id = auth_school_id() AND is_staff());

-- ── CONVERSATIONS / MESSAGES ──────────────────────────────────
CREATE POLICY "conversations: participant"
  ON conversations FOR SELECT USING (
    school_id = auth_school_id() AND auth.uid() = ANY(participant_ids)
  );
CREATE POLICY "conversations: participant write"
  ON conversations FOR ALL USING (
    school_id = auth_school_id() AND auth.uid() = ANY(participant_ids)
  );

CREATE POLICY "messages: participant"
  ON messages FOR SELECT USING (
    school_id = auth_school_id() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE auth.uid() = ANY(participant_ids)
    )
  );
CREATE POLICY "messages: sender insert"
  ON messages FOR INSERT WITH CHECK (school_id = auth_school_id() AND sender_id = auth.uid());
CREATE POLICY "messages: sender update"
  ON messages FOR UPDATE USING (school_id = auth_school_id() AND sender_id = auth.uid());

-- ── EVENTS ────────────────────────────────────────────────────
CREATE POLICY "events: visible"
  ON calendar_events FOR SELECT USING (
    school_id = auth_school_id() AND (
      is_global OR
      is_personal AND created_by = auth.uid() OR
      is_staff() OR
      class_id IN (SELECT class_id FROM profiles WHERE id = auth.uid()) OR
      auth.uid() = ANY(class_ids)
    )
  );
CREATE POLICY "events: author or staff write"
  ON calendar_events FOR ALL USING (
    school_id = auth_school_id() AND (created_by = auth.uid() OR is_staff())
  );

-- ── MATERIALS / VIDEOS / QUIZZES ─────────────────────────────
CREATE POLICY "materials: class members"
  ON materials FOR SELECT USING (
    school_id = auth_school_id() AND (
      is_staff() OR class_id IN (SELECT class_id FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "materials: staff write" ON materials FOR ALL USING (school_id = auth_school_id() AND is_staff());

CREATE POLICY "videos: class members"
  ON videos FOR SELECT USING (
    school_id = auth_school_id() AND (
      is_staff() OR class_id IN (SELECT class_id FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "videos: staff write" ON videos FOR ALL USING (school_id = auth_school_id() AND is_staff());

CREATE POLICY "quizzes: class members"
  ON quizzes FOR SELECT USING (
    school_id = auth_school_id() AND (
      is_staff() OR class_id IN (SELECT class_id FROM profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "quizzes: staff write" ON quizzes FOR ALL USING (school_id = auth_school_id() AND is_staff());

-- ── QUIZ ATTEMPTS ─────────────────────────────────────────────
CREATE POLICY "attempts: staff or own"
  ON quiz_attempts FOR SELECT USING (school_id = auth_school_id() AND (is_staff() OR student_id = auth.uid()));
CREATE POLICY "attempts: student insert"
  ON quiz_attempts FOR INSERT WITH CHECK (school_id = auth_school_id() AND student_id = auth.uid());

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE POLICY "notifications: own"
  ON notifications FOR SELECT USING (school_id = auth_school_id() AND user_id = auth.uid());
CREATE POLICY "notifications: staff send"
  ON notifications FOR INSERT WITH CHECK (school_id = auth_school_id() AND is_staff());
CREATE POLICY "notifications: own update/delete"
  ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications: own delete"
  ON notifications FOR DELETE USING (user_id = auth.uid());

-- ── GAMIFICATION ──────────────────────────────────────────────
CREATE POLICY "gamification: staff or own"
  ON gamification FOR SELECT USING (school_id = auth_school_id() AND (is_staff() OR student_id = auth.uid()));
CREATE POLICY "gamification: own write"
  ON gamification FOR ALL USING (school_id = auth_school_id() AND (is_management() OR student_id = auth.uid()));

-- ── SCHEDULES ─────────────────────────────────────────────────
CREATE POLICY "schedules: same school read"
  ON class_schedules FOR SELECT USING (school_id = auth_school_id());
CREATE POLICY "schedules: management write"
  ON class_schedules FOR ALL USING (school_id = auth_school_id() AND is_management());

-- ============================================================
-- REALTIME  (enable for tables that need live updates)
-- ============================================================
-- Run in Supabase Dashboard → Database → Replication → Tables
-- or via SQL:
DO $$
BEGIN
  -- Only enable if the publication exists (it always does in Supabase)
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE classroom_posts;
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;
END;
$$;
