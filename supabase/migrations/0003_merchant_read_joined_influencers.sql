-- =============================================================
-- 0003 Allow merchants to read profiles of influencers joined to
-- their campaigns. Without this, merchant-side rankings/listings
-- cannot resolve influencer name/email and appear empty.
-- =============================================================

create or replace function public.is_influencer_in_my_campaign(_user_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.influencer_campaign ic
    join public.campaigns c on c.id = ic.campaign_id
    where ic.influencer_id = _user_id and c.merchant_id = auth.uid()
  );
$$;

drop policy if exists users_merchant_read_joined_influencers on public.users;
create policy users_merchant_read_joined_influencers on public.users
  for select using (public.is_influencer_in_my_campaign(id));
