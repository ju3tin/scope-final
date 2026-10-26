'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import SignatureCanvas from 'react-signature-canvas'
import {
  Check,
  Eraser,
  FileText,
  PenLine,
  Loader2,
  Mail,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

type WorkItem = {
  id: number
  name: string
  detail: string
  hours: number
  rate: number
  discount: number
}

type Contract = {
  id: string
  client: string
  project: string
  projectType: string
  contractTitle: string
  items: WorkItem[]
  tax: number
  deposit: number
  currency: string
  total: number
  dueNow: number
  remaining: number
  paymentTerms: string
  contractTerms: string
  recipientEmail?: string
  status: 'draft' | 'sent' | 'signed'
  signerName?: string
  signatureDataUrl?: string
  signedAt?: string
}

export default function SignPage() {
  const { id } = useParams<{ id: string }>()
  const sigRef = useRef<SignatureCanvas>(null)

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [step, setStep] = useState<'verify' | 'sign' | 'done'>('verify')

  const [emailInput, setEmailInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')

  const [signerName, setSignerName] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [signError, setSignError] = useState('')

  useEffect(() => {
    if (!id) return

    fetch(`/api/contracts/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Contract not found')
        }
        return res.json()
      })
      .then((data: Contract) => {
        setContract(data)
        if (data.status === 'signed') {
          setStep('done')
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const money = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: contract?.currency || 'USD',
      maximumFractionDigits: 0,
    }).format(value)

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyError('')
    setVerifying(true)

    const entered = emailInput.trim().toLowerCase()
    const expected = (contract?.recipientEmail || '').trim().toLowerCase()

    setTimeout(() => {
      if (!expected) {
        setVerifyError('This contract has no recipient email on record.')
        setVerifying(false)
        return
      }

      if (entered !== expected) {
        setVerifyError('Email does not match the address this contract was sent to.')
        setVerifying(false)
        return
      }

      setStep('sign')
      setVerifying(false)
    }, 600)
  }

  const clearSignature = () => {
    sigRef.current?.clear()
    setIsEmpty(true)
  }

  const handleEnd = () => {
    setIsEmpty(sigRef.current?.isEmpty() ?? true)
  }

  const handleSign = async () => {
    if (!signerName.trim()) {
      setSignError('Please enter your full legal name')
      return
    }
    if (sigRef.current?.isEmpty()) {
      setSignError('Please draw your signature')
      return
    }

    setSubmitting(true)
    setSignError('')

    try {
      const signatureDataUrl = sigRef.current!.toDataURL('image/png')

      const res = await fetch(`/api/contracts/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signatureDataUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save signature')
      }

      setContract((prev) =>
        prev
          ? {
              ...prev,
              status: 'signed',
              signerName: signerName.trim(),
              signatureDataUrl,
              signedAt: data.signedAt,
            }
          : null
      )
      setStep('done')
    } catch (err: any) {
      setSignError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading contract…</span>
        </div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <FileText className="mb-4 size-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Contract not found</h1>
        <p className="mt-2 max-w-md text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!contract) return null

  if (step === 'done' || contract.status === 'signed') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Check className="size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Document signed</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Signed by <strong className="text-foreground">{contract.signerName}</strong>
          {contract.signedAt && (
            <> on {new Date(contract.signedAt).toLocaleString()}</>
          )}
        </p>

        {contract.signatureDataUrl && (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Signature
            </p>
            <img
              src={contract.signatureDataUrl}
              alt="Digital signature"
              className="mx-auto max-h-24"
            />
          </div>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          A confirmation has been recorded for <strong>{contract.project}</strong>.
        </p>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <main className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-md items-center justify-between px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <PenLine className="size-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                scope<span className="text-primary/50">.</span>
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-md px-5 py-16">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              For security, please enter the email address this contract was sent to
              before you can review and sign.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Contract</p>
              <p className="mt-0.5 font-semibold">{contract.contractTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prepared for {contract.client}
              </p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-5">
              <label className="block text-sm font-semibold">
                Email address
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-input bg-background py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </label>

              {verifyError && (
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {verifyError}
                </p>
              )}

              <button
                type="submit"
                disabled={verifying || !emailInput.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Only the intended recipient can access this document.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PenLine className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              scope<span className="text-primary/50">.</span>
            </span>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            Verified · Ready to sign
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Please review & sign
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {contract.contractTitle}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Prepared for <strong className="text-foreground">{contract.client}</strong> ·{' '}
            {contract.project}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div>
            <h2 className="text-lg font-bold">Scope of work</h2>
            <ul className="mt-4 space-y-3">
              {contract.items.map((item) => (
                <li key={item.id} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <strong className="text-foreground">{item.name}</strong>
                    <span className="mt-0.5 block text-muted-foreground">
                      {item.detail}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-lg font-bold">Fees & payment</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              The total project fee is{' '}
              <strong className="text-foreground">{money(contract.total)}</strong>.
              A {contract.deposit}% deposit of{' '}
              <strong className="text-foreground">{money(contract.dueNow)}</strong> is
              due to begin work. The remaining balance of{' '}
              <strong className="text-foreground">{money(contract.remaining)}</strong>{' '}
              is due upon completion.
            </p>
            {contract.paymentTerms && (
              <p className="mt-4 text-sm text-muted-foreground">{contract.paymentTerms}</p>
            )}
            {contract.contractTerms && (
              <p className="mt-2 text-sm text-muted-foreground">{contract.contractTerms}</p>
            )}
          </div>

          <div className="mt-10 space-y-6 rounded-xl border border-border bg-muted/30 p-6">
            <div>
              <h3 className="text-sm font-bold">Digital Signature</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Draw your signature below, then type your full legal name.
                This constitutes a legally binding electronic signature.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-border bg-white dark:bg-zinc-950">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: 'w-full touch-none',
                  style: { width: '100%', height: '180px' },
                }}
                penColor="#111"
                backgroundColor="rgb(255,255,255)"
                onEnd={handleEnd}
              />
              {!isEmpty && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border bg-background/95 px-2.5 py-1.5 text-xs font-medium shadow-sm transition hover:bg-muted"
                >
                  <Eraser className="size-3.5" />
                  Clear
                </button>
              )}
            </div>

            <label className="block text-sm font-semibold">
              Full legal name
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Type your full name as it should appear"
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
              />
            </label>

            {signError && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {signError}
              </p>
            )}

            <button
              onClick={handleSign}
              disabled={submitting || !signerName.trim() || isEmpty}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing…
                </>
              ) : (
                <>
                  <PenLine className="size-4" />
                  Sign document
                </>
              )}
            </button>

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              By clicking “Sign document” you agree that the signature above is the
              electronic representation of your signature and is legally binding.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
