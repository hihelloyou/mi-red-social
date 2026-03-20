'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase, Post } from '@/lib/supabase'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'

export default function SavedPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) router.push('/login')
    else loadSavedPosts()
  }, [user])

  async function loadSavedPosts() {
    const { data: saved } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user?.id)

    if (!saved?.length) {
      setLoading(false)
      return
    }

    const postIds = saved.map(s => s.post_id)
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `)
      .in('id', postIds)
      .order('created_at', { ascending: false })

    const postsWithStats = await Promise.all((data || []).map(async (post) => {
      const [{ count: likesCount }, { count: commentsCount }, { data: userLike }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('likes').select('*').eq('post_id', post.id).eq('user_id', user?.id).single(),
      ])
      
      return {
        ...post,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_liked: !!userLike,
        username: post.profiles?.username,
        full_name: post.profiles?.full_name,
        avatar_url: post.profiles?.avatar_url,
      }
    }))

    setPosts(postsWithStats)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold ml-2">Publicaciones guardadas</h1>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bookmark className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay publicaciones guardadas</h3>
              <p className="text-gray-500">Guarda tus publicaciones favoritas para verlas aquí</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={loadSavedPosts} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}