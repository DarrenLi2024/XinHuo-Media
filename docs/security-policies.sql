-- 芯火会务安全基线：Supabase RLS 与关键约束
-- 执行前请确认表名与当前数据库一致；脚本按 docs/database-design.md 的命名编写。

alter table users enable row level security;
alter table events enable row level security;
alter table event_members enable row level security;
alter table guests enable row level security;
alter table event_tasks enable row level security;
alter table script_segments enable row level security;
alter table seating_zones enable row level security;
alter table seats enable row level security;
alter table lottery_prizes enable row level security;
alter table lottery_winners enable row level security;
alter table event_reports enable row level security;
alter table suppliers enable row level security;
alter table audit_logs enable row level security;

create unique index if not exists idx_lottery_winners_unique_guest_per_event
  on lottery_winners(event_id, guest_id);

create index if not exists idx_event_members_lookup
  on event_members(event_id, user_id, role);

create or replace function current_app_role()
returns text
language sql
stable
as $$
  select role from users where id = auth.uid() and status = 'active'
$$;

create or replace function can_access_event(target_event_id uuid, minimum_role text default 'viewer')
returns boolean
language sql
stable
as $$
  with ranks(role, rank) as (
    values ('viewer', 0), ('executor', 1), ('manager', 2), ('owner', 3)
  )
  select
    current_app_role() = 'super_admin'
    or exists (
      select 1
      from events e
      where e.id = target_event_id
        and e.owner_id = auth.uid()
    )
    or exists (
      select 1
      from event_members em
      join ranks member_rank on member_rank.role = em.role
      join ranks required_rank on required_rank.role = minimum_role
      where em.event_id = target_event_id
        and em.user_id = auth.uid()
        and member_rank.rank >= required_rank.rank
    )
$$;

create policy "users can read self"
  on users for select
  using (id = auth.uid() or current_app_role() = 'super_admin');

create policy "super admins can update users"
  on users for update
  using (current_app_role() = 'super_admin')
  with check (current_app_role() = 'super_admin');

create policy "event members can read events"
  on events for select
  using (can_access_event(id, 'viewer'));

create policy "event managers can create events"
  on events for insert
  with check (owner_id = auth.uid() and current_app_role() in ('super_admin', 'event_manager'));

create policy "event managers can update events"
  on events for update
  using (can_access_event(id, 'manager'))
  with check (can_access_event(id, 'manager'));

create policy "owners can delete events"
  on events for delete
  using (can_access_event(id, 'owner'));

create policy "event members can read memberships"
  on event_members for select
  using (can_access_event(event_id, 'viewer'));

create policy "owners can manage memberships"
  on event_members for all
  using (can_access_event(event_id, 'owner'))
  with check (can_access_event(event_id, 'owner'));

create policy "event members can read guests"
  on guests for select
  using (can_access_event(event_id, 'viewer'));

create policy "executors can manage guests"
  on guests for all
  using (can_access_event(event_id, 'executor'))
  with check (can_access_event(event_id, 'executor'));

create policy "event members can read tasks"
  on event_tasks for select
  using (can_access_event(event_id, 'viewer'));

create policy "managers can create tasks"
  on event_tasks for insert
  with check (can_access_event(event_id, 'manager'));

create policy "executors can update tasks"
  on event_tasks for update
  using (can_access_event(event_id, 'executor'))
  with check (can_access_event(event_id, 'executor'));

create policy "event members can read scripts"
  on script_segments for select
  using (can_access_event(event_id, 'viewer'));

create policy "executors can manage scripts"
  on script_segments for all
  using (can_access_event(event_id, 'executor'))
  with check (can_access_event(event_id, 'executor'));

create policy "event members can read seating"
  on seating_zones for select
  using (can_access_event(event_id, 'viewer'));

create policy "managers can manage seating"
  on seating_zones for all
  using (can_access_event(event_id, 'manager'))
  with check (can_access_event(event_id, 'manager'));

create policy "event members can read prizes"
  on lottery_prizes for select
  using (can_access_event(event_id, 'viewer'));

create policy "managers can manage prizes"
  on lottery_prizes for all
  using (can_access_event(event_id, 'manager'))
  with check (can_access_event(event_id, 'manager'));

create policy "event members can read winners"
  on lottery_winners for select
  using (can_access_event(event_id, 'viewer'));

create policy "managers can manage winners"
  on lottery_winners for all
  using (can_access_event(event_id, 'manager'))
  with check (can_access_event(event_id, 'manager'));

create policy "event members can read reports"
  on event_reports for select
  using (can_access_event(event_id, 'viewer'));

create policy "managers can manage reports"
  on event_reports for all
  using (can_access_event(event_id, 'manager'))
  with check (can_access_event(event_id, 'manager'));

create policy "staff can read suppliers"
  on suppliers for select
  using (current_app_role() in ('super_admin', 'event_manager', 'executor', 'staff'));

create policy "event managers can manage suppliers"
  on suppliers for all
  using (current_app_role() in ('super_admin', 'event_manager'))
  with check (current_app_role() in ('super_admin', 'event_manager'));

create policy "super admins can read audit logs"
  on audit_logs for select
  using (current_app_role() = 'super_admin');

create policy "authenticated users can create own audit logs"
  on audit_logs for insert
  with check (user_id = auth.uid());
