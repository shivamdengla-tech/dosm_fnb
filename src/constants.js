// ---------------------------------------------------------------------------
// Single source of truth for pipeline statuses, fests, and brand categories.
// ---------------------------------------------------------------------------

/**
 * Pipeline statuses, in pipeline order. `label` is the value stored in the DB
 * (allocations.status / call_logs.status). `color` drives badges + charts.
 */
export const STATUSES = [
  { key: 'not_started', label: 'Not Started', color: '#6b7280' }, // grey
  { key: 'first_call', label: 'First Call Done', color: '#3b82f6' }, // blue
  { key: 'follow_up', label: 'Follow Up', color: '#f59e0b' }, // amber
  { key: 'unresponsive', label: 'Unresponsive', color: '#f97316' }, // orange
  { key: 'denied', label: 'Denied', color: '#ef4444' }, // red
  { key: 'confirmed', label: 'Confirmed', color: '#22c55e' }, // green
  { key: 'mou_sent', label: 'MOU Sent', color: '#a855f7' }, // purple
  { key: 'mou_signed', label: 'MOU Signed', color: '#15803d' }, // dark green
]

export const STATUS_LABELS = STATUSES.map((s) => s.label)

export const DEFAULT_STATUS = 'Not Started'

const STATUS_BY_LABEL = Object.fromEntries(STATUSES.map((s) => [s.label, s]))

/** Look up a status descriptor by its label; falls back to "Not Started". */
export function getStatus(label) {
  return STATUS_BY_LABEL[label] || STATUS_BY_LABEL[DEFAULT_STATUS]
}

/** Statuses that count as "the brand has been contacted at least once". */
export const CONTACTED_STATUSES = STATUS_LABELS.filter(
  (l) => l !== 'Not Started',
)

// ---------------------------------------------------------------------------

export const FESTS = ['Waves', 'Quark', 'Spree']

export const FEST_META = {
  Waves: { label: 'Waves', sub: 'Cultural', color: '#0ea5e9' },
  Quark: { label: 'Quark', sub: 'Tech', color: '#8b5cf6' },
  Spree: { label: 'Spree', sub: 'Sports', color: '#f97316' },
  All: { label: 'All', sub: 'Any fest', color: '#6b7280' },
}

// ---------------------------------------------------------------------------

/** The 20 brand categories present in brands.csv. */
export const CATEGORIES = [
  'Water',
  'Soft Drinks & Sodas',
  'Juices & Fruit Drinks',
  'Healthy / Functional Drinks',
  'Energy Drinks',
  'Tea & Coffee',
  'Dairy & Cheese',
  'Ice Cream & Frozen Desserts',
  'Chips & Wafers',
  'Namkeen & Traditional Snacks',
  'Popcorn',
  'Makhana',
  'Healthy Snacking',
  'Cookies & Biscuits',
  'Chocolates & Confectionery',
  'Mouth Fresheners & Candy',
  'Noodles & Instant Food',
  'Sauces & Condiments',
  'Protein & Nutrition',
  'Other / Misc',
]

/**
 * Brands in these categories may ONLY be allocated to the Spree (sports) fest.
 * Enforced in the Allocations page.
 */
export const SPREE_ONLY_CATEGORIES = [
  'Healthy Snacking',
  'Makhana',
  'Protein & Nutrition',
]

export function isSpreeOnly(category) {
  return SPREE_ONLY_CATEGORIES.includes(category)
}

export const APP_NAME = 'DOSM FnB'
export const APP_SUBTITLE = 'BITS Goa Fest Team'
export const FOOTER_TEXT =
  'Made with ♥ by Shivam Dengla — FnB Coordinator, DOSM'
