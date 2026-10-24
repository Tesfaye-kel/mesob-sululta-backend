import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ShieldAlert } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface VerifiedReceipt {
  receiptNumber: string
  serviceId?: { name?: { en?: string } } | null
  officeId?: { name?: { en?: string } } | null
  floorId?: { floorNumber?: number } | null
  windowId?: { number?: string | number } | null
  employeeId?: { name?: string } | null
  issuedAt: string
}

export default function ReceiptVerificationPage() {
  const [searchParams] = useSearchParams()
  const receiptNumber = searchParams.get('number') || ''
  const [receipt, setReceipt] = useState<VerifiedReceipt | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setReceipt(null)
    setError('')
    if (!/^MSB-R-[A-F\d]{24}$/.test(receiptNumber)) {
      setError('The receipt number is missing or invalid.')
      return
    }
    const controller = new AbortController()
    fetch(`${BASE}/receipts/verify/${encodeURIComponent(receiptNumber)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
        if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
        if (!data || data.valid !== true || !data.receipt ||
            typeof data.receipt.receiptNumber !== 'string' ||
            typeof data.receipt.issuedAt !== 'string') {
          throw new Error('The verification service returned an invalid receipt record.')
        }
        return data as { valid: true; receipt: VerifiedReceipt }
      })
      .then((data) => setReceipt(data.receipt))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Receipt verification failed.')
      })
    return () => controller.abort()
  }, [receiptNumber])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {receipt ? (
          <>
            <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verified service receipt</h1>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-slate-500">Receipt number</dt><dd className="font-semibold">{receipt.receiptNumber}</dd></div>
              <div><dt className="text-slate-500">Service</dt><dd>{receipt.serviceId?.name?.en || '—'}</dd></div>
              <div><dt className="text-slate-500">Office</dt><dd>{receipt.officeId?.name?.en || '—'}</dd></div>
              <div><dt className="text-slate-500">Floor / Window</dt><dd>{receipt.floorId?.floorNumber ?? '—'} / {receipt.windowId?.number ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Employee</dt><dd>{receipt.employeeId?.name || '—'}</dd></div>
              <div><dt className="text-slate-500">Issued</dt><dd>{new Date(receipt.issuedAt).toLocaleString()}</dd></div>
            </dl>
          </>
        ) : error ? (
          <>
            <ShieldAlert className="mb-4 h-10 w-10 text-red-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Receipt not verified</h1>
            <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>
          </>
        ) : <p className="text-sm text-slate-500">Verifying receipt…</p>}
        <Link to="/" className="mt-6 inline-block text-sm text-emerald-700 underline dark:text-emerald-300">Return to public website</Link>
      </section>
    </main>
  )
}
