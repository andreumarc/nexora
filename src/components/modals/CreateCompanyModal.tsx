'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  inline?: boolean
}

export function CreateCompanyButton({ inline }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function slugify(s: string) {
    return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug: slugify(name), domain: domain || undefined }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error al crear empresa')
      toast.success(`Empresa "${name}" creada.`)
      setOpen(false)
      setName('')
      setDomain('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (inline) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Building2 className="w-4 h-4 text-gray-400" />
          Nueva empresa
        </button>
        <Modal open={open} onClose={() => setOpen(false)} title="Nueva empresa" name={name} setName={setName} domain={domain} setDomain={setDomain} loading={loading} onSubmit={handleSubmit} />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <Building2 className="w-4 h-4" />
        Nueva empresa
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva empresa" name={name} setName={setName} domain={domain} setDomain={setDomain} loading={loading} onSubmit={handleSubmit} />
    </>
  )
}

function Modal({ open, onClose, title, name, setName, domain, setDomain, loading, onSubmit }: {
  open: boolean
  onClose: () => void
  title: string
  name: string
  setName: (v: string) => void
  domain: string
  setDomain: (v: string) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre de la empresa *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Clínicas ABC"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Dominio (opcional)</label>
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="empresa.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
