-- =============================================================
-- 0002 Fix RLS infinite recursion via SECURITY DEFINER helpers
--
-- 原因：campaigns ⇄ influencer_campaign 的 policy 互相 reference
-- 對方表，Postgres 評估時觸發遞迴。SECURITY DEFINER 函式以擁有者
-- 身分執行，內部查詢不再經過 RLS，藉此斷開 cycle。
-- =============================================================

-- ----- helper functions -----
create or replace function public.is_campaign_merchant(_campaign_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.campaigns
    where id = _campaign_id and merchant_id = auth.uid()
  );
$$;

create or replace function public.is_joined_to_campaign(_campaign_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.influencer_campaign
    where campaign_id = _campaign_id and influencer_id = auth.uid()
  );
$$;

create or replace function public.is_active_campaign(_campaign_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.campaigns
    where id = _campaign_id and status = 'active'
  );
$$;

create or replace function public.is_link_owner(_link_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.affiliate_links al
    join public.influencer_campaign ic on ic.id = al.influencer_campaign_id
    where al.id = _link_id and ic.influencer_id = auth.uid()
  );
$$;

create or replace function public.is_link_in_merchant_campaign(_link_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.affiliate_links al
    join public.influencer_campaign ic on ic.id = al.influencer_campaign_id
    join public.campaigns c on c.id = ic.campaign_id
    where al.id = _link_id and c.merchant_id = auth.uid()
  );
$$;

create or replace function public.can_own_link_via_ic(_influencer_campaign_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.influencer_campaign
    where id = _influencer_campaign_id and influencer_id = auth.uid()
  );
$$;

-- ----- campaigns -----
drop policy if exists influencer_joined_campaigns on public.campaigns;
create policy influencer_joined_campaigns on public.campaigns
  for select using (public.is_joined_to_campaign(id));

-- ----- influencer_campaign -----
drop policy if exists ic_read on public.influencer_campaign;
create policy ic_read on public.influencer_campaign
  for select using (
    influencer_id = auth.uid()
    or public.is_campaign_merchant(campaign_id)
  );

-- ----- products -----
drop policy if exists products_via_campaign on public.products;
create policy products_via_campaign on public.products
  for select using (
    public.is_active_campaign(campaign_id)
    or public.is_campaign_merchant(campaign_id)
    or public.is_joined_to_campaign(campaign_id)
  );

drop policy if exists products_merchant_write on public.products;
create policy products_merchant_write on public.products
  for all using (public.is_campaign_merchant(campaign_id))
  with check (public.is_campaign_merchant(campaign_id));

-- ----- affiliate_links -----
drop policy if exists links_owner on public.affiliate_links;
create policy links_owner on public.affiliate_links
  for all using (public.is_link_owner(id))
  with check (public.can_own_link_via_ic(influencer_campaign_id));

drop policy if exists links_merchant_read on public.affiliate_links;
create policy links_merchant_read on public.affiliate_links
  for select using (public.is_link_in_merchant_campaign(id));

-- ----- click_events -----
drop policy if exists click_read_scoped on public.click_events;
create policy click_read_scoped on public.click_events
  for select using (
    public.is_link_owner(affiliate_link_id)
    or public.is_link_in_merchant_campaign(affiliate_link_id)
  );

-- ----- conversion_events -----
drop policy if exists conversion_read_scoped on public.conversion_events;
create policy conversion_read_scoped on public.conversion_events
  for select using (
    public.is_link_owner(affiliate_link_id)
    or public.is_link_in_merchant_campaign(affiliate_link_id)
  );
