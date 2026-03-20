'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase, Notification } from '@/lib/supabase'
import { ArrowLeft, Heart, MessageCircle, UserPlus, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) router.push('/login')
    else loadNotifications()
  }, [user])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        from_user:from_user_id (id, username, full_name, avatar_url)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    setNotifications(data || [])
    setLoading(false)

    // Marcar como leídas
    if (data?.length) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500" />
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'follow': return <UserPlus className="w-5 h-5 text-green-500" />
      default: return <Sparkles className="w-5 h-5 text-purple-500" />
    }
  }

  const getText = (notif: Notification) => {
    const username = notif.from_user?.username || 'Alguien'
    switch (notif.type) {
      case 'like': return `${username} le dio me gusta a tu publicación`
      case 'comment': return `${username} comentó en tu publicación`
      case 'follow': return `${username} comenzó a seguirte`
      default: return `${username} interactuó con tu contenido`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold ml-2">Notificaciones</h1>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin notificaciones</h3>
              <p className="text-gray-500">Cuando alguien interactúe con tu contenido, aparecerá aquí</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.type === 'follow' ? `/profile/${notif.from_user_id}` : `/post/${notif.post_id}`}
                  className={`flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition ${!notif.read ? 'bg-pink-50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {notif.from_user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800">{getText(notif)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {getIcon(notif.type)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}