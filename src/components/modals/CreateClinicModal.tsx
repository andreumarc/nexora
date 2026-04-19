'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, X } from 'lucide-react'
import { toast } from 'sonner'

interface Company {
  id: string
  name: string
}

interface Props {
  inline?: boolean
  defaultCompanyId?: string
}

export function CreateClinicButton({ inline, defaultCompanyId }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? '')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open && !defaultCompanyId) {
      fetch('/api/admin/companies').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setCompanies(data)
      })
    }
  }, [open, defaultCompanyId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, name, code: code || undefined, address: address || undefined, city: city || undefined, phone: phone || undefined, email: email || undefined }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error al crear clínica')
      toast.success(`Clínica "${name}" creada.`)
      setOpen(false)
      setName('')
      setCode('')
      setAddress('')
      setCity('')
      setPhone('')
      setEmail('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const modalContent = open ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fade-in p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nueva clínica</h2>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!defaultCompanyId && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Empresa *</label>
              <select
                required
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
              >
                <option value="">Seleccionar empresa…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre *</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Clínica Norte" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Código</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="CLN-01" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Ciudad</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Madrid" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Dirección</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle Mayor 1" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Teléfono</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 91 000 0000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="clinica@empresa.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm disabled:opacity-60">{loading ? 'Creando...' : 'Crear clínica'}</button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  if (inline) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <MapPin className="w-4 h-4 text-gray-400" />
          Nueva clínica
        </button>
        {modalContent}
      </>
    )
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors">
        <MapPin className="w-4 h-4" />
        Nueva clínica
      </button>
      {modalContent}
    </>
  )
}
