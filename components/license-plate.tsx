import { cn } from '@/lib/utils'

type LicensePlateProps = {
  plate: string
  size?: 'sm' | 'lg'
  className?: string
}

export function LicensePlate({ plate, size = 'sm', className }: LicensePlateProps) {
  const isLarge = size === 'lg'

  return (
    <div
      aria-label={`Plaka ${plate}`}
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-md bg-plate text-plate-foreground shadow-[inset_0_0_0_2px_rgba(0,0,0,0.85)]',
        isLarge ? 'h-20 rounded-lg' : 'h-8',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center justify-end bg-plate-stripe text-plate font-sans font-bold leading-none',
          isLarge ? 'w-12 pb-2 text-base' : 'w-6 pb-1 text-[9px]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'mb-auto mt-1.5 block rounded-full border border-current',
            isLarge ? 'size-5 border-2' : 'size-2.5',
          )}
        />
        <span>TR</span>
      </div>
      <div
        className={cn(
          'flex items-center whitespace-nowrap font-mono font-bold tabular-nums',
          isLarge ? 'px-5 text-3xl tracking-[0.1em] sm:px-6 sm:text-5xl' : 'px-2.5 text-sm tracking-[0.12em]',
        )}
      >
        {plate}
      </div>
    </div>
  )
}
