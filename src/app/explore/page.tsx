'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase, Profile } from '@/lib/supabase'
import { Search, UserPlus, UserCheck } from 'lucide-react'
import Link from 'next/link'

export default function ExplorePage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [following, setFollowing] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadUsers()
    loadFollowing()
  }, [])

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function loadFollowing() {
    const { data } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', user?.id)
    setFollowing(new Set(data?.map(f => f.following_id) || []))
  }

  async function toggleFollow(userId: string) {
    if (following.has(userId)) {
      await supabase.from('followers').delete().eq('follower_id', user?.id).eq('following_id', userId)
      setFollowing(prev => { const newSet = new Set(prev); newSet.delete(userId); return newSet })
    } else {
      await supabase.from('followers').insert({ follower_id: user?.id, following_id: userId })
      setFollowing(prev => new Set(prev).add(userId))
    }
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold">Explorar</h1>
          </div>
        </div>

        <div className="p-4">
          {/* Buscador */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar personas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-2">
            {filteredUsers.map(u => (
              <div key={u.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                <Link href={`/profile/${u.id}`} className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.username}</p>
                    <p className="text-xs text-gray-500">{u.full_name}</p>
                  </div>
                </Link>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${following.has(u.id) ? 'border border-gray-300 text-gray-700' : 'bg-pink-500 text-white'}`}
                >
                  {following.has(u.id) ? 'Siguiendo' : 'Seguir'}
                </button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No se encontraron usuarios</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}