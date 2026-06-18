-- ================================================================
-- 芯火会务 Supabase 完整初始化脚本
-- 在 Supabase Dashboard > SQL Editor 中全选粘贴执行
-- ================================================================

-- ================================================================
-- Part 1: 核心业务表
-- ================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'draft',
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  address TEXT,
  expected_guests INTEGER NOT NULL DEFAULT 0,
  actual_guests INTEGER NOT NULL DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  primary_customer_id UUID,
  budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  customer_id UUID,
  contact_id UUID,
  name TEXT NOT NULL,
  company TEXT,
  position TEXT,
  phone TEXT,
  email TEXT,
  level TEXT NOT NULL DEFAULT 'normal',
  source TEXT NOT NULL DEFAULT 'legacy',
  invite_status TEXT NOT NULL DEFAULT 'draft',
  guest_role TEXT NOT NULL DEFAULT 'attendee',
  profile_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  seat_zone_id UUID,
  seat_number TEXT,
  check_in_status TEXT NOT NULL DEFAULT 'pending',
  check_in_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee TEXT,
  responsibility TEXT,
  start_date TEXT,
  end_date TEXT,
  deliverables TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.script_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  chapter_id UUID,
  "order" INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'segment',
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  speaker TEXT,
  content TEXT,
  notes TEXT,
  start_time TEXT,
  end_time TEXT,
  is_next_day BOOLEAN NOT NULL DEFAULT false,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.script_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seating_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  shape TEXT NOT NULL DEFAULT 'round',
  locked BOOLEAN NOT NULL DEFAULT false,
  guests JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.seating_zones(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  table_number TEXT,
  seat_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lottery_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  level INTEGER NOT NULL DEFAULT 1,
  remaining INTEGER NOT NULL DEFAULT 1,
  draw_count INTEGER NOT NULL DEFAULT 1,
  allow_repeat BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lottery_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES public.lottery_prizes(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  record_id TEXT,
  win_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed BOOLEAN NOT NULL DEFAULT false,
  abandoned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lottery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES public.lottery_prizes(id) ON DELETE CASCADE,
  attendee_ids TEXT[] NOT NULL DEFAULT '{}',
  abandoned_attendee_ids TEXT[] NOT NULL DEFAULT '{}',
  draw_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  draw_mode TEXT NOT NULL DEFAULT 'auto',
  operator TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  issues TEXT[] NOT NULL DEFAULT '{}',
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  statistics JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  description TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  cooperation_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================================
-- Part 2: 扩展模块（customers / contacts / supplier 扩展）
-- ================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  company_name TEXT,
  industry_category TEXT,
  cooperation_intent TEXT NOT NULL DEFAULT 'medium',
  intent_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'prospect',
  source TEXT,
  address TEXT,
  region TEXT,
  website TEXT,
  cooperation_count INTEGER NOT NULL DEFAULT 0,
  last_cooperation_at TIMESTAMPTZ,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  native_place TEXT,
  gender TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  wechat_qr_url TEXT,
  wechat_id TEXT,
  qq TEXT,
  avatar_url TEXT,
  motto TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  relationship_role TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  contact_id UUID REFERENCES public.customer_contacts(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'client',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sponsor_level TEXT,
  sponsor_profile JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, customer_id, role)
);

CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  native_place TEXT,
  gender TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  wechat_qr_url TEXT,
  wechat_id TEXT,
  qq TEXT,
  avatar_url TEXT,
  motto TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  relationship_role TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supplier_event_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.supplier_contacts(id) ON DELETE SET NULL,
  service_scope TEXT,
  contract_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.supplier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  quality_score NUMERIC(3,2),
  delivery_score NUMERIC(3,2),
  communication_score NUMERIC(3,2),
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.locked_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  prize_ids TEXT[] NOT NULL DEFAULT '{}',
  effect_time_start TIMESTAMPTZ,
  effect_time_end TIMESTAMPTZ,
  is_blacklist BOOLEAN NOT NULL DEFAULT false,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================================
-- Part 3: 触发器 — auth.users 注册后自动创建 public.users
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    'staff',
    'active'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- Part 4: RLS 安全策略
-- ================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seating_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.can_access_event(target_event_id UUID, minimum_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  WITH ranks(role, rank) AS (
    VALUES ('viewer', 0), ('executor', 1), ('manager', 2), ('owner', 3)
  )
  SELECT
    public.current_app_role() = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.events e WHERE e.id = target_event_id AND e.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.event_members em
      JOIN ranks member_rank ON member_rank.role = em.role
      JOIN ranks required_rank ON required_rank.role = minimum_role
      WHERE em.event_id = target_event_id AND em.user_id = auth.uid()
        AND member_rank.rank >= required_rank.rank
    )
$$;

CREATE POLICY "users_can_read_self" ON public.users
  FOR SELECT USING (id = auth.uid() OR public.current_app_role() = 'super_admin');
CREATE POLICY "super_admins_can_update_users" ON public.users
  FOR UPDATE USING (public.current_app_role() = 'super_admin')
  WITH CHECK (public.current_app_role() = 'super_admin');

CREATE POLICY "event_members_can_read_events" ON public.events
  FOR SELECT USING (public.can_access_event(id, 'viewer'));
CREATE POLICY "event_managers_can_create_events" ON public.events
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "event_managers_can_update_events" ON public.events
  FOR UPDATE USING (public.can_access_event(id, 'manager'));
CREATE POLICY "owners_can_delete_events" ON public.events
  FOR DELETE USING (public.can_access_event(id, 'owner'));

CREATE POLICY "event_members_read_members" ON public.event_members
  FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "owners_manage_members" ON public.event_members
  FOR ALL USING (public.can_access_event(event_id, 'owner'));

CREATE POLICY "event_members_read_guests" ON public.guests
  FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "executors_manage_guests" ON public.guests
  FOR ALL USING (public.can_access_event(event_id, 'executor'));

CREATE POLICY "event_members_read_tasks" ON public.event_tasks
  FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "managers_manage_tasks" ON public.event_tasks
  FOR ALL USING (public.can_access_event(event_id, 'manager'));

CREATE POLICY "event_members_read_scripts" ON public.script_segments
  FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "executors_manage_scripts" ON public.script_segments
  FOR ALL USING (public.can_access_event(event_id, 'executor'));

CREATE POLICY "event_members_read_seating" ON public.seating_zones
  FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "managers_manage_seating" ON public.seating_zones
  FOR ALL USING (public.can_access_event(event_id, 'manager'));

CREATE POLICY "event_members_read_prizes" ON public.lottery_prizes
  FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "managers_manage_prizes" ON public.lottery_prizes
  FOR ALL USING (public.can_access_event(event_id, 'manager'));

CREATE POLICY "event_members_read_winners" ON public.lottery_winners
  FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "managers_manage_winners" ON public.lottery_winners
  FOR ALL USING (public.can_access_event(event_id, 'manager'));

CREATE POLICY "event_members_read_reports" ON public.event_reports
  FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "managers_manage_reports" ON public.event_reports
  FOR ALL USING (public.can_access_event(event_id, 'manager'));

CREATE POLICY "staff_read_suppliers" ON public.suppliers
  FOR SELECT USING (public.current_app_role() IN ('super_admin', 'event_manager', 'executor', 'staff'));
CREATE POLICY "managers_manage_suppliers" ON public.suppliers
  FOR ALL USING (public.current_app_role() IN ('super_admin', 'event_manager'));

CREATE POLICY "super_admins_read_audit_logs" ON public.audit_logs
  FOR SELECT USING (public.current_app_role() = 'super_admin');
CREATE POLICY "users_create_own_audit_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "staff_read_customers" ON public.customers
  FOR SELECT USING (public.current_app_role() IN ('super_admin', 'event_manager', 'executor', 'staff'));
CREATE POLICY "managers_manage_customers" ON public.customers
  FOR ALL USING (public.current_app_role() IN ('super_admin', 'event_manager'));

CREATE POLICY "staff_read_contacts" ON public.customer_contacts
  FOR SELECT USING (public.current_app_role() IN ('super_admin', 'event_manager', 'executor', 'staff'));
CREATE POLICY "managers_manage_contacts" ON public.customer_contacts
  FOR ALL USING (public.current_app_role() IN ('super_admin', 'event_manager'));

-- ================================================================
-- Part 5: 索引
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_events_owner ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_guests_event ON public.guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_checkin ON public.guests(event_id, check_in_status);
CREATE INDEX IF NOT EXISTS idx_tasks_event ON public.event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_scripts_event ON public.script_segments(event_id);
CREATE INDEX IF NOT EXISTS idx_seating_zones_event ON public.seating_zones(event_id);
CREATE INDEX IF NOT EXISTS idx_lottery_prizes_event ON public.lottery_prizes(event_id);
CREATE INDEX IF NOT EXISTS idx_lottery_winners_event ON public.lottery_winners(event_id);
CREATE INDEX IF NOT EXISTS idx_reports_event ON public.event_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers USING gin (to_tsvector('simple', coalesce(organization_name,'') || ' ' || coalesce(company_name,'') || ' ' || coalesce(industry_category,'')));
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer ON public.customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_event_customers_event ON public.event_customers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_customers_customer ON public.event_customers(customer_id);


-- ================================================================
-- P2 新增表 (由全量修复生成)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  level_name TEXT,
  amount NUMERIC(12,2),
  contact_name TEXT,
  contact_phone TEXT,
  contact_wechat TEXT,
  contact_email TEXT,
  logo_url TEXT,
  company_intro TEXT,
  booth_needed BOOLEAN DEFAULT false,
  benefits TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_budget" ON public.budget_lines FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "managers_manage_budget" ON public.budget_lines FOR ALL USING (public.can_access_event(event_id, 'manager'));

CREATE POLICY "members_read_sponsors" ON public.sponsors FOR SELECT USING (public.can_access_event(event_id, 'viewer'));
CREATE POLICY "managers_manage_sponsors" ON public.sponsors FOR ALL USING (public.can_access_event(event_id, 'manager'));

CREATE POLICY "staff_read_forms" ON public.forms FOR SELECT USING (public.current_app_role() IN ('super_admin', 'event_manager', 'executor', 'staff'));
CREATE POLICY "managers_manage_forms" ON public.forms FOR ALL USING (public.current_app_role() IN ('super_admin', 'event_manager'));

CREATE POLICY "staff_read_submissions" ON public.form_submissions FOR SELECT USING (true);
CREATE POLICY "managers_manage_submissions" ON public.form_submissions FOR ALL USING (public.current_app_role() IN ('super_admin', 'event_manager'));

CREATE INDEX IF NOT EXISTS idx_budget_event ON public.budget_lines(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_event ON public.sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_forms_event ON public.forms(event_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form ON public.form_submissions(form_id);

CREATE OR REPLACE FUNCTION public.decrement_prize_remaining(p_prize_id UUID, p_count INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.lottery_prizes
  SET remaining = GREATEST(remaining - p_count, 0),
      updated_at = now()
  WHERE id = p_prize_id;
END;
$$;
