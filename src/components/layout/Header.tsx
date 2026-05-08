import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { Avatar } from '@/components/ui/Avatar'
import { ROLE_LABELS } from '@/lib/constants'

interface HeaderProps {
  title?: string
  subtitle?: string
  onMobileMenuToggle?: () => void
}

export function Header({ title, subtitle, onMobileMenuToggle }: HeaderProps) {
  const { currentUser } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  if (!currentUser) return null

  return (
    <header className="h-16 border-b border-dark-700 bg-dark-800/80 backdrop-blur-sm flex items-center gap-4 px-4 lg:px-6 shrink-0 sticky top-0 z-30">
      {/* Mobile menu */}
      <button
        className="lg:hidden text-dark-400 hover:text-dark-200"
        onClick={onMobileMenuToggle}
      >
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-base font-semibold text-dark-100 truncate">{title}</h1>
        )}
        {subtitle && (
          <p className="text-xs text-dark-400 truncate">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-9 bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-500 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => { setSearchOpen((o) => !o); setSearchQuery('') }}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
        >
          {searchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notificacoes')}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>

        {/* User */}
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2.5 h-9 px-2 rounded-lg hover:bg-dark-700 transition-colors"
        >
          <Avatar name={currentUser.name} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-dark-200 leading-none">{currentUser.name.split(' ')[0]}</p>
            <p className="text-xs text-dark-500 leading-none mt-0.5">{ROLE_LABELS[currentUser.role]}</p>
          </div>
        </button>
      </div>
    </header>
  )
}
