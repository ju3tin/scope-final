'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Download, FileText, Plus, Trash2, Zap, Loader2 } from 'lucide-react'

type WorkItem = {
  id: number
  name: string
  detail: string
  hours: number
  rate: number
  discount: number
}

const starterItems: WorkItem[] = [
  { id: 1, name: 'Discovery & planning', detail: 'Requirements, sitemap, technical plan', hours: 6, rate: 125, discount: 0 },
  { id: 2, name: 'UI / UX design', detail: 'Wireframes, visual direction, responsive layouts', hours: 12, rate: 125, discount: 0 },
  { id: 3, name: 'Frontend development', detail: 'Production-ready interface and interactions', hours: 28, rate: 135, discount: 0 },
  { id: 4, name: 'Backend & integrations', detail: 'APIs, CMS, auth, payments, or data layer', hours: 18, rate: 145, discount: 0 },
  { id: 5, name: 'QA & launch', detail: 'Testing, polish, deployment, handoff', hours: 8, rate: 110, discount: 0 },
]

export default function Page() {
  const [client, setClient] = useState('Acme Studio')
  const [project, setProject] = useState('Acme Studio website')
  const [projectType, setProjectType] = useState('Website')
  const [currency, setCurrency] = useState('USD')
  const [items, setItems] = useState<WorkItem[]>(starterItems)
  const [tax, setTax] = useState(0)
  const [deposit, setDeposit] = useState(50)
  const [copied, setCopied] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)
  const [contractCopied, setContractCopied] = useState(false)
  const [contractTitle, setContractTitle] = useState('Project services agreement')
  const [contractTerms, setContractTerms] = useState('Work outside this scope will be discussed and quoted separately before it begins.')
  const [paymentTerms, setPaymentTerms] = useState('The remaining balance is due upon completion.')
  const [recipientEmail, setRecipientEmail] = useState('client@example.com')
  const [signatureStatus, setSignatureStatus] = useState<'draft' | 'sent'>('draft')
  const [emailMode, setEmailMode] = useState<'draft' | 'gmail'>('draft')
  const [sending, setSending] = useState(false)

  const money = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + item.hours * item.rate * (1 - Math.min(100, Math.max(0, item.discount)) / 100),
        0
      ),
    [items]
  )
  const total = subtotal * (1 + tax / 100)
  const dueNow = total * (deposit / 100)
  const remaining = total - dueNow

  const updateItem = (id: number, field: keyof WorkItem, value: string | number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'name' || field === 'detail' ? value : Number(value) }
          : item
      )
    )
  }

  const addItem = () =>
    setItems((current) => [
      ...current,
      { id: Date.now(), name: 'New work item', detail: 'Describe the work included', hours: 4, rate: 125, discount: 0 },
    ])

  const removeItem = (id: number) => setItems((current) => current.filter((item) => item.id !== id))

  const copyQuote = async () => {
    await navigator.clipboard?.writeText(
      `${project}\nPrepared for ${client}\nTotal estimate: ${money(total)}\nDeposit due: ${money(dueNow)}\nRemaining: ${money(remaining)}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const copyContract = async () => {
    await navigator.clipboard?.writeText(
      `PROJECT SERVICES AGREEMENT\n\nThis agreement is between ${client} and the developer for ${project}.\n\nSCOPE OF WORK\n${items
        .map((item) => `• ${item.name}: ${item.detail}`)
        .join('\n')}\n\nFEES\nThe total project fee is ${money(total)}. ${money(
        dueNow
      )} is due to begin work, with the remaining ${money(remaining)} due upon completion.\n\n${paymentTerms}\n\nThe client approves the scope and estimate above. ${contractTerms}`
    )
    setContractCopied(true)
    setTimeout(() => setContractCopied(false), 1800)
  }

  const sendForSignature = async () => {
    if (!recipientEmail.trim()) return

    setSending(true)

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          project,
          projectType,
          contractTitle,
          items,
          tax,
          deposit,
          currency,
          total,
          dueNow,
          remaining,
          paymentTerms,
          contractTerms,
          recipientEmail: recipientEmail.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create contract')
      }

      const { id } = await res.json()
      const signingLink = `${window.location.origin}/sign/${id}`

      const subject = `${contractTitle} — ${project}`
      const body = `Hi ${client},

Please review and sign the project services agreement for ${project}.

Secure signing link:
${signingLink}

You will be asked to verify your email address before signing.

Project total: ${money(total)}
Deposit due now (${deposit}%): ${money(dueNow)}
Remaining balance: ${money(remaining)}

Thank you!`

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        recipientEmail
      )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

      window.open(gmailUrl, '_blank', 'noopener,noreferrer')
      setEmailMode('gmail')
      setSignatureStatus('sent')
    } catch (err: any) {
      alert(err.message || 'Something went wrong creating the contract')
    } finally {
      setSending(false)
    }
  }

  const printContract = () => {
    if (!contractOpen) {
      setContractOpen(true)
      window.setTimeout(() => window.print(), 100)
      return
    }
    window.print()
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="size-4 fill-current" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              scope<span className="text-primary/50">.</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Estimate workspace</span>
            <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground">
              Draft · just now
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-8 lg:px-10 lg:py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">New estimate</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Make the work <span className="text-primary">easy to understand.</span>
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Build a clear, client-ready estimate from the work you actually do. No mystery math, no awkward surprises.
          </p>
        </div>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="space-y-7">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Project details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">The basics your client will see.</p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">01 / 03</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold">
                  Client or company
                  <input value={client} onChange={(e) => setClient(e.target.value)} className="field" />
                </label>
                <label className="space-y-2 text-sm font-semibold">
                  Project name
                  <input value={project} onChange={(e) => setProject(e.target.value)} className="field" />
                </label>
                <label className="space-y-2 text-sm font-semibold">
                  Work type
                  <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="field">
                    <option>Website</option>
                    <option>Native app</option>
                    <option>Software product</option>
                    <option>Maintenance</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold">
                  Estimate valid for
                  <select className="field" defaultValue="30 days">
                    <option>30 days</option>
                    <option>14 days</option>
                    <option>60 days</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Client contract</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Turn this estimate into a simple services agreement.
                  </p>
                </div>
                <button
                  onClick={() => setContractOpen((open) => !open)}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-bold text-secondary-foreground transition hover:bg-muted"
                >
                  <FileText className="size-4" />
                  {contractOpen ? 'Hide contract' : 'Build contract'}
                </button>
              </div>

              {contractOpen && (
                <div className="contract-card mt-6 rounded-xl border border-border bg-background p-5 sm:p-6">
                  <div className="contract-worksheet mb-7">
                    <div className="flex items-end justify-between border-b-2 border-foreground pb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          Work breakdown worksheet
                        </p>
                        <h4 className="mt-1 text-lg font-bold">Scope, hours & fees</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{project}</p>
                    </div>
                    <table className="mt-4 w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <th className="py-2 pr-3">Work item</th>
                          <th className="px-2 py-2 text-right">Hours</th>
                          <th className="px-2 py-2 text-right">Rate</th>
                          <th className="px-2 py-2 text-right">Discount</th>
                          <th className="py-2 pl-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={`worksheet-${item.id}`} className="border-b border-border">
                            <td className="py-3 pr-3">
                              <strong className="text-foreground">{item.name}</strong>
                              <span className="mt-0.5 block text-muted-foreground">{item.detail}</span>
                            </td>
                            <td className="px-2 py-3 text-right">{item.hours}</td>
                            <td className="px-2 py-3 text-right">{money(item.rate)}</td>
                            <td className="px-2 py-3 text-right">{item.discount}%</td>
                            <td className="py-3 pl-2 text-right font-bold">
                              {money(
                                item.hours *
                                  item.rate *
                                  (1 - Math.min(100, Math.max(0, item.discount)) / 100)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} className="pt-4 text-right font-bold">
                            Total project fee
                          </td>
                          <td className="pt-4 text-right text-base font-bold">{money(total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <input
                        aria-label="Contract title"
                        value={contractTitle}
                        onChange={(e) => setContractTitle(e.target.value)}
                        className="w-full bg-transparent text-[10px] font-bold uppercase tracking-[0.18em] text-primary outline-none"
                      />
                      <h3 className="mt-2 text-xl font-bold">{project}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Between {client} and the developer</p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                      Draft
                    </span>
                  </div>

                  <div className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-bold">Scope of work</p>
                      <ul className="mt-2 flex flex-col gap-2 text-muted-foreground">
                        {items.map((item) => (
                          <li key={item.id} className="flex gap-2">
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span>
                              <strong className="text-foreground">{item.name}</strong> — {item.detail}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold">Fees & payment</p>
                      <p className="mt-2 leading-6 text-muted-foreground">
                        The total project fee is <strong className="text-foreground">{money(total)}</strong>. A{' '}
                        {deposit}% deposit of <strong className="text-foreground">{money(dueNow)}</strong> is due
                        to begin work. The remaining balance of{' '}
                        <strong className="text-foreground">{money(remaining)}</strong> is due upon completion.
                      </p>
                      <textarea
                        aria-label="Additional contract terms"
                        value={contractTerms}
                        onChange={(e) => setContractTerms(e.target.value)}
                        className="mt-4 min-h-20 w-full rounded-lg border border-input bg-background p-2 leading-6 text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                      />
                      <textarea
                        aria-label="Payment terms"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="mt-3 min-h-16 w-full rounded-lg border border-input bg-background p-2 leading-6 text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </div>

                  <div className="mt-12 border-t border-border pt-10">
                    <div className="mb-8">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Acceptance & Signatures
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        By signing below, both parties agree to the scope of work, fees, payment terms, and
                        conditions outlined in this agreement. Work will commence upon receipt of the deposit.
                      </p>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Client
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{client}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="h-16 border-b border-foreground/30" />
                          <div className="flex justify-between pt-1.5 text-[11px] text-muted-foreground">
                            <span>Signature</span>
                            <span>Date</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-8 border-b border-foreground/20" />
                          <p className="pt-1.5 text-[11px] text-muted-foreground">Printed name</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Service Provider
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">Developer</p>
                        </div>
                        <div className="space-y-1">
                          <div className="h-16 border-b border-foreground/30" />
                          <div className="flex justify-between pt-1.5 text-[11px] text-muted-foreground">
                            <span>Signature</span>
                            <span>Date</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-8 border-b border-foreground/20" />
                          <p className="pt-1.5 text-[11px] text-muted-foreground">Printed name</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
                    <button
                      onClick={copyContract}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold transition hover:bg-secondary"
                    >
                      <Copy className="size-4" />
                      {contractCopied ? 'Contract copied!' : 'Copy contract'}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                    >
                      <Download className="size-4" />
                      Print contract
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Send for signature</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Email the contract for client review and signing.
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  {signatureStatus === 'sent' ? 'Sent' : 'Ready'}
                </span>
              </div>

              <div className="mt-5 max-w-xl">
                <label className="space-y-2 text-sm font-semibold">
                  Client email
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value)
                      setSignatureStatus('draft')
                    }}
                    className="field"
                    placeholder="client@company.com"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={sendForSignature}
                  disabled={!recipientEmail.trim() || sending}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating…
                    </>
                  ) : signatureStatus === 'sent' ? (
                    'Send again'
                  ) : (
                    'Send contract link'
                  )}
                </button>
                <span className="text-xs font-semibold text-muted-foreground">
                  {emailMode === 'gmail'
                    ? 'Gmail draft opened with signing link'
                    : 'Opens a Gmail draft for you to send'}
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Your client receives one email with a secure signing link. They will verify their email, then
                draw their signature. The signed contract is saved automatically.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">Work breakdown</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add the work, time, and rate behind this estimate.
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  {items.length} items
                </span>
              </div>

              <div className="hidden grid-cols-[1fr_75px_100px_90px_110px_28px] gap-4 border-b border-border pb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground sm:grid">
                <span>Work item</span>
                <span>Hours</span>
                <span>Rate / hr</span>
                <span>Discount</span>
                <span className="text-right">Amount</span>
                <span />
              </div>

              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 py-5 sm:grid-cols-[1fr_75px_100px_90px_110px_28px] sm:items-center sm:gap-4"
                  >
                    <div className="min-w-0">
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="w-full bg-transparent text-sm font-bold outline-none focus:text-primary"
                      />
                      <input
                        value={item.detail}
                        onChange={(e) => updateItem(item.id, 'detail', e.target.value)}
                        className="mt-1 w-full bg-transparent text-xs text-muted-foreground outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground sm:block">
                      <span className="sm:hidden">Hours</span>
                      <input
                        type="number"
                        min="0"
                        value={item.hours}
                        onChange={(e) => updateItem(item.id, 'hours', e.target.value)}
                        className="compact-field"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground sm:block">
                      <span className="sm:hidden">Rate</span>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-muted-foreground">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                          className="compact-field pl-7"
                        />
                      </div>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground sm:block">
                      <span className="sm:hidden">Discount</span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                          className="compact-field pr-7"
                        />
                        <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted-foreground">
                          %
                        </span>
                      </div>
                    </label>
                    <div className="text-left text-sm font-bold sm:text-right">
                      {money(
                        item.hours * item.rate * (1 - Math.min(100, Math.max(0, item.discount)) / 100)
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addItem}
                className="mt-3 flex items-center gap-2 text-sm font-bold text-primary transition hover:opacity-70"
              >
                <Plus className="size-4" />
                Add work item
              </button>
            </div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <div className="p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/60">
                    Client estimate
                  </p>
                  <span className="rounded-full bg-primary-foreground/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {projectType}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-bold tracking-tight">{project}</h2>
                <p className="mt-1 text-sm text-primary-foreground/65">Prepared for {client}</p>
                <div className="mt-10">
                  <p className="text-sm text-primary-foreground/65">Estimated total</p>
                  <p className="mt-1 text-5xl font-bold tracking-[-0.06em]">{money(total)}</p>
                </div>
              </div>
              <div className="border-t border-primary-foreground/15 px-6 py-5 sm:px-7">
                <div className="flex justify-between text-sm">
                  <span className="text-primary-foreground/65">Deposit due ({deposit}%)</span>
                  <span className="font-bold">{money(dueNow)}</span>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-primary-foreground/65">Remaining balance</span>
                  <span className="font-bold">{money(remaining)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-bold">Payment settings</h3>
              <div className="mt-5 space-y-5">
                <label className="block text-xs font-bold text-muted-foreground">
                  CURRENCY
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="field mt-2"
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                  </select>
                </label>
                <label className="block text-xs font-bold text-muted-foreground">
                  TAX / BUFFER
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value))}
                      className="compact-field"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </label>
                <label className="block text-xs font-bold text-muted-foreground">
                  DEPOSIT
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={deposit}
                      onChange={(e) => setDeposit(Number(e.target.value))}
                      className="compact-field"
                    />
                    <span className="text-sm text-muted-foreground">% upfront</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyQuote}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold transition hover:bg-secondary"
              >
                <Copy className="size-4" />
                {copied ? 'Copied!' : 'Copy quote'}
              </button>
              <button
                onClick={printContract}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                <Download className="size-4" />
                PDF contract
              </button>
            </div>

            <p className="text-center text-xs leading-5 text-muted-foreground">
              Share a clear scope, then get back to building.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
