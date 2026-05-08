import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  footer?: ReactNode
  hideClose?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
}

export function Modal({ open, onClose, title, description, children, size = 'md', footer, hideClose }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'relative w-full bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]',
              sizeClasses[size]
            )}
          >
            {(title || !hideClose) && (
              <div className="flex items-start justify-between p-6 border-b border-dark-700 shrink-0">
                <div>
                  {title && <h2 className="text-lg font-semibold text-dark-50">{title}</h2>}
                  {description && <p className="text-sm text-dark-400 mt-1">{description}</p>}
                </div>
                {!hideClose && (
                  <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={16} />} className="ml-4 -mt-1" />
                )}
              </div>
            )}
            <div className="overflow-y-auto flex-1 p-6">
              {children}
            </div>
            {footer && (
              <div className="border-t border-dark-700 p-6 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
