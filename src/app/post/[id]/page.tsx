'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark } from 'lucide-react'
import Link from 'next/link'

// Definir tipos localmente para evitar errores
type Profile = {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
}

type PostType = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  username?: string
  full_name?: string
  likes_count: number
  comments_count: number
  user_liked: boolean
}

type CommentType = {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  username?: string
}

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<PostType | null>(null)
  const [comments, setComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadPost()
  }, [user])

  async function loadPost() {
    try {
      // Obtener el post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          image_url,
          created_at,
          profiles:user_id (id, username, full_name)
        `)
        .eq('id', params.id)
        .single()

      if (postError || !postData) {
        console.error('Error loading post:', postError)
        setLoading(false)
        return
      }

      // Obtener likes count
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', params.id)

      // Obtener comments count
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', params.id)

      // Verificar si el usuario dio like
      const { data: userLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', params.id)
        .eq('user_id', user?.id)
        .maybeSingle()

      const profile = postData.profiles as unknown as Profile

      setPost({
        id: postData.id,
        user_id: postData.user_id,
        content: postData.content || '',
        image_url: postData.image_url,
        created_at: postData.created_at,
        username: profile?.username,
        full_name: profile?.full_name,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_liked: !!userLike,
      })

      // Cargar comentarios
      await loadComments()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select(`
        id,
        user_id,
        post_id,
        content,
        created_at,
        profiles:user_id (username)
      `)
      .eq('post_id', params.id)
      .order('created_at', { ascending: false })

    if (data) {
      const commentsWithUsername = data.map((comment) => {
        const profile = comment.profiles as unknown as { username: string } | null
        return {
          id: comment.id,
          user_id: comment.user_id,
          post_id: comment.post_id,
          content: comment.content,
          created_at: comment.created_at,
          username: profile?.username,
        }
      })
      setComments(commentsWithUsername)
    }
  }

  async function handleLike() {
    if (!post || !user) return

    if (post.user_liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)
      setPost({ ...post, likes_count: post.likes_count - 1, user_liked: false })
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: user.id })
      setPost({ ...post, likes_count: post.likes_count + 1, user_liked: true })
    }
  }

  async function addComment() {
    if (!newComment.trim() || !user) return

    await supabase.from('comments').insert({
      post_id: params.id,
      user_id: user.id,
      content: newComment
    })
    setNewComment('')
    await loadComments()
    await loadPost()
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
          <button onClick={() => router.push('/')} className="mt-2 text-pink-500 text-sm">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold ml-3">Publicación</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Autor */}
            <div className="p-4 border-b">
              <Link href={`/profile/${post.user_id}`} className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {post.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="font-semibold text-sm hover:underline">{post.username}</span>
              </Link>
              <p className="mt-3 text-gray-800 text-sm">{post.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1 ${post.user_liked ? 'text-red-500' : 'text-gray-500'}`}
                >
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

            {/* Comentarios */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-3">Comentarios</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {comment.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
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
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No hay comentarios. ¡Sé el primero!
                  </p>
                )}
              </div>

              {/* Input para comentar */}
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
                  className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm disabled:opacity-50 hover:bg-pink-600 transition"
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