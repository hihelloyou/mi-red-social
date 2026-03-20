'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase, Message, Profile } from '@/lib/supabase'
import { Send, ArrowLeft, Search } from 'lucide-react'

export default function MessagesPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedUser) {
      loadMessages()
      const interval = setInterval(loadMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedUser])

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
    setUsers(data || [])
  }

  async function loadMessages() {
    if (!selectedUser) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedUser) return
    await supabase.from('messages').insert({
      content: newMessage,
      sender_id: user?.id,
      receiver_id: selectedUser.id
    })
    setNewMessage('')
    loadMessages()
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
          <h1 className="text-lg font-semibold">Mensajes</h1>
        </div>

        {!selectedUser ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
              </div>
              {filteredUsers.map(u => (
                <button key={u.id} onClick={() => setSelectedUser(u)} className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{u.username}</p>
                    <p className="text-xs text-gray-500">{u.full_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b px-4 py-3 flex items-center space-x-3">
              <button onClick={() => setSelectedUser(null)} className="p-1">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                {selectedUser.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{selectedUser.username}</p>
                <p className="text-xs text-gray-500">{selectedUser.full_name}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map(msg => {
                const isMine = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-2 rounded-lg text-sm ${isMine ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {msg.content}
                      <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input */}
            <div className="bg-white border-t p-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
                <button onClick={sendMessage} className="px-4 py-2 bg-pink-500 text-white rounded-full text-sm">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}