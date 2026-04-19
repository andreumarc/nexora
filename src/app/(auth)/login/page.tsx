'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageCircle, Eye, EyeOff, AlertTriangle, Shield, Users, Zap, Building2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

type LoginForm = z.infer<typeof loginSchema>

const FEATURES = [
  { icon: MessageCircle, label: 'Chat corporativo en tiempo real' },
  { icon: Building2, label: 'Multiclínica y multisede' },
  { icon: Users, label: 'Directorio interno completo' },
  { icon: Shield, label: 'Permisos y auditoría avanzados' },
]

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email o contraseña incorrectos. Inténtalo de nuevo.')
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#003A70' }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#00A99D' }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: '#00A99D' }}
        />
        <div
          className="absolute top-1/2 right-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: '#ffffff' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: '#0d9488' }}
          >
            <MessageCircle style={{ width: 22, height: 22, color: '#fff' }} />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Nexora</p>
            <p className="text-xs mt-0.5" style={{ color: '#4dd1cb' }}>
              Comunicación interna corporativa
            </p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Tu equipo,{' '}
            <span style={{ color: '#26c6bf' }}>siempre</span>
            <br />
            conectado.
          </h2>
          <p className="mt-4 text-blue-200 text-base leading-relaxed max-w-sm">
            La plataforma de comunicación interna diseñada para grupos de clínicas dentales,
            empresas multisede y organizaciones sanitarias.
          </p>

          {/* Feature cards */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-start gap-2 px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Icon style={{ width: 18, height: 18, color: '#26c6bf' }} />
                <span className="text-white text-xs font-medium leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © 2026 Nexora · ImpulsoDent Group
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#0d9488' }}
          >
            <MessageCircle style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <span className="font-bold text-brand-700">Nexora</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-brand-700">Acceso al sistema</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Introduce tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white transition-colors"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors"
            >
              {loading ? 'Verificando...' : 'Entrar al sistema'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Credenciales de demostración:</p>
            <p className="text-xs text-gray-500">
              Demo:{' '}
              <span className="font-medium text-brand-600">demo@impulsodent.com</span>
              {' / '}Demo2026!
            </p>
          </div>
        </div>

        <p className="mt-auto pt-8 text-xs text-gray-300">
          Nexora © 2026 · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
