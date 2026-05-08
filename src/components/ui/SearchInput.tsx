import { Search } from 'lucide-react'
import { Input } from './Input'
import type { InputHTMLAttributes } from 'react'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function SearchInput({ label, ...props }: SearchInputProps) {
  return (
    <Input
      label={label}
      icon={<Search size={16} />}
      placeholder="Buscar..."
      {...props}
    />
  )
}
