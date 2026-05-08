import { useState, useMemo, useRef, useEffect } from 'react'
import { MessageSquare, Send, Search, Plus, Smile, Paperclip, Info, Users, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { storage, subscribeToKey } from '@/lib/storage'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { generateId, nowISO, formatShortTime, cn } from '@/lib/utils'
import type { Conversation, Message, User } from '@/types'

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '👏', '🔥']

export default function ChatPage() {
  const { currentUser } = useAuth()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [search, setSearch] = useState('')
  const [newConvModal, setNewConvModal] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>(() => storage.getArray('messages'))
  const [conversations, setConversations] = useState<Conversation[]>(() => storage.getArray('conversations'))

  const allUsers = useMemo(() => storage.getArray('users').filter((u) => u.id !== currentUser?.id && u.is_active), [currentUser])

  const myConversations = useMemo(() => {
    if (!currentUser) return []
    return conversations
      .filter((c) => c.participant_ids.includes(currentUser.id))
      .filter((c) => {
        if (!search) return true
        return getConvName(c).toLowerCase().includes(search.toLowerCase())
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
        const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
        return dateB - dateA
      })
  }, [conversations, currentUser, search])

  const activeConv = useMemo(() => conversations.find((c) => c.id === activeConvId), [conversations, activeConvId])
  const activeMessages = useMemo(() => messages.filter((m) => m.conversation_id === activeConvId).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ), [messages, activeConvId])

  const filteredUsers = useMemo(() => {
    if (!userSearch) return allUsers
    const q = userSearch.toLowerCase()
    return allUsers.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [allUsers, userSearch])

  // Realtime: refresh messages and conversations when Supabase pushes changes
  useEffect(() => {
    const unsubMsgs = subscribeToKey('messages', () =>
      setMessages(storage.getArray('messages')),
    )
    const unsubConvs = subscribeToKey('conversations', () =>
      setConversations(storage.getArray('conversations')),
    )
    return () => { unsubMsgs(); unsubConvs() }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  function getConvName(conv: Conversation): string {
    if (conv.name) return conv.name
    if (conv.type === 'direct' && currentUser) {
      const otherId = conv.participant_ids.find((id) => id !== currentUser.id)
      const other = storage.getArray('users').find((u) => u.id === otherId)
      return other?.name ?? 'Usuário'
    }
    return 'Conversa'
  }

  function getConvSubtitle(conv: Conversation): string {
    if (conv.type === 'direct') {
      const otherId = conv.participant_ids.find((id) => id !== currentUser?.id)
      const other = allUsers.find((u) => u.id === otherId) ?? storage.getArray('users').find((u) => u.id === otherId)
      const roleLabels: Record<string, string> = {
        aluno: 'Aluno', professor: 'Professor', pai: 'Responsável',
        coordenador: 'Coordenador', diretor: 'Diretor',
      }
      return other ? roleLabels[other.role] ?? '' : ''
    }
    return `${conv.participant_ids.length} participantes`
  }

  function getUserById(id: string): User | undefined {
    return storage.getArray('users').find((u) => u.id === id)
  }

  function startDirectConversation(user: User) {
    if (!currentUser) return
    // Check if DM already exists
    const existing = conversations.find((c) =>
      c.type === 'direct' &&
      c.participant_ids.includes(currentUser.id) &&
      c.participant_ids.includes(user.id) &&
      c.participant_ids.length === 2
    )
    if (existing) {
      setActiveConvId(existing.id)
      setNewConvModal(false)
      return
    }
    const newConv: Conversation = {
      id: generateId(),
      type: 'direct',
      participant_ids: [currentUser.id, user.id],
      unread_count: 0,
      last_message_at: nowISO(),
      created_at: nowISO(),
    }
    storage.push('conversations', newConv)
    setConversations((prev) => [...prev, newConv])
    setActiveConvId(newConv.id)
    setNewConvModal(false)
    setUserSearch('')
  }

  function sendMessage() {
    if (!messageText.trim() || !activeConvId || !currentUser) return
    const newMsg: Message = {
      id: generateId(),
      conversation_id: activeConvId,
      sender_id: currentUser.id,
      type: 'text',
      content: messageText.trim(),
      read_by: [currentUser.id],
      reactions: [],
      created_at: nowISO(),
    }
    storage.push('messages', newMsg)
    setMessages((prev) => [...prev, newMsg])
    storage.update<Conversation>('conversations', activeConvId, {
      last_message: newMsg,
      last_message_at: newMsg.created_at,
    })
    setConversations((prev) => prev.map((c) => c.id === activeConvId
      ? { ...c, last_message: newMsg, last_message_at: newMsg.created_at }
      : c
    ))
    setMessageText('')
    inputRef.current?.focus()
  }

  function addReaction(messageId: string, emoji: string) {
    if (!currentUser) return
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m
      const reactions = m.reactions.map((r) => ({ ...r, user_ids: [...r.user_ids] }))
      const existing = reactions.find((r) => r.emoji === emoji)
      if (existing) {
        if (existing.user_ids.includes(currentUser.id)) {
          existing.user_ids = existing.user_ids.filter((id) => id !== currentUser.id)
        } else {
          existing.user_ids.push(currentUser.id)
        }
      } else {
        reactions.push({ emoji, user_ids: [currentUser.id] })
      }
      return { ...m, reactions }
    }))
  }

  const ROLE_LABELS: Record<string, string> = {
    aluno: 'Aluno', professor: 'Professor', pai: 'Responsável',
    coordenador: 'Coordenador', diretor: 'Diretor',
  }

  if (!currentUser) return null

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-dark-700 bg-dark-800">
      {/* Sidebar */}
      <div className={cn('w-full sm:w-80 border-r border-dark-700 flex flex-col bg-dark-800', activeConvId && 'hidden sm:flex')}>
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-dark-100">Mensagens</h2>
            <button
              onClick={() => setNewConvModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 transition-colors"
              title="Nova conversa"
            >
              <Plus size={16} className="text-dark-900" />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full h-9 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 pl-8 pr-4 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {myConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare size={32} className="text-dark-600 mx-auto mb-2" />
              <p className="text-sm text-dark-500">Nenhuma conversa</p>
              <button onClick={() => setNewConvModal(true)} className="mt-3 text-xs text-amber-400 hover:text-amber-300">
                Iniciar uma conversa
              </button>
            </div>
          ) : (
            myConversations.map((conv) => {
              const name = getConvName(conv)
              const isActive = conv.id === activeConvId
              const lastMsg = conv.last_message

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 transition-all hover:bg-dark-700 text-left',
                    isActive && 'bg-dark-700 border-r-2 border-amber-500'
                  )}
                >
                  <div className="relative shrink-0">
                    {conv.type === 'direct' ? (
                      <Avatar name={name} size="md" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center text-sm font-bold text-dark-200">
                        {conv.type === 'class' ? '🏫' : conv.type === 'subject' ? '📚' : <Users size={18} />}
                      </div>
                    )}
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full text-xs font-bold text-dark-900 flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className={cn('text-sm font-medium truncate', isActive ? 'text-white' : 'text-dark-200')}>
                        {name}{conv.pinned ? ' 📌' : ''}
                      </span>
                      {lastMsg && <span className="text-xs text-dark-500 shrink-0 ml-1">{formatShortTime(lastMsg.created_at)}</span>}
                    </div>
                    {lastMsg ? (
                      <p className="text-xs text-dark-500 truncate">
                        {lastMsg.sender_id === currentUser.id ? 'Você: ' : ''}{lastMsg.content}
                      </p>
                    ) : (
                      <p className="text-xs text-dark-600">Conversa iniciada</p>
                    )}
                    <p className="text-xs text-dark-600 mt-0.5">{getConvSubtitle(conv)}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeConv ? (
        <div className={cn('flex-1 flex flex-col', !activeConvId && 'hidden sm:flex')}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-800">
            <div className="flex items-center gap-3">
              <button className="sm:hidden text-dark-400 mr-1" onClick={() => setActiveConvId(null)}>←</button>
              {activeConv.type === 'direct' ? (
                <Avatar name={getConvName(activeConv)} size="sm" online />
              ) : (
                <div className="w-9 h-9 rounded-full bg-dark-600 flex items-center justify-center text-lg">
                  {activeConv.type === 'class' ? '🏫' : '📚'}
                </div>
              )}
              <div>
                <p className="font-medium text-dark-100">{getConvName(activeConv)}</p>
                <p className="text-xs text-dark-500">{getConvSubtitle(activeConv)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg transition-colors"><Info size={16} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare size={40} className="text-dark-600 mb-3" />
                <p className="text-dark-400 font-medium">Nenhuma mensagem ainda</p>
                <p className="text-dark-500 text-sm mt-1">Seja o primeiro a dizer olá! 👋</p>
              </div>
            ) : (
              activeMessages.map((msg, idx) => {
                const sender = getUserById(msg.sender_id)
                const isMe = msg.sender_id === currentUser.id
                const showAvatar = !isMe && (idx === 0 || activeMessages[idx - 1]?.sender_id !== msg.sender_id)
                const isGrouped = idx > 0 && activeMessages[idx - 1]?.sender_id === msg.sender_id

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex gap-2 group', isMe ? 'justify-end' : 'justify-start', isGrouped ? 'mt-0.5' : 'mt-3')}
                  >
                    {!isMe && (
                      <div className="w-8 shrink-0">
                        {showAvatar && <Avatar name={sender?.name ?? '?'} size="sm" />}
                      </div>
                    )}
                    <div className={cn('max-w-xs lg:max-w-md', isMe && 'items-end flex flex-col')}>
                      {showAvatar && !isMe && (
                        <span className="text-xs text-dark-500 mb-1 ml-1">{sender?.name}</span>
                      )}
                      <div className="relative">
                        <div className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                          isMe ? 'bg-amber-500 text-dark-900 rounded-br-md' : 'bg-dark-700 text-dark-100 rounded-bl-md'
                        )}>
                          {msg.is_pinned && <span className="text-xs opacity-70 block mb-1">📌 Fixado</span>}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <span className={cn('text-xs block mt-1', isMe ? 'text-amber-800' : 'text-dark-500')}>
                            {formatShortTime(msg.created_at)}
                            {isMe && msg.read_by.length > 1 && ' ✓✓'}
                          </span>
                        </div>

                        {msg.reactions.filter((r) => r.user_ids.length > 0).length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {msg.reactions.filter((r) => r.user_ids.length > 0).map((r) => (
                              <button key={r.emoji} onClick={() => addReaction(msg.id, r.emoji)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-dark-700 border border-dark-600 text-xs hover:border-dark-500 transition-colors">
                                {r.emoji}{r.user_ids.length > 1 && <span className="text-dark-300">{r.user_ids.length}</span>}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className={cn(
                          'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-dark-800 border border-dark-700 rounded-xl p-1 shadow-lg z-10',
                          isMe ? 'right-full mr-2' : 'left-full ml-2'
                        )}>
                          {EMOJI_LIST.map((emoji) => (
                            <button key={emoji} onClick={() => addReaction(msg.id, emoji)} className="text-base hover:scale-125 transition-transform">{emoji}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-dark-700 bg-dark-800">
            <div className="flex items-end gap-2">
              <button className="text-dark-400 hover:text-dark-200 transition-colors shrink-0 mb-2.5"><Paperclip size={18} /></button>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Digite uma mensagem..."
                  className="w-full bg-dark-900 border border-dark-700 rounded-2xl text-sm text-dark-100 placeholder-dark-500 px-4 py-3 pr-10 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/30"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"><Smile size={16} /></button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!messageText.trim()}
                className="h-11 w-11 shrink-0 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
              >
                <Send size={16} className="text-dark-900" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn('flex-1 items-center justify-center hidden sm:flex flex-col gap-4')}>
          <MessageSquare size={48} className="text-dark-600" />
          <div className="text-center">
            <p className="text-dark-300 font-medium">Selecione uma conversa</p>
            <p className="text-dark-500 text-sm mt-1">ou inicie uma nova tocando no +</p>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setNewConvModal(true)} size="sm">
            Nova conversa
          </Button>
        </div>
      )}

      {/* New Conversation Modal */}
      <Modal open={newConvModal} onClose={() => { setNewConvModal(false); setUserSearch('') }} title="Nova Conversa">
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              autoFocus
              className="w-full h-10 bg-dark-900 border border-dark-700 rounded-xl text-sm text-dark-100 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1">
            <AnimatePresence>
              {filteredUsers.length === 0 ? (
                <p className="text-center text-sm text-dark-500 py-6">Nenhum usuário encontrado</p>
              ) : (
                filteredUsers.map((user) => (
                  <motion.button
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => startDirectConversation(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-dark-700 transition-all text-left"
                  >
                    <Avatar name={user.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-100 truncate">{user.name}</p>
                      <p className="text-xs text-dark-500">{ROLE_LABELS[user.role]}{user.enrollment_number ? ` · RA ${user.enrollment_number}` : ''}</p>
                    </div>
                    <Plus size={16} className="text-dark-500 shrink-0" />
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </Modal>
    </div>
  )
}
