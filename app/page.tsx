import { Sparkles } from 'lucide-react'

// Artık müşteriler bu sayfada plaka aramıyor — her müşteri kendi işletmesinden
// aldığı özel linkle (/{isletme}/{plaka}) direkt kendi aracının durumuna gidiyor.
// Admin de kendi paneline direkt /admin/{isletme} linkiyle giriyor (tarayıcıya
// eklediği bir yer imi üzerinden). Bu yüzden bu sayfa artık sadece nötr bir
// karşılama ekranı; hiçbir işlevsel form barındırmıyor.
export default function HomePage() {
  return (
    <main className="bg-grid flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-neon/20 bg-background/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="glow-neon flex size-16 items-center justify-center rounded-2xl bg-neon text-neon-foreground">
          <Sparkles className="size-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Garaj34 Premium</h1>
        <p className="text-sm text-muted-foreground">
          Canlı araç takip ve müşteri yönetim sistemi.
        </p>
      </div>
    </main>
  )
}
