import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CalendarDays, GraduationCap, ClipboardCheck,
  CheckSquare, BookOpen, FolderOpen, PlayCircle, ClipboardList,
  Rss, MessageSquare, Trophy, BarChart3, Bell, Settings2, User,
  ChevronLeft, ChevronRight, LogOut, Moon, Sun, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { usePermissions } from '@/hooks/usePermissions'
import { NAV_ITEMS, ROLE_LABELS } from '@/lib/constants'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, CalendarDays, GraduationCap, ClipboardCheck,
  CheckSquare, BookOpen, FolderOpen, PlayCircle, ClipboardList,
  Rss, MessageSquare, Trophy, BarChart3, Bell, Settings2, User,
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { currentUser, logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const { unreadCount } = useNotifications()
  const { can } = usePermissions()
  const navigate = useNavigate()

  if (!currentUser) return null

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role))

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-full bg-dark-800 border-r border-dark-700 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-dark-700 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-dark-900" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <span className="text-xl font-bold text-white tracking-tight">Elo</span>
                <span className="block text-xs text-dark-400 font-normal leading-none -mt-0.5">Gestão Escolar</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onToggle}
          className="ml-auto shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon = ICON_MAP[item.icon]
          if (!Icon) return null
          const badge = item.path === '/notificacoes' ? unreadCount : 0

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700'
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {badge > 0 && !collapsed && (
                <span className="ml-auto min-w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-dark-900 text-xs font-bold px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {badge > 0 && collapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
              {collapsed && (
                <span className="absolute left-14 z-50 bg-dark-700 text-dark-100 text-xs px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-dark-600">
                  {item.label}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-dark-700 p-2 space-y-1 shrink-0">
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors',
          )}
        >
          {isDark ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isDark ? 'Modo Claro' : 'Modo Escuro'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User card */}
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-lg bg-dark-900 mt-1', collapsed && 'justify-center')}>
          <Avatar name={currentUser.name} size="sm" className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-dark-100 truncate">{currentUser.name}</p>
                <Badge variant="amber" size="sm" className="mt-0.5">
                  {ROLE_LABELS[currentUser.role]}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
