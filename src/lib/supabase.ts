import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Profile = {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  website: string | null
  created_at: string
}

export type Post = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  username?: string
  full_name?: string
  avatar_url?: string
  likes_count?: number
  comments_count?: number
  user_liked?: boolean
}

export type Comment = {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  username?: string
  avatar_url?: string
}

export type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  from_user_id: string
  type: string
  post_id: string | null
  read: boolean
  created_at: string
}