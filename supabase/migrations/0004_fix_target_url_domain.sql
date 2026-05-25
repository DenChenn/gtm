-- =============================================================
-- 0004: Rewrite legacy seed target_url (shop.example.com) to the
--       app's own Vercel domain so /p/:productId resolves in the SPA.
--
-- Old seed wrote: https://shop.example.com/p/<product_id>
-- New format:     https://gtm-dun.vercel.app/p/<product_id>?ref=<code>
--
-- Only rows that still point at shop.example.com are touched; links
-- created via the app (which already use window.location.origin) are
-- left alone.
-- =============================================================

update public.affiliate_links
set target_url =
  'https://gtm-dun.vercel.app/p/' || product_id::text || '?ref=' || code
where target_url like 'https://shop.example.com/%'
  and product_id is not null;
