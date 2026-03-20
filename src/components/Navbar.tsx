'use client'

import { useAuth } from '@/context/AuthContext'
import { Home, Search, PlusSquare, Heart, User, LogOut, MessageCircle, Compass, Bell } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/explore', icon: Compass, label: 'Explorar' },
    { href: '/messages', icon: MessageCircle, label: 'Mensajes' },
    { href: `/profile/${user.id}`, icon: User, label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:top-0 md:bottom-auto md:border-b z-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="hidden md:flex items-center space-x-1">
            <span className="text-xl font-bold text-pink-500">Social</span>
            <span className="text-xl font-bold text-purple-500">App</span>
          </Link>

          {/* Navegación Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  pathname === href ? 'text-pink-500 bg-pink-50' : 'text-gray-600 hover:text-pink-500 hover:bg-pink-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{label}</span>
              </Link>
            ))}
            <Link href="/create" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-pink-500">
              <PlusSquare className="w-5 h-5" />
              <span className="text-sm">Crear</span>
            </Link>
            <Link href="/notifications" className="p-2 rounded-lg text-gray-600 hover:text-pink-500">
              <Bell className="w-5 h-5" />
            </Link>
            <button onClick={signOut} className="p-2 rounded-lg text-gray-600 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Navegación Mobile */}
          <div className="flex md:hidden justify-around w-full">
            {navItems.map(({ href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`p-2 rounded-full ${pathname === href ? 'text-pink-500' : 'text-gray-600'}`}
              >
                <Icon className="w-6 h-6" />
              </Link>
            ))}
            <Link href="/create" className="p-2 rounded-full text-gray-600">
              <PlusSquare className="w-6 h-6" />
            </Link>
            <Link href="/notifications" className={`p-2 rounded-full ${pathname === '/notifications' ? 'text-pink-500' : 'text-gray-600'}`}>
              <Bell className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}