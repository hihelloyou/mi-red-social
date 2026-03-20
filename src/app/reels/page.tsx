'use client'

import { useAuth } from '@/context/AuthContext'
import { Play, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'

export default function ReelsPage() {
  const { user } = useAuth()
  const [muted, setMuted] = useState(true)

  if (!user) return null

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Reels</h2>
          <p className="text-gray-400">Próximamente: videos cortos estilo Reels</p>
          <button
            onClick={() => setMuted(!muted)}
            className="mt-6 p-2 bg-white/10 rounded-full"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}