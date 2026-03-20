'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Moon, Bell, Shield, HelpCircle, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  if (!user) {
    router.push('/login')
    return null
  }

  const settingsOptions = [
    { icon: Bell, label: 'Notificaciones', href: '/notifications' },
    { icon: Moon, label: 'Modo oscuro', soon: true },
    { icon: Shield, label: 'Privacidad y seguridad', href: '/privacy' },
    { icon: HelpCircle, label: 'Ayuda y soporte', href: '/help' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold ml-2">Configuración</h1>
          </div>
        </div>

        {/* Opciones */}
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {settingsOptions.map((option, index) => (
              <div key={option.label}>
                {option.href ? (
                  <Link
                    href={option.href}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition w-full"
                  >
                    <div className="flex items-center space-x-3">
                      <option.icon className="w-5 h-5 text-gray-500" />
                      <span>{option.label}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between p-4 opacity-50">
                    <div className="flex items-center space-x-3">
                      <option.icon className="w-5 h-5 text-gray-500" />
                      <span>{option.label}</span>
                    </div>
                    <span className="text-xs text-gray-400">Próximamente</span>
                  </div>
                )}
                {index < settingsOptions.length - 1 && <hr className="mx-4" />}
              </div>
            ))}
          </div>

          {/* Cerrar sesión */}
          <button
            onClick={signOut}
            className="w-full bg-red-50 text-red-600 p-4 rounded-2xl font-medium hover:bg-red-100 transition flex items-center justify-center space-x-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>

          {/* Versión */}
          <p className="text-center text-xs text-gray-400 pt-4">Versión 1.0.0</p>
        </div>
      </div>
    </div>
  )
}