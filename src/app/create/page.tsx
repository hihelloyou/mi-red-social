'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Image, MapPin, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CreatePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!content.trim()) return
    setLoading(true)

    await supabase.from('posts').insert({
      content,
      location: location || null,
      user_id: user?.id
    })

    router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Crear publicación</h1>
            <button
              onClick={handleCreate}
              disabled={loading || !content.trim()}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué estás pensando?"
              className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
              rows={6}
              autoFocus
            />

            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2 text-gray-500">
                <Image className="w-5 h-5" />
                <span className="text-sm">Agregar foto</span>
                <span className="text-xs text-gray-400">Próximamente</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Agregar ubicación"
                  className="flex-1 text-sm bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}