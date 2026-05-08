import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initial
    } catch {
      return initial
    }
  })

  const set = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof newValue === 'function' ? (newValue as (p: T) => T)(prev) : newValue
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }, [key])

  return [value, set] as const
}
