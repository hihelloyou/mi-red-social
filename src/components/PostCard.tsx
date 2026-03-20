'use client'

import { useState, useEffect } from 'react'
import { supabase, Post, Comment } from '@/lib/supabase'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

interface PostCardProps {
  post: Post
  onUpdate: () => void
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComment, setLoadingComment] = useState(false)

  useEffect(() => {
    if (showComments) loadComments()
  }, [showComments])

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function handleLike() {
    if (post.user_liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user?.id)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user?.id })
    }
    onUpdate()
  }

  async function addComment() {
    if (!newComment.trim()) return
    setLoadingComment(true)
    await supabase.from('comments').insert({
      post_id: post.id,
      user_id: user?.id,
      content: newComment
    })
    setNewComment('')
    await loadComments()
    onUpdate()
    setLoadingComment(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Link href={`/profile/${post.user_id}`} className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            {post.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="font-semibold text-sm">{post.username}</span>
        </Link>
        <button className="text-gray-400">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido */}
      <div className="px-3 pb-2">
        <p className="text-gray-800 text-sm">{post.content}</p>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 ${post.user_liked ? 'text-red-500' : 'text-gray-500'}`}
          >
            <Heart className={`w-5 h-5 ${post.user_liked ? 'fill-red-500' : ''}`} />
            <span className="text-xs">{post.likes_count || 0}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">{post.comments_count || 0}</span>
          </button>
          <button className="text-gray-500">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <button className="text-gray-500">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      {/* Comentarios */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 p-3">
          <div className="max-h-48 overflow-y-auto space-y-2 mb-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {comment.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-xs">
                    <span className="font-semibold mr-1">{comment.username}</span>
                    {comment.content}
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
              className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
            <button
              onClick={addComment}
              disabled={loadingComment || !newComment.trim()}
              className="px-3 py-1.5 bg-pink-500 text-white rounded-full text-xs font-medium disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}