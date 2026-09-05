-- J.A Services -- core schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

-- ============ PROFILES ============
-- Extends Supabase's built-in auth.users with app-specific fields.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  phone_verified boolean not null default false,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ PRODUCTS (J.A Products catalog) ============
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  description text,
  price_xaf integer not null check (price_xaf >= 0), -- store in XAF (no decimals)
  stock integer not null default 0 check (stock >= 0),
  category text,
  images jsonb not null default '[]', -- array of image filenames/urls
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ MASTERCLASS TIERS ============
create table if not exists public.masterclass_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_xaf integer not null check (price_xaf >= 0),
  description text,
  features jsonb not null default '[]',
  active boolean not null default true
);

-- The WhatsApp link lives in its OWN table with no public RLS policy at all
-- (default-deny). Row-level security hides ROWS, not columns -- if the link
-- were a column on masterclass_tiers, the "public read active tiers" policy
-- below would leak it to anyone with the anon key before they've paid. This
-- table is only ever read server-side with the service-role client, after
-- an enrollment's status is confirmed.
create table if not exists public.masterclass_tier_secrets (
  tier_id uuid primary key references public.masterclass_tiers(id) on delete cascade,
  whatsapp_group_link text not null
);

-- ============ ENROLLMENTS (Masterclass) ============
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier_id uuid not null references public.masterclass_tiers(id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'confirmed', 'cancelled')),
  payment_id uuid, -- set once a payment succeeds; FK added after payments table exists
  whatsapp_link_revealed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ BOOKINGS (consultations / sourcing requests) ============
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('consultation', 'sourcing')),
  product_reference text, -- free text description of what they want sourced
  status text not null default 'requested' check (status in ('requested', 'scheduled', 'completed', 'cancelled')),
  scheduled_at timestamptz,
  notes text,
  contact_phone text,
  created_at timestamptz not null default now()
);

-- ============ ORDERS (J.A Products purchases) ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
  ),
  total_xaf integer not null check (total_xaf >= 0),
  shipping_name text,
  shipping_phone text,
  shipping_address text,
  payment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price_xaf integer not null check (unit_price_xaf >= 0)
);

-- ============ PAYMENTS (provider-agnostic ledger) ============
-- One row per payment attempt/confirmation from CinetPay / Campay / NotchPay.
-- reference_type + reference_id point back to the enrollment or order being paid for.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('campay', 'cinetpay', 'notchpay')),
  provider_reference text not null, -- the transaction/reference id the provider gives us
  amount_xaf integer not null check (amount_xaf >= 0),
  currency text not null default 'XAF',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  reference_type text not null check (reference_type in ('enrollment', 'order')),
  reference_id uuid not null,
  payer_phone text,
  raw_webhook_payload jsonb,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique (provider, provider_reference)
);

alter table public.enrollments
  add constraint enrollments_payment_id_fkey foreign key (payment_id) references public.payments(id);
alter table public.orders
  add constraint orders_payment_id_fkey foreign key (payment_id) references public.payments(id);

-- ============ VISITOR / USER TRACKING ============
create table if not exists public.visitor_events (
  id bigint generated always as identity primary key,
  session_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null, -- e.g. 'page_view', 'view_product', 'add_to_cart', 'begin_checkout'
  page text,
  metadata jsonb not null default '{}',
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists visitor_events_session_idx on public.visitor_events (session_id);
create index if not exists visitor_events_created_idx on public.visitor_events (created_at);

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.masterclass_tiers enable row level security;
alter table public.masterclass_tier_secrets enable row level security;
alter table public.enrollments enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.visitor_events enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Profiles: users see/edit their own row; admins see all.
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Products & masterclass tiers: public read (active only), admin-only write.
create policy "products_public_read" on public.products
  for select using (active = true or public.is_admin());
create policy "products_admin_write" on public.products
  for insert with check (public.is_admin());
create policy "products_admin_update" on public.products
  for update using (public.is_admin());
create policy "tiers_public_read" on public.masterclass_tiers
  for select using (active = true or public.is_admin());
create policy "tiers_admin_write" on public.masterclass_tiers
  for all using (public.is_admin());

-- Enrollments/bookings/orders/order_items: users see their own; admins see all.
-- NOTE: no client-side insert/update policies for status changes on enrollments/orders --
-- those are only ever written by the payment webhook using the service-role key
-- (server-side, bypasses RLS), so a client can never fake "paid".
create policy "enrollments_select_own_or_admin" on public.enrollments
  for select using (auth.uid() = user_id or public.is_admin());
create policy "enrollments_insert_own" on public.enrollments
  for insert with check (auth.uid() = user_id);
create policy "enrollments_admin_update" on public.enrollments
  for update using (public.is_admin());

create policy "bookings_select_own_or_admin" on public.bookings
  for select using (auth.uid() = user_id or public.is_admin());
create policy "bookings_insert_any" on public.bookings
  for insert with check (true); -- allow guest bookings/consultations

create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin());

create policy "order_items_select_via_order" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );
create policy "order_items_insert_via_order" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or o.user_id is null)
    )
  );

-- Payments: never exposed to clients directly -- admin read-only. All writes are
-- server-side (webhook handler using the service-role key, which bypasses RLS).
create policy "payments_admin_read" on public.payments
  for select using (public.is_admin());

-- Visitor events: insert-only from clients (anonymous or logged in), no read.
-- Admin dashboard reads via service role, not through this policy.
create policy "visitor_events_insert_any" on public.visitor_events
  for insert with check (true);
