-- RLS performans düzeltmesi: auth.uid() her satırda değil, sorgu başına bir kez hesaplansın.
-- (Supabase advisor: auth_rls_initplan)

drop policy lessons_select_own on public.lessons;
drop policy lessons_insert_own on public.lessons;
drop policy lessons_update_own on public.lessons;
drop policy lessons_delete_own on public.lessons;
drop policy topic_cards_select_own on public.topic_cards;
drop policy topic_cards_update_own on public.topic_cards;
drop policy analysis_runs_select_own on public.analysis_runs;

create policy lessons_select_own on public.lessons
  for select to authenticated using (teacher_id = (select auth.uid()));
create policy lessons_insert_own on public.lessons
  for insert to authenticated with check (teacher_id = (select auth.uid()));
create policy lessons_update_own on public.lessons
  for update to authenticated
  using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
create policy lessons_delete_own on public.lessons
  for delete to authenticated using (teacher_id = (select auth.uid()));

create policy topic_cards_select_own on public.topic_cards
  for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = (select auth.uid())));
create policy topic_cards_update_own on public.topic_cards
  for update to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = (select auth.uid())))
  with check (exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = (select auth.uid())));

create policy analysis_runs_select_own on public.analysis_runs
  for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = (select auth.uid())));
