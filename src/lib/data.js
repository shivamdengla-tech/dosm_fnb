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

/**
 * Allocations for a member, enriched with call activity so the dashboard can
 * build the "Up Next" queue: latest call time, latest scheduled follow-up,
 * and the most recent POC contact details.
 *
 * Uses `call_logs (*)` (not an explicit column list) so the query keeps
 * working even before the `next_follow_up` migration has been applied — the
 * column is simply absent until then.
 */
export async function fetchMyQueue(memberId) {
  const { data, error } = await supabase
    .from('allocations')
    .select(
      `id, fest, status, member_id,
       brands ( id, name, category, fest_tag ),
       call_logs ( * )`,
    )
    .eq('member_id', memberId)
  if (error) throw error
  return (data || []).map((a) => {
    const logs = [...(a.call_logs || [])].sort(
      (x, y) => new Date(y.created_at) - new Date(x.created_at),
    )
    const latest = logs[0] || null
    // The most recently scheduled follow-up that still carries a date.
    const withFollow = logs.find((l) => l.next_follow_up)
    return {
      allocationId: a.id,
      brandId: a.brands?.id,
      name: a.brands?.name,
      category: a.brands?.category,
      festTag: a.brands?.fest_tag,
      fest: a.fest,
      status: a.status || DEFAULT_STATUS,
      memberId: a.member_id,
      lastCallAt: latest?.created_at || null,
      nextFollowUp: withFollow?.next_follow_up || null,
      pocName: latest?.poc_name || null,
      pocNumber: latest?.poc_number || null,
      pocEmail: latest?.poc_email || null,
      callCount: logs.length,
    }
  })
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

/**
 * Append a call-log snapshot AND keep the allocation's current status in sync
 * (this is the one place both writes happen, so boards/charts stay consistent).
 *
 * `nextFollowUp` is only sent when set, so logging a call still works on a DB
 * that hasn't had the `next_follow_up` migration applied yet.
 */
export async function logCall({
  allocationId,
  memberId,
  status,
  notes = null,
  nextFollowUp = null,
  deal = null,
}) {
  const row = {
    allocation_id: allocationId,
    member_id: memberId,
    status,
    notes: notes?.trim() ? notes.trim() : null,
  }
  if (deal) {
    const qty =
      deal.quantity === '' || deal.quantity == null ? null : Number(deal.quantity)
    Object.assign(row, {
      poc_name: deal.poc_name?.trim() || null,
      poc_number: deal.poc_number?.trim() || null,
      poc_email: deal.poc_email?.trim() || null,
      quantity: Number.isNaN(qty) ? null : qty,
      skus: deal.skus?.trim() || null,
      delivery_date: deal.delivery_date || null,
      stall_space: deal.stall_space?.trim() || null,
    })
  }
  if (nextFollowUp) row.next_follow_up = nextFollowUp

  const { error: logErr } = await supabase.from('call_logs').insert(row)
  if (logErr) throw logErr
  const { error: allocErr } = await supabase
    .from('allocations')
    .update({ status })
    .eq('id', allocationId)
  if (allocErr) throw allocErr
}

/**
 * Set an allocation's pipeline status directly (no call-log snapshot).
 * Used by the Kanban board for quick drag-to-change-status corrections.
 */
export async function updateAllocationStatus(allocationId, status) {
  const { error } = await supabase
    .from('allocations')
    .update({ status })
    .eq('id', allocationId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a raw phone string to digits-only E.164-ish form for wa.me.
 * Assumes +91 (India) when no country code is present. Returns null when the
 * input clearly isn't a usable number (so callers can hide the WhatsApp link).
 */
export function normalizePhone(raw) {
  if (!raw) return null
  let d = String(raw).replace(/[^\d]/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2) // 00<cc> → <cc>
  if (d.length === 10) d = '91' + d // bare 10-digit Indian mobile
  else if (d.length === 11 && d.startsWith('0')) d = '91' + d.slice(1) // 0XXXXXXXXXX
  if (d.length < 11 || d.length > 15) return null
  return d
}

/** Build the set of contact links available for a POC. */
export function contactLinks({ phone, email } = {}) {
  const wa = normalizePhone(phone)
  const rawPhone = phone ? String(phone).replace(/\s+/g, '') : null
  return {
    tel: rawPhone ? `tel:${rawPhone}` : null,
    whatsapp: wa ? `https://wa.me/${wa}` : null,
    email: email ? `mailto:${email}` : null,
  }
}

const MS_DAY = 86400000

/** Calendar days between a timestamp and now (floored). */
export function daysSince(ts) {
  if (!ts) return Infinity
  return Math.floor((Date.now() - new Date(ts).getTime()) / MS_DAY)
}

/**
 * Classify a scheduled follow-up date relative to today.
 * Returns 'overdue' | 'today' | 'upcoming' | null.
 */
export function followUpState(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  if (d < today) return 'overdue'
  if (d.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

const TERMINAL_STATUSES = ['Denied', 'MOU Signed']
const GOING_COLD_DAYS = 3

/**
 * Build the prioritised member action queue from enriched allocation rows
 * (see fetchMyQueue). Order:
 *   1. Follow-ups due today or overdue
 *   2. "Going cold" — in Follow Up, untouched for 3+ days
 *   3. Untouched allocations (Not Started)
 * Terminal deals (Denied / MOU Signed) are excluded.
 * Each returned row carries a `reason` and a `priority` for rendering.
 */
export function buildCallQueue(rows) {
  const due = []
  const cold = []
  const untouched = []

  for (const r of rows) {
    if (TERMINAL_STATUSES.includes(r.status)) continue
    const fu = followUpState(r.nextFollowUp)

    if (fu === 'overdue' || fu === 'today') {
      due.push({ ...r, reason: fu === 'overdue' ? 'Follow-up overdue' : 'Follow-up due today', followUp: fu, priority: 1 })
    } else if (r.status === 'Follow Up' && daysSince(r.lastCallAt) >= GOING_COLD_DAYS) {
      cold.push({ ...r, reason: `Going cold · ${daysSince(r.lastCallAt)}d since last call`, followUp: fu, priority: 2 })
    } else if (r.status === 'Not Started' || !r.lastCallAt) {
      untouched.push({ ...r, reason: 'Not started yet', followUp: fu, priority: 3 })
    }
  }

  due.sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp))
  cold.sort((a, b) => daysSince(b.lastCallAt) - daysSince(a.lastCallAt))
  untouched.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return [...due, ...cold, ...untouched]
}

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
