'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  X,
  Zap,
} from 'lucide-react'

type Contract = {
  id: string
  client: string
  project: string
  contractTitle: string
  recipientEmail?: string
  status: 'draft' | 'sent' | 'signed'
  total: number
  currency: string
  signedAt?: string
  signerName?: string
  createdAt: string
  followUp?: { note: string; dueDate?: string; completed: boolean }
}

const statusCopy = {
  signed: { label: 'Signed', icon: CheckCircle2 },
  sent: { label: 'Awaiting signature', icon: Clock3 },
  draft: { label: 'Draft', icon: FileText },
}

export default function AdminDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'signed' | 'follow-up'>('all')
  const [selected, setSelected] = useState<Contract | null>(null)
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const loadContracts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/contracts', { cache: 'no-store' })
      if (!response.ok) throw new Error('Unable to load contracts')
      setContracts(await response.json())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load contracts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadContracts() }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const followUps = contracts.filter((contract) => contract.followUp && !contract.followUp.completed)
  const signed = contracts.filter((contract) => contract.status === 'signed')
  const filteredContracts = useMemo(() => contracts.filter((contract) => {
    const matchesQuery = `${contract.client} ${contract.project} ${contract.recipientEmail ?? ''}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'signed' ? contract.status === 'signed' : Boolean(contract.followUp && !contract.followUp.completed))
    return matchesQuery && matchesFilter
  }), [contracts, filter, query])

  const openFollowUp = (contract: Contract) => {
    setSelected(contract)
    setNote(contract.followUp?.note ?? '')
    setDueDate(contract.followUp?.dueDate ? contract.followUp.dueDate.slice(0, 10) : '')
  }

  const saveFollowUp = async () => {
    if (!selected || !note.trim()) return
    setSaving(true)
    try {
      const response = await fetch(`/api/contracts/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUp: { note: note.trim(), dueDate: dueDate || undefined, completed: false } }),
      })
      if (!response.ok) throw new Error('Unable to save follow-up')
      const updated = await response.json()
      setContracts((current) => current.map((contract) => contract.id === updated.id ? updated : contract))
      setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save follow-up')
    } finally {
      setSaving(false)
    }
  }

  const completeFollowUp = async (contract: Contract) => {
    if (!contract.followUp) return
    const response = await fetch(`/api/contracts/${contract.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followUp: { ...contract.followUp, completed: true } }),
    })
    if (response.ok) {
      const updated = await response.json()
      setContracts((current) => current.map((item) => item.id === updated.id ? updated : item))
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="Back to Scope estimate builder">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Zap className="size-4 fill-current" /></span>
            <span className="text-lg font-bold tracking-tight">scope<span className="text-primary/50">.</span></span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="hidden sm:inline">Admin workspace</span><button onClick={loadContracts} className="rounded-full border border-border bg-card p-2 text-foreground transition hover:bg-muted" aria-label="Refresh contracts"><RefreshCw className="size-4" /></button></div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-8 lg:px-10 lg:py-12">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Operations</p><h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Know what needs attention.</h1><p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">See who has signed, who is still waiting, and keep every client follow-up in one place.</p></div>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"><Plus className="size-4" /> New estimate</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Total contracts" value={contracts.length} icon={FileText} />
          <Metric label="Signed" value={signed.length} icon={CheckCircle2} />
          <Metric label="Follow-ups due" value={followUps.length} icon={AlertCircle} />
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
            <div><h2 className="text-lg font-bold">Client contracts</h2><p className="mt-1 text-sm text-muted-foreground">Manage signature status and next actions.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Search contracts</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients" className="field mt-0 h-10 pl-9 sm:w-56" /></label>
              <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="field mt-0 h-10 sm:w-44"><option value="all">All contracts</option><option value="signed">Signed only</option><option value="follow-up">Follow-ups</option></select>
            </div>
          </div>
          {error && <div className="mx-5 mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
          {loading ? <div className="flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading contracts…</div> : filteredContracts.length === 0 ? <div className="p-16 text-center"><FileText className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No contracts found</p><p className="mt-1 text-sm text-muted-foreground">Send a contract from the estimate builder to see it here.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground"><th className="px-6 py-4 font-bold">Client</th><th className="px-4 py-4 font-bold">Project</th><th className="px-4 py-4 font-bold">Status</th><th className="px-4 py-4 font-bold">Last activity</th><th className="px-6 py-4 text-right font-bold">Action</th></tr></thead><tbody>{filteredContracts.map((contract) => <ContractRow key={contract.id} contract={contract} onFollowUp={openFollowUp} onComplete={completeFollowUp} />)}</tbody></table></div>}
        </section>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 sm:items-center"><div role="dialog" aria-modal="true" aria-labelledby="follow-up-title" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Next action</p><h2 id="follow-up-title" className="mt-1 text-xl font-bold">Follow up with {selected.client}</h2></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Close"><X className="size-4" /></button></div><div className="mt-6 flex flex-col gap-4"><label className="text-sm font-semibold">What needs to happen?<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Check in about the signed agreement" className="field mt-1.5 min-h-24 py-3" /></label><label className="text-sm font-semibold">Due date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field" /></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={() => setSelected(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted">Cancel</button><button onClick={saveFollowUp} disabled={saving || !note.trim()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">{saving && <Loader2 className="size-4 animate-spin" />} Save follow-up</button></div></div></div>}
    </main>
  )
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">{label}</p><Icon className="size-5 text-primary" /></div><p className="mt-4 text-3xl font-bold tracking-tight">{value}</p></div> }

function ContractRow({ contract, onFollowUp, onComplete }: { contract: Contract; onFollowUp: (contract: Contract) => void; onComplete: (contract: Contract) => void }) {
  const status = statusCopy[contract.status]
  const Icon = status.icon
  const date = contract.signedAt ?? contract.createdAt
  return <tr className="border-b border-border last:border-0"><td className="px-6 py-5"><div className="font-bold">{contract.client}</div><div className="mt-1 text-xs text-muted-foreground">{contract.recipientEmail || 'No email'}</div></td><td className="px-4 py-5"><div className="font-medium">{contract.project}</div><div className="mt-1 text-xs text-muted-foreground">{contract.contractTitle}</div></td><td className="px-4 py-5"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${contract.status === 'signed' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}><Icon className="size-3.5" />{status.label}</span>{contract.followUp && !contract.followUp.completed && <span className="mt-2 block text-xs font-semibold text-destructive">Follow-up {contract.followUp.dueDate ? `· due ${new Date(contract.followUp.dueDate).toLocaleDateString()}` : '· no date'}</span>}</td><td className="px-4 py-5 text-muted-foreground">{new Date(date).toLocaleDateString()}</td><td className="px-6 py-5 text-right"><div className="flex justify-end gap-2">{contract.followUp && !contract.followUp.completed && <button onClick={() => onComplete(contract)} className="rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted">Done</button>}<button onClick={() => onFollowUp(contract)} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground hover:bg-muted"><Send className="size-3.5" /> {contract.followUp ? 'Edit follow-up' : 'Add follow-up'}</button></div></td></tr>
}
