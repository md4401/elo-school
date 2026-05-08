import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import { cn } from '@/lib/utils'

const typeConfig = {
  success: { icon: CheckCircle, classes: 'border-green-500/30 bg-green-500/10 text-green-400' },
  error: { icon: XCircle, classes: 'border-red-500/30 bg-red-500/10 text-red-400' },
  warning: { icon: AlertTriangle, classes: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
  info: { icon: Info, classes: 'border-electric-500/30 bg-electric-500/10 text-electric-400' },
}

export function ToastContainer() {
  const { toasts, removeToast } = useNotifications()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = typeConfig[toast.type]
          const Icon = config.icon

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border bg-dark-800 shadow-2xl max-w-sm',
                config.classes
              )}
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-100">{toast.title}</p>
                <p className="text-xs text-dark-400 mt-0.5">{toast.body}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-dark-500 hover:text-dark-300 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
