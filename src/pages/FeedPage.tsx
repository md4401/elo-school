import { useState, useMemo, useEffect } from 'react'
import { Rss, Pin, MessageSquare, Plus, Send, Paperclip, BookOpen, Bell, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage, subscribeToKey } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { hasPermission } from '@/lib/constants'
import { formatRelative, generateId, nowISO } from '@/lib/utils'
import type { ClassroomPost } from '@/types'

const POST_TYPE_CONFIG = {
  aviso: { label: 'Aviso', icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  atividade: { label: 'Atividade', icon: BookOpen, color: 'text-electric-400', bg: 'bg-electric-500/10' },
  recurso: { label: 'Recurso', icon: FileText, color: 'text-green-400', bg: 'bg-green-500/10' },
  formulario: { label: 'Formulário', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10' },
}

export default function FeedPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [newPostModal, setNewPostModal] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [posts, setPosts] = useState<ClassroomPost[]>(() => storage.getArray('classroom_posts'))
  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'aviso' as ClassroomPost['type'] })

  const canCreate = currentUser ? hasPermission(currentUser.role, 'create_tasks') : false

  // Realtime: refresh feed when Supabase pushes new posts
  useEffect(() => {
    return subscribeToKey('classroom_posts', () =>
      setPosts(storage.getArray('classroom_posts')),
    )
  }, [])

  const myPosts = useMemo(() => {
    if (!currentUser) return []
    let filtered = posts
    if (currentUser.role === 'aluno') filtered = posts.filter((p) => p.class_id === currentUser.class_id)
    else if (currentUser.role === 'pai') {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      filtered = posts.filter((p) => p.class_id === child?.class_id)
    } else if (currentUser.role === 'professor') {
      filtered = posts.filter((p) => p.author_id === currentUser.id || storage.getArray('classes').some((c) => c.teacher_ids.includes(currentUser.id) && c.id === p.class_id))
    }
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [posts, currentUser])

  function addComment(postId: string) {
    const text = commentInputs[postId]?.trim()
    if (!text || !currentUser) return

    const comment = { id: generateId(), author_id: currentUser.id, content: text, created_at: nowISO() }
    storage.update<ClassroomPost>('classroom_posts', postId, {
      comments: [...(posts.find((p) => p.id === postId)?.comments ?? []), comment],
    })
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p))
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
  }

  function createPost() {
    if (!currentUser || !newPost.title || !newPost.content) return
    const classes = storage.getArray('classes')
    const myClass = currentUser.role === 'professor'
      ? classes.find((c) => c.teacher_ids.includes(currentUser.id))
      : classes[0]
    if (!myClass) return

    const post: ClassroomPost = {
      id: generateId(),
      author_id: currentUser.id,
      class_id: myClass.id,
      type: newPost.type,
      title: newPost.title,
      content: newPost.content,
      attachments: [],
      created_at: nowISO(),
      updated_at: nowISO(),
      pinned: false,
      comments: [],
    }
    storage.push('classroom_posts', post)
    setPosts((prev) => [post, ...prev])
    addToast({ title: 'Post publicado!', body: newPost.title, type: 'success' })
    setNewPostModal(false)
    setNewPost({ title: '', content: '', type: 'aviso' })
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Feed"
        subtitle="Avisos e publicações da escola"
        icon={<Rss size={20} />}
        actions={
          canCreate && (
            <Button icon={<Plus size={16} />} onClick={() => setNewPostModal(true)} size="sm">
              Nova Publicação
            </Button>
          )
        }
      />

      {myPosts.length === 0 ? (
        <EmptyState icon={<Rss size={24} />} title="Nenhuma publicação ainda" description="As publicações da escola aparecerão aqui" />
      ) : (
        <div className="space-y-4">
          {myPosts.map((post, i) => {
            const author = storage.getArray('users').find((u) => u.id === post.author_id)
            const subject = post.subject_id ? storage.getArray('subjects').find((s) => s.id === post.subject_id) : null
            const typeConfig = POST_TYPE_CONFIG[post.type]
            const TypeIcon = typeConfig.icon

            return (
              <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={post.pinned ? 'border-amber-500/30' : ''}>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar name={author?.name ?? 'Usuário'} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-dark-100">{author?.name}</span>
                        <Badge className={`${typeConfig.color} ${typeConfig.bg}`} size="sm">
                          <TypeIcon size={10} className="mr-1" />{typeConfig.label}
                        </Badge>
                        {subject && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: subject.color + '20', color: subject.color }}>
                            {subject.name}
                          </span>
                        )}
                        {post.pinned && <span className="text-xs text-amber-400">📌 Fixado</span>}
                      </div>
                      <p className="text-xs text-dark-500">{formatRelative(post.created_at)}</p>
                    </div>
                  </div>

                  <h3 className="font-semibold text-dark-50 mb-2">{post.title}</h3>
                  <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                  {post.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-700 border border-dark-600 text-sm text-dark-200">
                          <Paperclip size={14} className="text-dark-400" />
                          {att.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-700 space-y-3">
                      {post.comments.map((comment) => {
                        const commentAuthor = storage.getArray('users').find((u) => u.id === comment.author_id)
                        return (
                          <div key={comment.id} className="flex items-start gap-2">
                            <Avatar name={commentAuthor?.name ?? 'Usuário'} size="xs" />
                            <div className="flex-1 bg-dark-900 rounded-xl px-3 py-2">
                              <span className="text-xs font-medium text-dark-300 mr-2">{commentAuthor?.name}</span>
                              <span className="text-sm text-dark-200">{comment.content}</span>
                              <span className="text-xs text-dark-600 ml-2">{formatRelative(comment.created_at)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Comment input */}
                  <div className="mt-3 flex items-center gap-2">
                    <Avatar name={currentUser.name} size="xs" />
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        value={commentInputs[post.id] ?? ''}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') addComment(post.id) }}
                        placeholder="Escreva um comentário..."
                        className="flex-1 h-8 bg-dark-900 border border-dark-700 rounded-xl text-xs text-dark-100 placeholder-dark-600 px-3 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="text-amber-500 hover:text-amber-400 disabled:text-dark-600 transition-colors"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal
        open={newPostModal}
        onClose={() => setNewPostModal(false)}
        title="Nova Publicação"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setNewPostModal(false)}>Cancelar</Button>
            <Button onClick={createPost}>Publicar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(POST_TYPE_CONFIG) as [ClassroomPost['type'], typeof POST_TYPE_CONFIG['aviso']][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setNewPost({ ...newPost, type: key })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                  newPost.type === key ? `${cfg.color} ${cfg.bg} border-current` : 'text-dark-400 border-dark-700 hover:border-dark-500'
                }`}
              >
                <cfg.icon size={14} /> {cfg.label}
              </button>
            ))}
          </div>
          <Input label="Título" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} placeholder="Título da publicação" fullWidth />
          <Textarea label="Conteúdo" value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} placeholder="Escreva o conteúdo da publicação..." rows={5} fullWidth />
        </div>
      </Modal>
    </div>
  )
}
