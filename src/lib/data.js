import { supabase } from './supabase'
import { DEFAULT_STATUS } from '../constants'

// ---------------------------------------------------------------------------
// Shared query helpers. Members are additionally protected by RLS server-side;
// these helpers also filter by member_id client-side so the UI never even
// requests another member's data.
// ---------------------------------------------------------------------------

/**
 * Every brand with its (optional) allocation + assigned member.
 * Returns flattened rows: one per brand, carrying its primary allocation.
 */
export async function fetchBrandRows() {
  const { data, error } = await supabase
    .from('brands')
    .select(
      `id, name, category, fest_tag,
       allocations ( id, fest, status, member_id, profiles ( id, full_name ) )`,
    )
    .order('name', { ascending: true })
  if (error) throw error
  return (data || []).map(flattenBrand)
}

/** Allocations belonging to a single member, joined to their brand. */
export async function fetchMyAllocations(memberId) {
  const { data, error } = await supabase
    .from('allocations')
    .select(
      `id, fest, status, member_id,
       brands ( id, name, category, fest_tag )`,
    )
    .eq('member_id', memberId)
  if (error) throw error
  return (data || []).map((a) => ({
    allocationId: a.id,
    brandId: a.brands?.id,
    name: a.brands?.name,
    category: a.brands?.category,
    festTag: a.brands?.fest_tag,
    fest: a.fest,
    status: a.status || DEFAULT_STATUS,
    memberId: a.member_id,
  }))
}

/** A single allocation with brand + member, for the detail page. */
export async function fetchAllocation(allocationId) {
  const { data, error } = await supabase
    .from('allocations')
    .select(
      `id, fest, status, member_id, brand_id,
       brands ( id, name, category, fest_tag ),
       profiles ( id, full_name )`,
    )
    .eq('id', allocationId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Call-log history for an allocation, newest first. */
export async function fetchCallLogs(allocationId) {
  const { data, error } = await supabase
    .from('call_logs')
    .select('*')
    .eq('allocation_id', allocationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** All team members (and admins) for assignment + team views. */
export async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name', { ascending: true })
  if (error) throw error
  return data || []
}

/**
 * Call logs across the team (admin) or for one member, within the last `days`.
 * Used by the "calls per day" charts.
 */
export async function fetchRecentCallLogs({ memberId = null, days = 14 } = {}) {
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  since.setHours(0, 0, 0, 0)

  let query = supabase
    .from('call_logs')
    .select('id, member_id, status, created_at, allocation_id')
    .gte('created_at', since.toISOString())
  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Collapse a brand + its allocations array into a single display row. */
export function flattenBrand(brand) {
  const alloc = brand.allocations?.[0] || null
  return {
    id: brand.id,
    name: brand.name,
    category: brand.category,
    festTag: brand.fest_tag,
    allocationId: alloc?.id ?? null,
    fest: alloc?.fest ?? null,
    status: alloc?.status ?? DEFAULT_STATUS,
    memberId: alloc?.member_id ?? null,
    memberName: alloc?.profiles?.full_name ?? null,
    allocated: Boolean(alloc),
  }
}

/**
 * Build a dense [{ date, label, count }] series for the last `days` days from
 * a list of rows that each have a `created_at`. Fills empty days with 0.
 */
export function callsPerDay(logs, days = 14) {
  const buckets = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    buckets.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      count: 0,
    })
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]))
  for (const log of logs) {
    const key = new Date(log.created_at).toISOString().slice(0, 10)
    if (key in index) buckets[index[key]].count += 1
  }
  return buckets
}
