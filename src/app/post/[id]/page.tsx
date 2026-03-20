'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase, Post, Comment } from '@/lib/supabase'
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark } from 'lucide-react'
import Link from 'next/link'

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) router.push('/login')
    else loadPost()
  }, [user])

  async function loadPost() {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, username, full_name, avatar_url)
      `)
      .eq('id', params.id)
      .single()

    if (data) {
      const [{ count: likesCount }, { count: commentsCount }, { data: userLike }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', data.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', data.id),
        supabase.from('likes').select('*').eq('post_id', data.id).eq('user_id', user?.id).single(),
      ])

      setPost({
        ...data,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_liked: !!userLike,
        username: data.profiles?.username,
        full_name: data.profiles?.full_name,
        avatar_url: data.profiles?.avatar_url,
      })

      loadComments()
    }
    setLoading(false)
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('post_id', params.id)
      .order('created_at', { ascending: false })

    setComments(data || [])
  }

  async function handleLike() {
    if (!post) return
    if (post.user_liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user?.id)
      setPost({ ...post, likes_count: (post.likes_count || 0) - 1, user_liked: false })
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user?.id })
      setPost({ ...post, likes_count: (post.likes_count || 0) + 1, user_liked: true })
    }
  }

  async function addComment() {
    if (!newComment.trim()) return
    await supabase.from('comments').insert({
      post_id: params.id,
      user_id: user?.id,
      content: newComment
    })
    setNewComment('')
    loadComments()
    loadPost()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Publicación no encontrada</p>
          <button onClick={() => router.back()} className="mt-2 text-pink-500 text-sm">Volver</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => router.back()} className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold ml-3">Publicación</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-2">
                <Link href={`/profile/${post.user_id}`} className="font-semibold text-sm">
                  {post.username}
                </Link>
              </div>
              <p className="mt-2 text-gray-800 text-sm">{post.content}</p>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center space-x-4">
                <button onClick={handleLike} className={`flex items-center space-x-1 ${post.user_liked ? 'text-red-500' : 'text-gray-500'}`}>
                  <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-red-500' : ''}`} />
                  <span className="text-sm">{post.likes_count}</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-500">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.comments_count}</span>
                </button>
              </div>
              <button className="text-gray-500">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-sm mb-3">Comentarios</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {comment.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold mr-1">{comment.username}</span>
                        {comment.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
