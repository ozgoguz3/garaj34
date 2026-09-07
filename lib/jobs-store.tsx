'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type StepIndex = 0 | 1 | 2 | 3

export type Job = {
  id: string
  customerName: string
  plate: string
  phone: string
  step: StepIndex
  createdAt: string
}

export type ArchivedJob = {
  id: string
  customerName: string
  plate: string
  phone: string
  serviceDate: string
}

export const STEPS = [
  {
    key: 'queued',
    adminLabel: 'Sırada',
    title: 'Sırada Bekliyor',
    description: 'Aracınız teslim alındı, sıraya eklendi.',
  },
  {
    key: 'washing',
    adminLabel: 'Yıkama',
    title: 'Köpük & Yıkama',
    description: 'pH dengeli köpük ve basınçlı durulama.',
  },
  {
    key: 'drying',
    adminLabel: 'Kurulama',
    title: 'Kurulama & Detay',
    description: 'Mikrofiber kurulama, iç detay ve cila.',
  },
  {
    key: 'ready',
    adminLabel: 'Hazır!',
    title: 'Teslime Hazır!',
    description: 'Anahtarınız sizi bekliyor.',
  },
] as const

export function normalizePlate(input: string) {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^(\d{2})([A-Z]{1,3})(\d{2,5})$/, '$1 $2 $3')
}

export function plateToSlug(plate: string) {
  return plate.replace(/\s+/g, '').toUpperCase()
}

export function buildWhatsAppLink(phone: string, plate: string, origin: string) {
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('0') ? `90${digits.slice(1)}` : digits
  const url = `${origin}/${plateToSlug(plate)}`
  const text = `Merhaba! Aracınız Garaj34'te işleme alındı. Canlı takip: ${url}`
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`
}

// Seed timestamps are anchored to the top of the current hour so SSR and client render identical HTML.
const anchor = new Date()
anchor.setMinutes(0, 0, 0)
const minutesAgo = (m: number) => new Date(anchor.getTime() - m * 60_000).toISOString()

const seedActive: Job[] = [
  {
    id: 'j1',
    customerName: 'Mert Kaya',
    plate: '34 ABC 123',
    phone: '0532 111 22 33',
    step: 1,
    createdAt: minutesAgo(48),
  },
  {
    id: 'j2',
    customerName: 'Elif Demir',
    plate: '34 DTL 007',
    phone: '0541 444 55 66',
    step: 0,
    createdAt: minutesAgo(12),
  },
  {
    id: 'j3',
    customerName: 'Can Yılmaz',
    plate: '06 GRJ 34',
    phone: '0555 777 88 99',
    step: 2,
    createdAt: minutesAgo(95),
  },
]

const seedArchive: ArchivedJob[] = [
  {
    id: 'a1',
    customerName: 'Ayşe Öztürk',
    plate: '34 KLM 456',
    phone: '0533 222 33 44',
    serviceDate: '2026-08-29T14:10:00.000Z',
  },
  {
    id: 'a2',
    customerName: 'Burak Şahin',
    plate: '41 XYZ 890',
    phone: '0544 555 66 77',
    serviceDate: '2026-08-21T10:30:00.000Z',
  },
  {
    id: 'a3',
    customerName: 'Zeynep Arslan',
    plate: '34 PRM 001',
    phone: '0505 888 99 00',
    serviceDate: '2026-08-14T16:45:00.000Z',
  },
]

type JobsContextValue = {
  jobs: Job[]
  archive: ArchivedJob[]
  addJob: (input: { customerName: string; plate: string; phone: string }) => Job
  setStep: (id: string, step: StepIndex) => void
  archiveJob: (id: string) => void
  recallCustomer: (id: string) => void
  findByPlate: (slug: string) => Job | undefined
}

const JobsContext = createContext<JobsContextValue | null>(null)

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(seedActive)
  const [archive, setArchive] = useState<ArchivedJob[]>(seedArchive)

  const addJob = useCallback<JobsContextValue['addJob']>((input) => {
    const job: Job = {
      id: crypto.randomUUID(),
      customerName: input.customerName.trim(),
      plate: normalizePlate(input.plate),
      phone: input.phone.trim(),
      step: 0,
      createdAt: new Date().toISOString(),
    }
    setJobs((prev) => [job, ...prev])
    return job
  }, [])

  const setStep = useCallback<JobsContextValue['setStep']>((id, step) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, step } : j)))
  }, [])

  const archiveJob = useCallback<JobsContextValue['archiveJob']>((id) => {
    setJobs((prev) => {
      const job = prev.find((j) => j.id === id)
      if (job) {
        setArchive((a) => [
          {
            id: job.id,
            customerName: job.customerName,
            plate: job.plate,
            phone: job.phone,
            serviceDate: new Date().toISOString(),
          },
          ...a,
        ])
      }
      return prev.filter((j) => j.id !== id)
    })
  }, [])

  const recallCustomer = useCallback<JobsContextValue['recallCustomer']>(
    (id) => {
      const entry = archive.find((a) => a.id === id)
      if (!entry) return
      const link = buildWhatsAppLink(
        entry.phone,
        entry.plate,
        typeof window !== 'undefined' ? window.location.origin : '',
      )
      window.open(link, '_blank', 'noopener,noreferrer')
    },
    [archive],
  )

  const findByPlate = useCallback<JobsContextValue['findByPlate']>(
    (slug) => jobs.find((j) => plateToSlug(j.plate) === slug.toUpperCase()),
    [jobs],
  )

  const value = useMemo(
    () => ({ jobs, archive, addJob, setStep, archiveJob, recallCustomer, findByPlate }),
    [jobs, archive, addJob, setStep, archiveJob, recallCustomer, findByPlate],
  )

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}

export function useJobs() {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobs must be used within JobsProvider')
  return ctx
}
