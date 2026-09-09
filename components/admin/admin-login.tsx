'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction } from '@/lib/actions'

type AdminLoginProps = {
  slug: string
  businessName: string
}

export function AdminLogin({ slug, businessName }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    startTransition(async () => {
      try {
        const result = await loginAction(slug, email, password)
        if (result.ok) {
          window.location.href = `/admin/${slug}`
        } else {
          setErrorMessage(result.error || 'Geçersiz giriş bilgileri')
        }
      } catch (err) {
        setErrorMessage('Sunucu bağlantı hatası oluştu')
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
          <p className="text-sm text-muted-foreground">Panele erişmek için hesap bilgilerinizi girin.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-2">
            <Label>E-posta Adresi</Label>
            <Input 
              type="email" 
              placeholder="admin@garaj34.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="h-12 bg-input/40" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Şifre</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="h-12 bg-input/40" 
            />
          </div>
          
          {errorMessage && <p className="text-center text-xs font-medium text-red-500">{errorMessage}</p>}

          <Button type="submit" disabled={isPending} className="glow-neon h-12 w-full mt-2 bg-neon text-base font-bold text-neon-foreground hover:brightness-110">
            {isPending ? 'Kontrol ediliyor...' : <>Giriş Yap <ArrowRight className="ml-2 size-5" /></>}
          </Button>
        </form>
      </div>
    </div>
  )
}