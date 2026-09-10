// components/admin/admin-login.tsx
'use client'
import { useState, useTransition, type FormEvent } from 'react'
import { Delete, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loginAction } from '@/lib/actions'
import { cn } from '@/lib/utils'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export function AdminLogin({ slug, businessName }: { slug: string; businessName: string }) {
  const [pin, setPin] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function press(k: string) {
    setErrorMessage(null)
    if (k === '') return
    if (k === 'del') { setPin((p) => p.slice(0, -1)); return }
    setPin((p) => (p.length < 4 ? p + k : p))
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) return
    startTransition(async () => {
      try {
        const result = await loginAction(slug, pin)
        if (result.ok) window.location.href = `/admin/${slug}`
        else { setErrorMessage(result.error || 'Hatalı PIN kodu'); setPin('') }
      } catch (err: any) { setErrorMessage(err.message) }
    })
  }

  return (
    <div className="bg-grid flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={handleLogin} className="docket flex w-full max-w-xs flex-col items-center gap-6 p-6">
        <div className="flex size-12 items-center justify-center rounded-xl border border-neon/30 bg-neon/10 text-neon"><Lock className="size-5" /></div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-display text-lg font-bold tracking-tight">{businessName}</h1>
          <p className="text-xs text-muted-foreground">Panele girmek için 4 haneli PIN</p>
        </div>
        <div className="flex items-center gap-3">
          {[0, 1, 2, 3].map((i) => <span key={i} className={cnDot(i < pin.length, errorMessage !== null)} />)}
        </div>
        <input className="sr-only" inputMode="numeric" value={pin} autoFocus onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e as any) }} />
        {errorMessage && <p className="text-center text-xs font-medium text-red-400">{errorMessage}</p>}
        <div className="grid w-full grid-cols-3 gap-2">
          {KEYS.map((k, i) => k === '' ? <span key={i} /> : (
            <button key={i} type="button" onClick={() => press(k)} className="flex h-14 items-center justify-center rounded-lg border border-border bg-background/40 font-mono text-lg font-semibold active:scale-95">
              {k === 'del' ? <Delete className="size-5" /> : k}
            </button>
          ))}
        </div>
        <Button type="submit" disabled={pin.length !== 4 || isPending} className="h-11 w-full bg-neon font-bold text-neon-foreground hover:brightness-110">
          {isPending ? 'Kontrol ediliyor...' : 'Giriş Yap'}
        </Button>
      </form>
    </div>
  )
}

function cnDot(filled: boolean, error: boolean) {
  return `size-3 rounded-full border transition-colors duration-150 ${error ? 'border-red-400 bg-red-400/60' : filled ? 'border-neon bg-neon' : 'border-border bg-transparent'}`
}