'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Search, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { plateToSlug } from '@/lib/jobs-store'

export default function HomePage() {
  const [searchPlate, setSearchPlate] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchPlate.trim()) {
      // Plakayı slug formatına çevirip o araca özel sayfaya yönlendirir
      router.push(`/${plateToSlug(searchPlate)}`)
    }
  }

  return (
    <main className="bg-grid flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-2xl border border-neon/20 bg-background/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="glow-neon flex size-16 items-center justify-center rounded-2xl bg-neon text-neon-foreground">
            <Sparkles className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Garaj34 Premium</h1>
          <p className="text-sm text-muted-foreground">
            Aracınızın anlık durumunu öğrenmek için plakanızı girin.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full flex-col gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
              <Car className="size-5" />
            </div>
            <Input
              type="text"
              placeholder="Örn: 34 ABC 123"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
              className="h-14 bg-input/40 pl-12 text-center font-mono text-lg uppercase tracking-widest"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!searchPlate.trim()} 
            className="glow-neon h-12 w-full bg-neon text-base font-bold text-neon-foreground hover:bg-neon hover:brightness-110"
          >
            <Search className="mr-2 size-5" />
            Durumu Sorgula
          </Button>
        </form>
      </div>

      {/* Esnaf için gizli Admin paneli girişi (sadece bilen tıklar) */}
      <div className="fixed bottom-6 text-center">
         <button 
           onClick={() => router.push('/admin')}
           className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground"
         >
           Sistem Yönetimi
         </button>
      </div>
    </main>
  )
}