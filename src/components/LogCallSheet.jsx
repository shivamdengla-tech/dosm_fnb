import { useState } from 'react'
import { PhoneCall } from 'lucide-react'
import { logCall } from '../lib/data'
import { STATUS_LABELS, DEFAULT_STATUS } from '../constants'
import { useToast } from '../contexts/ToastContext'
import {
  Modal,
  Field,
  Select,
  Textarea,
  Input,
  Button,
  StatusBadge,
  FestBadge,
  ContactLinks,
} from './ui'

/**
 * Fast "log a call outcome" sheet — opens over any page so a member can record
 * an outcome (+ optional next follow-up) in two taps. Optimistically updates
 * the parent via `onLogged`, then persists; `onError` lets the parent reload
 * if the write fails.
 *
 * allocation: { allocationId, memberId, name, category, fest, festTag, status,
 *               pocName, pocNumber, pocEmail }
 *
 * Seeded from `allocation` on mount — render with a `key` that changes per open
 * (e.g. allocationId + callCount) so the form re-seeds for each new call.
 */
export default function LogCallSheet({ open, onClose, allocation, onLogged, onError }) {
  const toast = useToast()
  const [status, setStatus] = useState(allocation?.status || DEFAULT_STATUS)
  const [notes, setNotes] = useState('')
  const [nextFollowUp, setNextFollowUp] = useState('')

  if (!allocation) return null

  async function submit(e) {
    e.preventDefault()
    const update = { status, nextFollowUp: nextFollowUp || null }
    // Optimistic: update the parent and close immediately.
    onLogged?.(update)
    onClose()
    toast.success(`Logged ${allocation.name} → ${status}`)
    try {
      await logCall({
        allocationId: allocation.allocationId,
        memberId: allocation.memberId,
        status,
        notes,
        nextFollowUp: nextFollowUp || null,
      })
    } catch (err) {
      toast.error(`Couldn't save: ${err.message}`)
      onError?.(err)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log a call">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white/[0.03] p-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{allocation.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <FestBadge fest={allocation.fest || allocation.festTag} />
              <span className="text-xs text-muted">{allocation.category}</span>
            </div>
          </div>
          <ContactLinks
            phone={allocation.pocNumber}
            email={allocation.pocEmail}
            name={allocation.pocName}
          />
        </div>

        <Field label="Outcome / pipeline status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} autoFocus>
            {STATUS_LABELS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <span className="mt-2 block">
            <StatusBadge status={status} />
          </span>
        </Field>

        <Field label="Next follow-up (optional)">
          <Input
            type="date"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
          />
        </Field>

        <Field label="Notes (optional)">
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happened on this call?"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            <PhoneCall size={16} /> Log call
          </Button>
        </div>
      </form>
    </Modal>
  )
}
