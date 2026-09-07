'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

// Artık sadece 3 adım var: 0 (Sırada), 1 (İşlemde), 2 (Hazır)
export type StepIndex = 0 | 1 | 2

export type Job = {
  id: string
  customerName: string
  plate: string
  phone: string
  services: string[] // Yeni: Seçilen hizmetler dizisi
  step: StepIndex
  createdAt: string
}

export type ArchivedJob = {
  id: string
  customerName: string
  plate: string
  phone: string
  services: string[] // Yeni: Arşivde de yapılan işlemleri tutuyoruz
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
    key: 'processing',
    adminLabel: 'İşlemde',
    title: 'İşleme Alındı',
    description: 'Seçtiğiniz hizmetler özenle uygulanıyor.',
  },
  {
    key: 'ready',
    adminLabel: 'Hazır!',
    title: 'Teslime Hazır!',
    description: 'Aracınızın işlemleri tamamlandı, sizi bekliyor.',
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

type JobsContextValue = {
  jobs: Job[]
  archive: ArchivedJob[]
  addJob: (input: { customerName: string; plate: string; phone: string; services: string[] }) => Job
  setStep: (id: string, step: StepIndex) => void
  archiveJob: (id: string) => void
  recallCustomer: (id: string) => void
  findByPlate: (slug: string) => Job | undefined
}

const JobsContext = createContext<JobsContextValue | null>(null)

export function JobsProvider({ children }: { children: ReactNode }) {
  // Satışa hazır sıfır veritabanı (boş array)
  const [jobs, setJobs] = useState<Job[]>([])
  const [archive, setArchive] = useState<ArchivedJob[]>([])

  const addJob = useCallback<JobsContextValue['addJob']>((input) => {
    const job: Job = {
      id: crypto.randomUUID(),
      customerName: input.customerName.trim(),
      plate: normalizePlate(input.plate),
      phone: input.phone.trim(),
      services: input.services, // Hizmetleri kaydet
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
            services: job.services, // Arşive hizmetleri de taşı
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