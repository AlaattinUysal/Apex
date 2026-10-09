-- Apex (proje adı belirlenecek) — ilk şema
-- Supabase Dashboard > SQL Editor'e yapıştırıp çalıştır.
-- Tekrar çalıştırmak güvenli değildir (tablolar zaten varsa hata verir).

-- ============================================================
-- TABLOLAR
-- ============================================================

create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references auth.users(id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 120),
  class_name       text not null check (char_length(class_name) between 1 and 60),
  topic            text not null check (char_length(topic) between 1 and 120),
  description      text,
  join_code        text not null unique check (join_code ~ '^[A-Z0-9]{6}$'),
  status           text not null default 'draft' check (status in ('draft', 'live', 'ended')),
  chatbot_enabled  boolean not null default true,
  room_name        text not null unique default gen_random_uuid()::text,
  started_at       timestamptz,
  ended_at         timestamptz,
  created_at       timestamptz not null default now()
);
create index lessons_teacher_idx on public.lessons (teacher_id, created_at desc);

-- Öğrencinin anonim oturumu. Tarayıcıya httpOnly çerezle verilen token'ın SHA-256 özeti saklanır.
create table public.lesson_participants (
  id               uuid primary key default gen_random_uuid(),
  lesson_id        uuid not null references public.lessons(id) on delete cascade,
  token_hash       text not null unique,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null default (now() + interval '6 hours')
);
create index lesson_participants_lesson_idx on public.lesson_participants (lesson_id);

create table public.topic_cards (
  id                      uuid primary key default gen_random_uuid(),
  lesson_id               uuid not null references public.lessons(id) on delete cascade,
  topic_label             text not null,
  summary_text            text not null,
  kind                    text not null default 'question' check (kind in ('question', 'feedback')),
  distinct_session_count  integer not null default 0,
  message_count           integer not null default 0,
  status                  text not null default 'open' check (status in ('open', 'answered')),
  is_read                 boolean not null default false,
  has_update              boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index topic_cards_lesson_idx on public.topic_cards (lesson_id, status, updated_at desc);

create table public.student_messages (
  id               uuid primary key default gen_random_uuid(),
  lesson_id        uuid not null references public.lessons(id) on delete cascade,
  participant_id   uuid not null references public.lesson_participants(id) on delete cascade,
  original_text    text not null check (char_length(original_text) between 1 and 500),
  status           text not null default 'queued' check (status in ('queued', 'delivered', 'rejected')),
  reject_label     text,
  card_id          uuid references public.topic_cards(id) on delete set null,
  created_at       timestamptz not null default now(),
  processed_at     timestamptz
);
create index student_messages_queue_idx on public.student_messages (lesson_id, status, created_at);
create index student_messages_participant_idx on public.student_messages (participant_id, created_at);
create index student_messages_card_idx on public.student_messages (card_id);

create table public.analysis_runs (
  id               uuid primary key default gen_random_uuid(),
  lesson_id        uuid not null references public.lessons(id) on delete cascade,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  status           text not null default 'running' check (status in ('running', 'completed', 'failed')),
  message_count    integer not null default 0,
  card_count       integer not null default 0,
  error            text
);
create index analysis_runs_lesson_idx on public.analysis_runs (lesson_id, started_at desc);

-- ============================================================
-- RLS (satır düzeyi güvenlik)
-- ============================================================
-- Kural: tarayıcıdan (anon/authenticated anahtarla) yalnızca ÖĞRETMEN,
-- yalnızca KENDİ derslerine ait lessons / topic_cards / analysis_runs verisine erişir.
-- lesson_participants ve student_messages için hiçbir politika YOK:
-- istemci bu tablolara hiçbir şekilde erişemez. Öğrenci işlemleri ve analiz,
-- sunucu tarafında (service role anahtarı) Next.js API route'larından yapılır.

alter table public.lessons             enable row level security;
alter table public.lesson_participants enable row level security;
alter table public.student_messages    enable row level security;
alter table public.topic_cards         enable row level security;
alter table public.analysis_runs       enable row level security;

-- Savunma katmanı: istemci rollerinin bu tablolara doğrudan yetkisini kaldır.
revoke all on public.lesson_participants from anon, authenticated;
revoke all on public.student_messages    from anon, authenticated;
revoke all on public.analysis_runs       from anon;

-- lessons: öğretmen kendi derslerini yönetir
create policy lessons_select_own on public.lessons
  for select to authenticated using (teacher_id = auth.uid());
create policy lessons_insert_own on public.lessons
  for insert to authenticated with check (teacher_id = auth.uid());
create policy lessons_update_own on public.lessons
  for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy lessons_delete_own on public.lessons
  for delete to authenticated using (teacher_id = auth.uid());

-- topic_cards: öğretmen kendi derslerinin kartlarını okur ve okundu/cevaplandı günceller
create policy topic_cards_select_own on public.topic_cards
  for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = auth.uid()));
create policy topic_cards_update_own on public.topic_cards
  for update to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = auth.uid()))
  with check (exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = auth.uid()));

-- Öğretmen kartın yalnızca durum alanlarını değiştirebilsin (metni/sayıları değil)
revoke update on public.topic_cards from authenticated;
grant update (is_read, has_update, status) on public.topic_cards to authenticated;
revoke insert, delete on public.topic_cards from authenticated;
revoke insert, update, delete on public.analysis_runs from authenticated;

-- analysis_runs: öğretmen yalnızca okur
create policy analysis_runs_select_own on public.analysis_runs
  for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = auth.uid()));

-- ============================================================
-- REALTIME: öğretmen paneli kartları ve ders durumunu canlı izler
-- ============================================================
alter publication supabase_realtime add table public.topic_cards;
alter publication supabase_realtime add table public.lessons;
