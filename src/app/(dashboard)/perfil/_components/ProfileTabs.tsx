'use client'

import { useState } from 'react'
import type { RoleType } from '@prisma/client'

interface Membership {
  id: string
  role: RoleType
  isActive: boolean
  company: { id: string; name: string }
  clinic: { id: string; name: string } | null
}

interface UserData {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  jobTitle: string | null
  isSuperadmin: boolean
  memberships: Membership[]
}

const TABS = ['Datos', 'Contraseña', 'Clínicas', 'Empresa', 'Aplicaciones'] as const
type Tab = typeof TABS[number]

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  DIRECCION_GENERAL: 'Dirección General',
  DIRECCION_CLINICA: 'Dirección Clínica',
  RRHH: 'RRHH',
  ODONTOLOGO: 'Odontólogo',
  AUXILIAR: 'Auxiliar',
  EMPLOYEE: 'Empleado',
}

const APPS = [
  { name: 'ClinicVox', desc: 'Automatización de llamadas', color: '#0d9488' },
  { name: 'DentalHR', desc: 'Recursos humanos dental', color: '#003A70' },
  { name: 'ClinicStock', desc: 'Gestión de stock', color: '#7c3aed' },
  { name: 'SpendFlow', desc: 'Gestión de gastos', color: '#d97706' },
  { name: 'Nexora', desc: 'Comunicación interna', color: '#2563eb', active: true },
  { name: 'ClinicRefunds', desc: 'Devoluciones', color: '#dc2626' },
]

export function ProfileTabs({ user }: { user: UserData }) {
  const [activeTab, setActiveTab] = useState<Tab>('Datos')
  const [name, setName] = useState(user.firstName ?? user.name ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdSaved, setPwdSaved] = useState(false)

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.name ?? user.email

  const initials =
    ((user.firstName?.[0] ?? user.name?.[0] ?? '').toUpperCase()) +
    ((user.lastName?.[0] ?? '').toUpperCase())

  const primaryMembership = user.memberships[0]
  const roleLabel = primaryMembership
    ? ROLE_LABELS[primaryMembership.role] ?? primaryMembership.role
    : user.isSuperadmin
    ? 'Superadmin'
    : 'Usuario'

  // Unique clinics across all memberships
  const clinics = user.memberships.filter(m => m.clinic).map(m => ({
    clinicName: m.clinic!.name,
    companyName: m.company.name,
  }))

  // Unique companies
  const companies = Array.from(
    new Map(user.memberships.map(m => [m.company.id, m.company])).values()
  )

  async function handleSaveData() {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: name, lastName, phone, jobTitle }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setPwdError('')
    if (newPwd !== confirmPwd) {
      setPwdError('Las contraseñas no coinciden.')
      return
    }
    if (newPwd.length < 8) {
      setPwdError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setPwdSaving(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setPwdError(data.error ?? 'Error al cambiar la contraseña.')
      } else {
        setPwdSaved(true)
        setCurrentPwd('')
        setNewPwd('')
        setConfirmPwd('')
        setTimeout(() => setPwdSaved(false), 2500)
      }
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
          style={{ background: '#0d9488' }}
        >
          {initials || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span className="mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Tabs pills */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={
              activeTab === tab
                ? { background: '#0d9488', color: '#fff' }
                : { background: '#fff', color: '#4b5563', border: '1px solid #e5e7eb' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {activeTab === 'Datos' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Información personal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apellidos</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveData}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60"
                style={{ background: '#0d9488' }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              {saved && <span className="text-sm text-teal-600 font-medium">Guardado correctamente</span>}
            </div>
          </div>
        )}

        {activeTab === 'Contraseña' && (
          <div className="space-y-4 max-w-sm">
            <h2 className="text-base font-semibold text-gray-900">Cambiar contraseña</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={handleChangePassword}
                disabled={pwdSaving}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-60"
                style={{ background: '#0d9488' }}
              >
                {pwdSaving ? 'Cambiando…' : 'Cambiar contraseña'}
              </button>
              {pwdSaved && <span className="text-sm text-teal-600 font-medium">Contraseña actualizada</span>}
            </div>
          </div>
        )}

        {activeTab === 'Clínicas' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Mis clínicas</h2>
            {clinics.length === 0 ? (
              <p className="text-sm text-gray-500">No tienes clínicas asignadas.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2 pr-4">Clínica</th>
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2">Empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clinics.map((c, i) => (
                    <tr key={i}>
                      <td className="py-2.5 pr-4 font-medium text-gray-800">{c.clinicName}</td>
                      <td className="py-2.5 text-gray-500">{c.companyName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'Empresa' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Mi empresa</h2>
            {companies.length === 0 ? (
              <p className="text-sm text-gray-500">No tienes empresa asignada.</p>
            ) : (
              <ul className="space-y-2">
                {companies.map(company => (
                  <li key={company.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: '#0d9488' }}
                    >
                      {company.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{company.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'Aplicaciones' && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Aplicaciones ImpulsoDent</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {APPS.map(app => (
                <div
                  key={app.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100"
                  style={{ background: (app as { active?: boolean }).active ? '#f0fdf4' : '#fafafa' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: app.color }}
                  >
                    {app.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{app.name}</p>
                    <p className="text-xs text-gray-500">{app.desc}</p>
                  </div>
                  {(app as { active?: boolean }).active && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                      Activa
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
