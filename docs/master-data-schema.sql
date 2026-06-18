-- 会务主数据互通扩展：客户、关键人、活动客户关系、供应商同构扩展
-- 适用于 Supabase/Postgres。重复执行时尽量保持幂等。

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  company_name text,
  industry_category text,
  cooperation_intent text not null default 'medium',
  intent_level text not null default 'medium',
  status text not null default 'prospect',
  source text,
  address text,
  region text,
  website text,
  cooperation_count integer not null default 0,
  last_cooperation_at timestamptz,
  owner_id uuid references public.users(id) on delete set null,
  tags text[] not null default '{}',
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null
);

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  company_name text,
  position text,
  native_place text,
  gender text,
  address text,
  phone text,
  email text,
  wechat_qr_url text,
  wechat_id text,
  qq text,
  avatar_url text,
  motto text,
  is_primary boolean not null default false,
  relationship_role text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_customers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  contact_id uuid references public.customer_contacts(id) on delete set null,
  role text not null default 'client',
  is_primary boolean not null default false,
  sponsor_level text,
  sponsor_profile jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, customer_id, role)
);

alter table public.event_customers add column if not exists sponsor_level text;
alter table public.event_customers add column if not exists sponsor_profile jsonb;

alter table public.events add column if not exists primary_customer_id uuid references public.customers(id) on delete set null;
alter table public.guests add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.guests add column if not exists contact_id uuid references public.customer_contacts(id) on delete set null;
alter table public.guests add column if not exists source text not null default 'legacy';
alter table public.guests add column if not exists invite_status text not null default 'draft';
alter table public.guests add column if not exists guest_role text not null default 'attendee';
alter table public.guests add column if not exists profile_snapshot jsonb not null default '{}'::jsonb;

create table if not exists public.supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  name text not null,
  company_name text,
  position text,
  native_place text,
  gender text,
  address text,
  phone text,
  email text,
  wechat_qr_url text,
  wechat_id text,
  qq text,
  avatar_url text,
  motto text,
  is_primary boolean not null default false,
  relationship_role text,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_event_links (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete cascade,
  contact_id uuid references public.supplier_contacts(id) on delete set null,
  service_scope text,
  contract_amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_reviews (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  rating numeric(3,2) not null default 0,
  quality_score numeric(3,2),
  delivery_score numeric(3,2),
  communication_score numeric(3,2),
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null
);

create index if not exists idx_customers_search on public.customers using gin (
  to_tsvector('simple', coalesce(organization_name, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(industry_category, ''))
);
create index if not exists idx_customer_contacts_customer on public.customer_contacts(customer_id);
create index if not exists idx_customer_contacts_phone on public.customer_contacts(phone);
create index if not exists idx_customer_contacts_email on public.customer_contacts(email);
create index if not exists idx_customer_contacts_wechat on public.customer_contacts(wechat_id);
create index if not exists idx_event_customers_event on public.event_customers(event_id);
create index if not exists idx_event_customers_customer on public.event_customers(customer_id);
create index if not exists idx_event_customers_sponsor on public.event_customers(event_id, sponsor_level) where role = 'sponsor';
create index if not exists idx_guests_event_customer on public.guests(event_id, customer_id, contact_id);
create index if not exists idx_supplier_contacts_supplier on public.supplier_contacts(supplier_id);
create index if not exists idx_supplier_event_links_event on public.supplier_event_links(event_id);
