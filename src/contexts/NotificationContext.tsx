import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Notification } from '@/types'
import { storage } from '@/lib/storage'
import { useAuth } from './AuthContext'

interface Toast {
  id: string
  title: string
  body: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  toasts: Toast[]
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (!currentUser) { setNotifications([]); return }
    const all = storage.getArray('notifications')
    setNotifications(all.filter((n) => n.user_id === currentUser.id))
  }, [currentUser])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = useCallback((id: string) => {
    storage.update<Notification>('notifications', id, { read: true })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    const all = storage.getArray('notifications')
    all.forEach((n) => {
      if (!n.read && currentUser && n.user_id === currentUser.id) {
        storage.update<Notification>('notifications', n.id, { read: true })
      }
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [currentUser])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}`
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, toasts, markAsRead, markAllAsRead, addToast, removeToast }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
