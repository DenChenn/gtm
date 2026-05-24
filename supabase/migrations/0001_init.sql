-- =============================================================
-- GTM — 0001 init: tables, indexes, RLS policies
-- =============================================================

-- ============ Types & Tables ============
do $$ begin
  create type public.user_role as enum ('merchant', 'influencer');
exception when duplicate_object then null; end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role public.user_role not null,
  created_at timestamptz default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.users(id),
  title text not null,
  status text not null default 'active',
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  image_url text,
  price numeric(10,2) not null
);

create table if not exists public.influencer_campaign (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  influencer_id uuid not null references public.users(id),
  joined_at timestamptz default now(),
  unique (campaign_id, influencer_id)
);

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  influencer_campaign_id uuid not null references public.influencer_campaign(id) on delete cascade,
  product_id uuid references public.products(id),
  target_url text not null,
  code text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.click_events (
  id bigserial primary key,
  affiliate_link_id uuid not null references public.affiliate_links(id) on delete cascade,
  clicked_at timestamptz default now(),
  referrer text,
  visitor_hash text
);

create table if not exists public.conversion_events (
  id bigserial primary key,
  affiliate_link_id uuid not null references public.affiliate_links(id) on delete cascade,
  converted_at timestamptz default now(),
  order_amount numeric(10,2) not null
);

-- ============ Indexes ============
create index if not exists click_events_link_time
  on public.click_events (affiliate_link_id, clicked_at);
create index if not exists conversion_events_link_time
  on public.conversion_events (affiliate_link_id, converted_at);

-- ============ Row Level Security ============
alter table public.users              enable row level security;
alter table public.campaigns          enable row level security;
alter table public.products           enable row level security;
alter table public.influencer_campaign enable row level security;
alter table public.affiliate_links    enable row level security;
alter table public.click_events       enable row level security;
alter table public.conversion_events  enable row level security;

-- users
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (id = auth.uid());

drop policy if exists users_self_insert on public.users;
create policy users_self_insert on public.users
  for insert with check (id = auth.uid());

-- campaigns: merchant 全權；influencer 只能讀已加入活動
drop policy if exists merchant_own_campaigns on public.campaigns;
create policy merchant_own_campaigns on public.campaigns
  for all using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists influencer_joined_campaigns on public.campaigns;
create policy influencer_joined_campaigns on public.campaigns
  for select using (
    exists (
      select 1 from public.influencer_campaign ic
      where ic.campaign_id = campaigns.id and ic.influencer_id = auth.uid()
    )
  );

-- 為了讓網紅瀏覽「可加入活動」清單，允許讀 status='active' 的活動公開資訊
drop policy if exists campaigns_public_browse on public.campaigns;
create policy campaigns_public_browse on public.campaigns
  for select using (status = 'active');

-- products
drop policy if exists products_via_campaign on public.products;
create policy products_via_campaign on public.products
  for select using (
    exists (
      select 1 from public.campaigns c
      where c.id = products.campaign_id
        and (c.status = 'active'
             or c.merchant_id = auth.uid()
             or exists (select 1 from public.influencer_campaign ic
                        where ic.campaign_id = c.id and ic.influencer_id = auth.uid()))
    )
  );

drop policy if exists products_merchant_write on public.products;
create policy products_merchant_write on public.products
  for all using (
    exists (select 1 from public.campaigns c
            where c.id = products.campaign_id and c.merchant_id = auth.uid())
  );

-- influencer_campaign
drop policy if exists ic_read on public.influencer_campaign;
create policy ic_read on public.influencer_campaign
  for select using (
    influencer_id = auth.uid()
    or exists (select 1 from public.campaigns c
               where c.id = influencer_campaign.campaign_id and c.merchant_id = auth.uid())
  );

drop policy if exists ic_influencer_join on public.influencer_campaign;
create policy ic_influencer_join on public.influencer_campaign
  for insert with check (influencer_id = auth.uid());

-- affiliate_links
drop policy if exists links_owner on public.affiliate_links;
create policy links_owner on public.affiliate_links
  for all using (
    exists (select 1 from public.influencer_campaign ic
            where ic.id = affiliate_links.influencer_campaign_id
              and ic.influencer_id = auth.uid())
  )
  with check (
    exists (select 1 from public.influencer_campaign ic
            where ic.id = affiliate_links.influencer_campaign_id
              and ic.influencer_id = auth.uid())
  );

drop policy if exists links_merchant_read on public.affiliate_links;
create policy links_merchant_read on public.affiliate_links
  for select using (
    exists (
      select 1 from public.influencer_campaign ic
      join public.campaigns c on c.id = ic.campaign_id
      where ic.id = affiliate_links.influencer_campaign_id
        and c.merchant_id = auth.uid()
    )
  );

-- 公開短碼 → target_url 解析 (redirect 頁面用)
drop policy if exists links_public_resolve on public.affiliate_links;
create policy links_public_resolve on public.affiliate_links
  for select using (true);

-- click_events: 任何人可寫；讀取限相關網紅或商家
drop policy if exists click_insert_any on public.click_events;
create policy click_insert_any on public.click_events
  for insert with check (true);

drop policy if exists click_read_scoped on public.click_events;
create policy click_read_scoped on public.click_events
  for select using (
    exists (
      select 1 from public.affiliate_links al
      join public.influencer_campaign ic on ic.id = al.influencer_campaign_id
      join public.campaigns c on c.id = ic.campaign_id
      where al.id = click_events.affiliate_link_id
        and (ic.influencer_id = auth.uid() or c.merchant_id = auth.uid())
    )
  );

-- conversion_events: 同上 (鏡像)
drop policy if exists conversion_insert_any on public.conversion_events;
create policy conversion_insert_any on public.conversion_events
  for insert with check (true);

drop policy if exists conversion_read_scoped on public.conversion_events;
create policy conversion_read_scoped on public.conversion_events
  for select using (
    exists (
      select 1 from public.affiliate_links al
      join public.influencer_campaign ic on ic.id = al.influencer_campaign_id
      join public.campaigns c on c.id = ic.campaign_id
      where al.id = conversion_events.affiliate_link_id
        and (ic.influencer_id = auth.uid() or c.merchant_id = auth.uid())
    )
  );
