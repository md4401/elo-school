import { useState, useMemo, useEffect } from 'react'
import { Bell, CheckCheck, Trash2, Plus, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage, subscribeToKey } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { hasPermission } from '@/lib/constants'
import { formatRelative, generateId, nowISO } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types'

const TYPE_CONFIG: Record<NotificationType, { label: string; color: string; bg: string; emoji: string }> = {
  grade:       { label: 'Nota',       color: 'text-amber-400',   bg: 'bg-amber-500/10',   emoji: '📝' },
  attendance:  { label: 'Frequência', color: 'text-blue-400',    bg: 'bg-blue-500/10',    emoji: '📅' },
  task:        { label: 'Tarefa',     color: 'text-green-400',   bg: 'bg-green-500/10',   emoji: '✅' },
  message:     { label: 'Mensagem',   color: 'text-purple-400',  bg: 'bg-purple-500/10',  emoji: '💬' },
  achievement: { label: 'Conquista',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  emoji: '🏆' },
  event:       { label: 'Evento',     color: 'text-teal-400',    bg: 'bg-teal-500/10',    emoji: '📆' },
  system:      { label: 'Sistema',    color: 'text-dark-400',    bg: 'bg-dark-700',       emoji: '⚙️' },
  general:     { label: 'Geral',      color: 'text-dark-300',    bg: 'bg-dark-700',       emoji: '📌' },
}

export default function NotificacoesPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [filterType, setFilterType] = useState<NotificationType | ''>('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(() => storage.getArray('notifications'))
  const [sendModal, setSendModal] = useState(false)
  const [sendForm, setSendForm] = useState({ title: '', body: '', type: 'general' as NotificationType, target: 'all', target_user_id: '', target_class_id: '' })

  const canSend = currentUser ? hasPermission(currentUser.role, 'send_notifications') : false

  // Realtime: refresh when Supabase pushes new notifications
  useEffect(() => {
    return subscribeToKey('notifications', () =>
      setNotifications(storage.getArray('notifications')),
    )
  }, [])
  const allUsers = useMemo(() => storage.getArray('users').filter((u) => u.id !== currentUser?.id), [currentUser])
  const allClasses = useMemo(() => storage.getArray('classes'), [])

  const myNotifications = useMemo(() => {
    if (!currentUser) return []
    let filtered = notifications.filter((n) => n.user_id === currentUser.id)
    if (filterType) filtered = filtered.filter((n) => n.type === filterType)
    if (showUnreadOnly) filtered = filtered.filter((n) => !n.read)
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [notifications, currentUser, filterType, showUnreadOnly])

  const unreadCount = useMemo(() =>
    notifications.filter((n) => n.user_id === currentUser?.id && !n.read).length,
    [notifications, currentUser]
  )

  function markAsRead(id: string) {
    storage.update<Notification>('notifications', id, { read: true })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  function markAllAsRead() {
    if (!currentUser) return
    const updated = notifications.map((n) => n.user_id === currentUser.id ? { ...n, read: true } : n)
    storage.set('notifications', updated)
    setNotifications(updated)
  }

  function deleteNotification(id: string) {
    storage.remove_item('notifications', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  function sendNotification() {
    if (!currentUser || !sendForm.title.trim()) {
      addToast({ title: 'Título obrigatório', body: '', type: 'error' }); return
    }
    let targets: string[] = []
    if (sendForm.target === 'all') {
      targets = allUsers.map((u) => u.id)
    } else if (sendForm.target === 'class' && sendForm.target_class_id) {
      const cls = allClasses.find((c) => c.id === sendForm.target_class_id)
      if (cls) targets = allUsers.filter((u) => u.class_id === cls.id || cls.teacher_ids.includes(u.id)).map((u) => u.id)
    } else if (sendForm.target === 'user' && sendForm.target_user_id) {
      targets = [sendForm.target_user_id]
    }
    if (targets.length === 0) { addToast({ title: 'Nenhum destinatário selecionado', body: '', type: 'error' }); return }
    const newNotifs: Notification[] = targets.map((uid) => ({
      id: generateId(),
      user_id: uid,
      type: sendForm.type,
      title: sendForm.title.trim(),
      body: sendForm.body.trim(),
      priority: 'medium',
      read: false,
      created_at: nowISO(),
    }))
    newNotifs.forEach((n) => storage.push('notifications', n))
    setNotifications((prev) => [...prev, ...newNotifs])
    setSendModal(false)
    setSendForm({ title: '', body: '', type: 'general', target: 'all', target_user_id: '', target_class_id: '' })
    addToast({ title: 'Notificação enviada!', body: `Para ${targets.length} usuário${targets.length !== 1 ? 's' : ''}`, type: 'success' })
  }

  if (!currentUser) return null

  const typeKeys = Object.keys(TYPE_CONFIG) as NotificationType[]

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Notificações"
        subtitle={unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Tudo em dia'}
        icon={<Bell size={20} />}
        actions={
          <div className="flex gap-2">
            {canSend && (
              <Button size="sm" icon={<Send size={14} />} onClick={() => setSendModal(true)}>
                Enviar Notificação
              </Button>
            )}
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" icon={<CheckCheck size={14} />} onClick={markAllAsRead}>
                Marcar como lidas
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
            showUnreadOnly ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-dark-700 text-dark-400 hover:border-dark-500'
          }`}
        >
          Não lidas {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
            !filterType ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-dark-700 text-dark-400 hover:border-dark-500'
          }`}
        >
          Todas
        </button>
        {typeKeys.map((type) => {
          const cfg = TYPE_CONFIG[type]
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? '' : type)}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                filterType === type ? `border-current ${cfg.color} ${cfg.bg}` : 'border-dark-700 text-dark-400 hover:border-dark-500'
              }`}
            >
              {cfg.emoji} {cfg.label}
            </button>
          )
        })}
      </div>

      {myNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} />}
          title={showUnreadOnly ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          description={showUnreadOnly ? 'Você está em dia!' : 'Suas notificações aparecerão aqui'}
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {myNotifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.general
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      !notif.read
                        ? 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
                        : 'border-dark-700 hover:border-dark-600 bg-dark-800'
                    }`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${config.bg}`}>
                      {config.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm font-medium ${!notif.read ? 'text-dark-50' : 'text-dark-200'}`}>
                            {notif.title}
                            {!notif.read && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block align-middle" />}
                          </p>
                          {notif.body && <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{notif.body}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`${config.color} ${config.bg} text-xs`} size="sm">{config.label}</Badge>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                            className="text-dark-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-dark-600 mt-1">{formatRelative(notif.created_at)}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Send notification modal */}
      <Modal
        open={sendModal}
        onClose={() => setSendModal(false)}
        title="Enviar Notificação"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setSendModal(false)}>Cancelar</Button>
            <Button icon={<Send size={14} />} onClick={sendNotification}>Enviar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título *"
            value={sendForm.title}
            onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
            placeholder="Título da notificação"
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Mensagem</label>
            <textarea
              value={sendForm.body}
              onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
              rows={3}
              placeholder="Texto da notificação..."
              className="w-full bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={sendForm.type}
              onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as NotificationType })}
              options={[
                { value: 'general', label: 'Geral' },
                { value: 'task', label: 'Tarefa' },
                { value: 'event', label: 'Evento' },
                { value: 'grade', label: 'Nota' },
                { value: 'attendance', label: 'Frequência' },
                { value: 'system', label: 'Sistema' },
              ]}
              fullWidth
            />
            <Select
              label="Destinatários"
              value={sendForm.target}
              onChange={(e) => setSendForm({ ...sendForm, target: e.target.value, target_user_id: '', target_class_id: '' })}
              options={[
                { value: 'all', label: 'Todos os usuários' },
                { value: 'class', label: 'Por turma' },
                { value: 'user', label: 'Usuário específico' },
              ]}
              fullWidth
            />
          </div>
          {sendForm.target === 'class' && (
            <Select
              label="Turma"
              value={sendForm.target_class_id}
              onChange={(e) => setSendForm({ ...sendForm, target_class_id: e.target.value })}
              options={[{ value: '', label: 'Selecione a turma' }, ...allClasses.map((c) => ({ value: c.id, label: c.name }))]}
              fullWidth
            />
          )}
          {sendForm.target === 'user' && (
            <Select
              label="Usuário"
              value={sendForm.target_user_id}
              onChange={(e) => setSendForm({ ...sendForm, target_user_id: e.target.value })}
              options={[{ value: '', label: 'Selecione o usuário' }, ...allUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))]}
              fullWidth
            />
          )}
        </div>
      </Modal>
    </div>
  )
}
