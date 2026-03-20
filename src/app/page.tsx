'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase, Post } from '@/lib/supabase'
import { Send, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PostCard from '@/components/PostCard'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const loadPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `)
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
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (user) loadPosts()
  }, [user, authLoading, loadPosts, router])

  async function createPost() {
    if (!newPost.trim()) return
    setLoading(true)
    await supabase.from('posts').insert({ content: newPost, user_id: user?.id })
    setNewPost('')
    await loadPosts()
    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      
      <main className="max-w-2xl mx-auto pt-4 px-4">
        {/* Crear post */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="¿Qué estás pensando?"
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={createPost}
                  disabled={loading || !newPost.trim()}
                  className="px-4 py-1.5 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 disabled:opacity-50 flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>{loading ? '...' : 'Publicar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto bg-pink-100 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No hay publicaciones</h3>
            <p className="text-sm text-gray-500">Sigue a personas para ver sus publicaciones</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={loadPosts} />
          ))
        )}
      </main>
    </div>
  )
}