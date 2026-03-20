'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase, Profile, Post } from '@/lib/supabase'
import { Edit3, UserPlus, UserCheck, ArrowLeft, Grid } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', full_name: '', bio: '', website: '' })
  const [loading, setLoading] = useState(true)

  const profileId = params.id as string

  useEffect(() => {
    if (!user) router.push('/login')
    else loadProfile()
  }, [profileId, user])

  async function loadProfile() {
    setLoading(true)
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()
    
    setProfile(profileData)
    setIsOwnProfile(user?.id === profileId)
    setEditForm({
      username: profileData?.username || '',
      full_name: profileData?.full_name || '',
      bio: profileData?.bio || '',
      website: profileData?.website || '',
    })

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
    setPosts(postsData || [])

    const { count: followers } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profileId)
    setFollowersCount(followers || 0)

    const { count: following } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileId)
    setFollowingCount(following || 0)

    if (user && !isOwnProfile) {
      const { data: followData } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .single()
      setIsFollowing(!!followData)
    }

    setLoading(false)
  }

  async function toggleFollow() {
    if (!user) return

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
    } else {
      await supabase
        .from('followers')
        .insert({ follower_id: user.id, following_id: profileId })
      setIsFollowing(true)
      setFollowersCount(prev => prev + 1)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await updateProfile(editForm)
    if (!error) {
      setProfile({ ...profile, ...editForm } as Profile)
      setEditing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Usuario no encontrado</p>
          <button onClick={() => router.back()} className="mt-2 text-pink-500 text-sm">Volver</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => router.back()} className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold ml-3">{profile.username}</h1>
          </div>
        </div>

        {/* Info del perfil */}
        <div className="bg-white px-4 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.username}</h2>
                <p className="text-gray-500 text-sm">{profile.full_name}</p>
                {profile.bio && <p className="text-sm text-gray-600 mt-1 max-w-xs">{profile.bio}</p>}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-pink-500 text-xs mt-1 block">
                    {profile.website}
                  </a>
                )}
              </div>
            </div>
            
            {isOwnProfile ? (
              <button onClick={() => setEditing(!editing)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                Editar
              </button>
            ) : (
              <button
                onClick={toggleFollow}
                className={`px-5 py-1.5 rounded-lg text-sm font-medium ${isFollowing ? 'border border-gray-300 text-gray-700' : 'bg-pink-500 text-white'}`}
              >
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
          </div>

          {/* Estadísticas */}
          <div className="flex space-x-6 mt-5">
            <div><span className="font-bold">{posts.length}</span> <span className="text-gray-500 text-sm">publicaciones</span></div>
            <div><span className="font-bold">{followersCount}</span> <span className="text-gray-500 text-sm">seguidores</span></div>
            <div><span className="font-bold">{followingCount}</span> <span className="text-gray-500 text-sm">seguidos</span></div>
          </div>
        </div>

        {/* Editar perfil */}
        {editing && isOwnProfile && (
          <div className="bg-white mx-4 mb-4 p-4 rounded-xl shadow-sm border border-gray-100">
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <input type="text" placeholder="Usuario" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="Nombre completo" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <textarea placeholder="Biografía" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              <input type="url" placeholder="Sitio web" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex space-x-2">
                <button type="submit" className="flex-1 py-2 bg-pink-500 text-white rounded-lg text-sm">Guardar</button>
                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 border rounded-lg text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Publicaciones */}
        <div className="px-4 pb-6">
          <div className="flex items-center space-x-2 border-b pb-2 mb-3">
            <Grid className="w-4 h-4" />
            <span className="text-sm font-medium">Publicaciones</span>
          </div>
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No hay publicaciones aún</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-sm">{post.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}