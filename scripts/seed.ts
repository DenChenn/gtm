/**
 * Seed fake data into the cloud Supabase project.
 *
 * Usage:
 *   1. Add to .env.local (or a separate .env.seed — DO NOT commit):
 *        SUPABASE_URL=https://<project-ref>.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxxxxxxxxx
 *   2. yarn add -D tsx @faker-js/faker dotenv
 *   3. yarn seed           (added to package.json scripts)
 *
 * What it does:
 *   - Creates NEW fake merchant + influencer accounts via Supabase Auth Admin API
 *   - Inserts campaigns / products / influencer_campaign / affiliate_links
 *   - Generates click_events and conversion_events spread over the past 30 days
 *
 * It does NOT touch any existing real users or campaigns.
 */

import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'
import { config as loadEnv } from 'dotenv'
import type { Database } from '../src/types/database.types'

// Load .env.local first (Vite convention), fall back to .env.
loadEnv({ path: '.env.local' })
loadEnv()

// ============ Tunables ============
const N_MERCHANTS = 5
const N_INFLUENCERS = 20
const N_CAMPAIGNS = 10
const N_PRODUCTS = 50
const CLICKS_TOTAL = 5_000
const CONVERSIONS_TOTAL = 500
const SHARED_PASSWORD = 'Passw0rd!'
const DAYS_BACK = 30
// When true, also pull existing merchants / influencers / campaigns / products
// from public.users + public.campaigns + public.products and include them in
// the seed pool. New activity (joins, links, clicks, conversions) will be
// generated against them too. Set to false to seed only newly-created fake data.
const INCLUDE_EXISTING = true

// ============ Setup ============
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_ORIGIN = (process.env.APP_ORIGIN ?? 'https://gtm-dun.vercel.app').replace(/\/+$/, '')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local.'
  )
  process.exit(1)
}

const sb = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

faker.seed(Date.now() % 100000)

// ============ Helpers ============
type Role = 'merchant' | 'influencer'

async function createAuthUser(role: Role, idx: number) {
  const slug = faker.string.alphanumeric(6).toLowerCase()
  const email = `${role}.${slug}.${idx}@example.com`
  const name =
    role === 'merchant'
      ? `${faker.company.name()} Store`
      : `@${faker.internet.username().toLowerCase()}`

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: SHARED_PASSWORD,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (error || !data.user) {
    throw new Error(`auth.createUser failed for ${email}: ${error?.message}`)
  }

  const { error: insErr } = await sb
    .from('users')
    .insert({ id: data.user.id, email, name, role })
  if (insErr) {
    throw new Error(`users insert failed for ${email}: ${insErr.message}`)
  }
  return { id: data.user.id, email, name }
}

function randomPastDate(daysBack: number) {
  const ms = Date.now() - faker.number.int({ min: 0, max: daysBack * 86_400_000 })
  return new Date(ms).toISOString()
}

async function insertInChunks<T>(
  table: 'click_events' | 'conversion_events',
  rows: T[],
  chunkSize = 500
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    // Cast: the generated Insert type omits the auto-default timestamp column,
    // but the DB accepts it and we want spread-over-time data for charts.
    const { error } = await sb.from(table).insert(chunk as never)
    if (error) throw new Error(`${table} insert failed: ${error.message}`)
    process.stdout.write(`  ${table}: ${Math.min(i + chunkSize, rows.length)}/${rows.length}\r`)
  }
  process.stdout.write('\n')
}

// ============ Main ============
async function main() {
  console.log(`🌱 Seeding ${SUPABASE_URL}`)
  console.log(
    `   ${N_MERCHANTS} merchants, ${N_INFLUENCERS} influencers, ${N_CAMPAIGNS} campaigns, ${N_PRODUCTS} products`
  )
  console.log(`   ${CLICKS_TOTAL} clicks, ${CONVERSIONS_TOTAL} conversions over last ${DAYS_BACK}d`)
  console.log(`   INCLUDE_EXISTING=${INCLUDE_EXISTING}\n`)

  // ---- Load existing users / campaigns / products (if enabled) ----
  let existingMerchants: { id: string }[] = []
  let existingInfluencers: { id: string }[] = []
  let existingCampaigns: { id: string; merchant_id: string }[] = []
  let existingProducts: { id: string; campaign_id: string }[] = []

  if (INCLUDE_EXISTING) {
    console.log('→ Loading existing users / campaigns / products...')
    const { data: existingUsers, error: euErr } = await sb
      .from('users')
      .select('id, role')
    if (euErr) throw euErr
    existingMerchants = (existingUsers ?? []).filter((u) => u.role === 'merchant')
    existingInfluencers = (existingUsers ?? []).filter((u) => u.role === 'influencer')

    const { data: ec, error: ecErr } = await sb
      .from('campaigns')
      .select('id, merchant_id')
    if (ecErr) throw ecErr
    existingCampaigns = ec ?? []

    const { data: ep, error: epErr } = await sb
      .from('products')
      .select('id, campaign_id')
    if (epErr) throw epErr
    existingProducts = ep ?? []

    console.log(
      `   found ${existingMerchants.length} merchants, ${existingInfluencers.length} influencers, ` +
        `${existingCampaigns.length} campaigns, ${existingProducts.length} products`
    )
  }

  console.log('→ Creating fake merchants...')
  const newMerchants = []
  for (let i = 0; i < N_MERCHANTS; i++) {
    newMerchants.push(await createAuthUser('merchant', i))
  }

  console.log('→ Creating fake influencers...')
  const newInfluencers = []
  for (let i = 0; i < N_INFLUENCERS; i++) {
    newInfluencers.push(await createAuthUser('influencer', i))
  }

  // Combined pools — existing + newly created
  const merchants: { id: string }[] = [...existingMerchants, ...newMerchants]
  const influencers: { id: string }[] = [...existingInfluencers, ...newInfluencers]

  console.log('→ Creating fake campaigns (assigned across all merchants)...')
  const newCampaignRows = Array.from({ length: N_CAMPAIGNS }, () => {
    const start = faker.date.recent({ days: 30 })
    const end = faker.date.soon({ days: 60, refDate: start })
    return {
      merchant_id: faker.helpers.arrayElement(merchants).id,
      title: `${faker.commerce.productAdjective()} ${faker.commerce.department()} 行銷活動`,
      status: 'active',
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    }
  })
  const { data: newCampaigns, error: cErr } = await sb
    .from('campaigns')
    .insert(newCampaignRows)
    .select('id, merchant_id')
  if (cErr || !newCampaigns) throw cErr

  const campaigns = [...existingCampaigns, ...newCampaigns]

  console.log('→ Creating fake products (spread across all campaigns)...')
  const newProductRows = Array.from({ length: N_PRODUCTS }, () => ({
    campaign_id: faker.helpers.arrayElement(campaigns).id,
    name: faker.commerce.productName(),
    image_url: `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/600/600`,
    price: Number(faker.commerce.price({ min: 100, max: 5000 })),
  }))
  const { data: newProducts, error: pErr } = await sb
    .from('products')
    .insert(newProductRows)
    .select('id, campaign_id')
  if (pErr || !newProducts) throw pErr

  const products = [...existingProducts, ...newProducts]

  console.log('→ Linking influencers to campaigns...')
  // Pull existing influencer_campaign rows so we don't violate the unique(campaign_id, influencer_id).
  const existingPairs = new Set<string>()
  if (INCLUDE_EXISTING) {
    const { data: existingIc, error: eicErr } = await sb
      .from('influencer_campaign')
      .select('campaign_id, influencer_id')
    if (eicErr) throw eicErr
    for (const r of existingIc ?? []) {
      existingPairs.add(`${r.campaign_id}|${r.influencer_id}`)
    }
  }

  const icRows: { campaign_id: string; influencer_id: string }[] = []
  const seenPairs = new Set<string>(existingPairs)
  for (const inf of influencers) {
    const joined = faker.helpers.arrayElements(
      campaigns,
      faker.number.int({ min: 2, max: Math.min(5, campaigns.length) })
    )
    for (const c of joined) {
      const key = `${c.id}|${inf.id}`
      if (seenPairs.has(key)) continue
      seenPairs.add(key)
      icRows.push({ campaign_id: c.id, influencer_id: inf.id })
    }
  }
  const { data: newIcs, error: icErr } = await sb
    .from('influencer_campaign')
    .insert(icRows)
    .select('id, campaign_id')
  if (icErr || !newIcs) throw icErr

  // Also pull all existing influencer_campaign rows so links can attach to them too.
  let ics: { id: string; campaign_id: string }[] = newIcs
  if (INCLUDE_EXISTING) {
    const { data: allIcs, error: aicErr } = await sb
      .from('influencer_campaign')
      .select('id, campaign_id')
    if (aicErr) throw aicErr
    ics = allIcs ?? newIcs
  }

  console.log('→ Creating affiliate links...')
  const productsByCampaign = new Map<string, typeof products>()
  for (const p of products) {
    const arr = productsByCampaign.get(p.campaign_id) ?? []
    arr.push(p)
    productsByCampaign.set(p.campaign_id, arr)
  }

  // Skip (influencer_campaign_id, product_id) pairs that already have a link.
  const existingLinkPairs = new Set<string>()
  if (INCLUDE_EXISTING) {
    const { data: el, error: elErr } = await sb
      .from('affiliate_links')
      .select('influencer_campaign_id, product_id')
    if (elErr) throw elErr
    for (const r of el ?? []) {
      if (r.product_id) existingLinkPairs.add(`${r.influencer_campaign_id}|${r.product_id}`)
    }
  }

  const linkRows: {
    influencer_campaign_id: string
    product_id: string
    target_url: string
    code: string
  }[] = []
  for (const ic of ics) {
    const cps = productsByCampaign.get(ic.campaign_id) ?? []
    for (const p of cps) {
      const key = `${ic.id}|${p.id}`
      if (existingLinkPairs.has(key)) continue
      existingLinkPairs.add(key)
      const code = faker.string.alphanumeric(10).toLowerCase()
      linkRows.push({
        influencer_campaign_id: ic.id,
        product_id: p.id,
        target_url: `${APP_ORIGIN}/p/${p.id}?ref=${code}`,
        code,
      })
    }
  }
  const { data: newLinks, error: lErr } = await sb
    .from('affiliate_links')
    .insert(linkRows)
    .select('id')
  if (lErr || !newLinks) throw lErr
  console.log(`   ${newLinks.length} new affiliate links created`)

  // For click/conversion generation: use ALL links (existing + new) so that
  // existing links also get fresh traffic.
  let allLinks: { id: string }[] = newLinks
  if (INCLUDE_EXISTING) {
    const { data: al, error: alErr } = await sb.from('affiliate_links').select('id')
    if (alErr) throw alErr
    allLinks = al ?? newLinks
  }
  const links = allLinks

  console.log(`→ Generating ${CLICKS_TOTAL} click_events...`)
  const referrers = [
    'https://instagram.com/',
    'https://youtube.com/',
    'https://tiktok.com/',
    'https://line.me/',
    'https://x.com/',
    null,
  ]
  const clickRows = Array.from({ length: CLICKS_TOTAL }, () => ({
    affiliate_link_id: faker.helpers.arrayElement(links).id,
    clicked_at: randomPastDate(DAYS_BACK),
    referrer: faker.helpers.arrayElement(referrers),
    visitor_hash: faker.string.alphanumeric(16),
  }))
  await insertInChunks('click_events', clickRows)

  console.log(`→ Generating ${CONVERSIONS_TOTAL} conversion_events...`)
  const convRows = Array.from({ length: CONVERSIONS_TOTAL }, () => ({
    affiliate_link_id: faker.helpers.arrayElement(links).id,
    converted_at: randomPastDate(DAYS_BACK),
    order_amount: Number(faker.commerce.price({ min: 200, max: 8000 })),
  }))
  await insertInChunks('conversion_events', convRows)

  console.log('\n✅ Done.')
  console.log(`   Login password for newly-created fake accounts: ${SHARED_PASSWORD}`)
  console.log(`   Sample new merchant: ${newMerchants[0].email}`)
  console.log(`   Sample new influencer: ${newInfluencers[0].email}`)
  if (INCLUDE_EXISTING) {
    console.log(
      `   Existing accounts (${existingMerchants.length} merchants, ${existingInfluencers.length} influencers) ` +
        `also received new activity.`
    )
  }
}

main().catch((e) => {
  console.error('\n❌ Seed failed:', e)
  process.exit(1)
})
