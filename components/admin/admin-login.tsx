'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginAction } from '@/lib/actions'

type AdminLoginProps = {
  slug: string
  businessName: string
}

export function AdminLogin({ slug, businessName }: AdminLoginProps) {
  const [pin, setPin] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const result = await loginAction(slug, pin)
        if (result.ok) {
          window.location.href = `/admin/${slug}`
        } else {
          setErrorMessage(result.error || 'Hatalı PIN kodu')
          setPin('')
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Sunucu bağlantı hatası oluştu')
      }
    })
  }

  return (
    <div className="bg-grid flex min-h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-neon/20 bg-background/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="glow-neon flex size-12 items-center justify-center rounded-xl bg-neon text-neon-foreground">
            <Lock className="size-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">{businessName}</h1>
          <p className="text-sm text-muted-foreground">Panele erişmek için 4 haneli PIN kodunu girin.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={`h-14 text-center text-2xl tracking-[1em] ${errorMessage ? 'border-red-500 bg-red-500/10' : 'bg-input/40'}`}
            autoFocus
          />
          {errorMessage && (
            <p className="text-center text-xs font-medium text-red-500">{errorMessage}</p>
          )}

          <Button
            type="submit"
            disabled={isPending || pin.length === 0}
            className="glow-neon h-12 w-full bg-neon text-base font-bold text-neon-foreground hover:brightness-110"
          >
            {isPending ? 'Kontrol ediliyor...' : <>Giriş Yap <ArrowRight className="ml-2 size-5" /></>}
          </Button>
        </form>
      </div>
    </div>
  )
}