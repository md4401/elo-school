import { createContext, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  active: string
  setActive: (value: string) => void
}

const TabsContext = createContext<TabsContextValue>({ active: '', setActive: () => {} })

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (v: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value ?? internal
  const setActive = (v: string) => { setInternal(v); onValueChange?.(v) }

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn('', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-1 bg-dark-900 border border-dark-700 rounded-xl p-1', className)}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { active, setActive } = useContext(TabsContext)
  const isActive = active === value

  return (
    <button
      onClick={() => !disabled && setActive(value)}
      disabled={disabled}
      className={cn(
        'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
        isActive
          ? 'bg-dark-800 text-amber-400 border border-dark-600 shadow-sm'
          : 'text-dark-400 hover:text-dark-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null

  return <div className={cn('animate-fade-in', className)}>{children}</div>
}
