'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Smartphone, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NewJobForm } from '@/components/admin/new-job-form'
import { ActiveJobs } from '@/components/admin/active-jobs'
import { CustomerDatabase } from '@/components/admin/customer-database'

// Satış yapacağın dükkana özel belirleyeceğin şifre
const CORRECT_PIN = '3434'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Esnaf her girdiğinde şifre sormasın diye tarayıcı hafızasını kontrol ediyoruz
  useEffect(() => {
    const saved = localStorage.getItem('garaj34_admin_auth')
    if (saved === 'true') {
      setIsAuthenticated(true)
    }
    setIsChecking(false)
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true)
      localStorage.setItem('garaj34_admin_auth', 'true')
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  // Sayfa ilk yüklenirken titreme olmaması için boş ekran
  if (isChecking) return <div className="bg-grid min-h-dvh" />

  // Şifre girilmediyse Kilit Ekranını göster
  if (!isAuthenticated) {
    return (
      <div className="bg-grid flex min-h-dvh items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-neon/20 bg-background/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="glow-neon flex size-12 items-center justify-center rounded-xl bg-neon text-neon-foreground">
              <Lock className="size-6" />
            </div>
            <h1 className="mt-4 text-xl font-bold tracking-tight">Yönetici Girişi</h1>
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
              className={`h-14 text-center text-2xl tracking-[1em] ${error ? 'border-red-500 bg-red-500/10' : 'bg-input/40'}`}
              autoFocus
            />
            {error && <p className="text-center text-xs font-medium text-red-500">Hatalı PIN kodu, lütfen tekrar deneyin.</p>}
            
            <Button type="submit" className="glow-neon h-12 w-full bg-neon text-base font-bold text-neon-foreground hover:bg-neon hover:brightness-110">
              Giriş Yap <ArrowRight className="ml-2 size-5" />
            </Button>
          </form>
          
          <Link href="/" className="text-center text-xs text-muted-foreground hover:text-foreground hover:underline">
            Müşteri Ekranına Dön
          </Link>
        </div>
      </div>
    )
  }

  // Şifre doğruysa asıl Yönetim Panelini göster
  return (
    <div className="bg-grid min-h-dvh">
      <header className="glass sticky top-0 z-10 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="glow-neon flex size-10 shrink-0 items-center justify-center rounded-lg bg-neon text-neon-foreground">
              <Sparkles className="size-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-tight tracking-tight sm:text-lg">Garaj34 Yönetim Paneli</h1>
              <p className="text-[10px] text-muted-foreground sm:text-xs">Premium Detaylama Sistemi</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem('garaj34_admin_auth')
                setIsAuthenticated(false)
              }}
              className="text-muted-foreground hover:text-red-400"
            >
              Çıkış
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-cyan/40 text-cyan hover:bg-cyan/10 hover:text-cyan"
              render={<Link href="/" />}
            >
              <Smartphone className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Müşteri Ekranı</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_380px] lg:py-8">
        <div className="flex flex-col gap-6">
          <NewJobForm />
          <ActiveJobs />
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CustomerDatabase />
        </div>
      </main>
    </div>
  )
}