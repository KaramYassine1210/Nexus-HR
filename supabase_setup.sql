-- ═══════════════════════════════════════════════════════════════════
-- Nexus RH — Supabase Database Setup Script
-- Run this ONCE in: supabase.com → your project → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════

-- ── 0. Extensions ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Tables ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'hr')),
  name        TEXT NOT NULL,
  dept        TEXT NOT NULL,
  avatar      TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  join_date   DATE NOT NULL,
  manager     TEXT NOT NULL DEFAULT '—',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.requests (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  employee_id   TEXT NOT NULL REFERENCES public.users(id),
  employee_name TEXT NOT NULL,
  dept          TEXT NOT NULL,
  date          DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  details       JSONB NOT NULL DEFAULT '{}',
  color         TEXT NOT NULL DEFAULT '#6366f1',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.request_comments (
  id          BIGSERIAL PRIMARY KEY,
  request_id  TEXT NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  role        TEXT NOT NULL,
  text        TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Disable RLS (demo app — add policies before going to production) ──
ALTER TABLE public.users             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_comments  DISABLE ROW LEVEL SECURITY;

-- ── 3. Enable Realtime ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_comments;

-- ── 4. Seed: Demo Users (passwords stored as SHA-256 hash of 'demo') ──
INSERT INTO public.users (id, email, password, role, name, dept, avatar, color, join_date, manager) VALUES
  ('U001', 'alice@hrflow.io',   encode(digest('demo', 'sha256'), 'hex'), 'employee', 'Alice Martin',  'Engineering',     'AM', '#6366f1', '2022-03-15', 'Bob Dupont'),
  ('U002', 'bob@hrflow.io',     encode(digest('demo', 'sha256'), 'hex'), 'manager',  'Bob Dupont',    'Engineering',     'BD', '#10b981', '2020-01-10', 'Claire Blanc'),
  ('U003', 'claire@hrflow.io',  encode(digest('demo', 'sha256'), 'hex'), 'hr',       'Claire Blanc',  'Human Resources', 'CB', '#f59e0b', '2019-06-01', '—'),
  ('U004', 'david@hrflow.io',   encode(digest('demo', 'sha256'), 'hex'), 'employee', 'David Chen',    'Design',          'DC', '#3b82f6', '2023-01-20', 'Bob Dupont'),
  ('U005', 'emma@hrflow.io',    encode(digest('demo', 'sha256'), 'hex'), 'employee', 'Emma Wilson',   'Marketing',       'EW', '#8b5cf6', '2021-09-05', 'Bob Dupont'),
  ('U006', 'frank@hrflow.io',   encode(digest('demo', 'sha256'), 'hex'), 'manager',  'Frank Leroy',   'Marketing',       'FL', '#06b6d4', '2020-07-12', 'Claire Blanc')
ON CONFLICT (id) DO NOTHING;

-- ── If you already ran the script with plaintext passwords, run this to migrate ──
-- UPDATE public.users SET password = encode(digest(password, 'sha256'), 'hex') WHERE length(password) < 64;

-- ── 5. Seed: Demo Requests ────────────────────────────────────────────
INSERT INTO public.requests (id, type, title, employee_id, employee_name, dept, date, status, details, color, created_at) VALUES

  ('R001', 'leave', 'Congé annuel',
    'U001', 'Alice Martin', 'Engineering', '2026-04-20', 'pending',
    '{"from":"2026-05-01","to":"2026-05-10","days":10,"reason":"Vacances familiales"}',
    '#6366f1', '2026-04-20 09:00:00+00'),

  ('R002', 'absence', 'Justificatif d''absence',
    'U004', 'David Chen', 'Design', '2026-04-18', 'approved',
    '{"absenceDate":"2026-04-17","reason":"Rendez-vous médical","justif":"Ordonnance médicale"}',
    '#3b82f6', '2026-04-18 09:00:00+00'),

  ('R003', 'personal', 'Changement d''adresse',
    'U005', 'Emma Wilson', 'Marketing', '2026-04-15', 'approved',
    '{"field":"Adresse","oldVal":"12 rue des lilas, Paris","newVal":"45 avenue Victor Hugo, Lyon"}',
    '#8b5cf6', '2026-04-15 09:00:00+00'),

  ('R004', 'document', 'Attestation employeur',
    'U001', 'Alice Martin', 'Engineering', '2026-04-14', 'pending',
    '{"docType":"Attestation employeur","reason":"Dossier bancaire","urgency":"Normal"}',
    '#6366f1', '2026-04-14 09:00:00+00'),

  ('R005', 'leave', 'Congé maladie',
    'U004', 'David Chen', 'Design', '2026-04-12', 'rejected',
    '{"from":"2026-04-13","to":"2026-04-15","days":3,"reason":"Grippe"}',
    '#3b82f6', '2026-04-12 09:00:00+00'),

  ('R006', 'document', 'Bulletin de salaire',
    'U005', 'Emma Wilson', 'Marketing', '2026-04-10', 'approved',
    '{"docType":"Bulletin de salaire","reason":"Demande de crédit","urgency":"Urgent"}',
    '#8b5cf6', '2026-04-10 09:00:00+00'),

  ('R007', 'leave', 'RTT',
    'U004', 'David Chen', 'Design', '2026-04-08', 'pending',
    '{"from":"2026-04-25","to":"2026-04-25","days":1,"reason":"RTT récupération"}',
    '#3b82f6', '2026-04-08 09:00:00+00'),

  ('R008', 'personal', 'Mise à jour numéro tél',
    'U001', 'Alice Martin', 'Engineering', '2026-04-06', 'pending',
    '{"field":"Téléphone","oldVal":"06 12 34 56 78","newVal":"07 89 01 23 45"}',
    '#6366f1', '2026-04-06 09:00:00+00')

ON CONFLICT (id) DO NOTHING;

-- ── 6. Seed: Demo Comments ────────────────────────────────────────────
INSERT INTO public.request_comments (request_id, author, role, text, date, created_at) VALUES
  ('R002', 'Claire Blanc', 'RH',      'Justificatif reçu, absence validée.', '2026-04-18', '2026-04-18 14:00:00+00'),
  ('R005', 'Bob Dupont',   'Manager', 'Arrêt maladie non fourni.',            '2026-04-12', '2026-04-12 16:00:00+00');
