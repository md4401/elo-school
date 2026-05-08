import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AssessmentGrade, Assessment } from '@/types'

// ============================================================
// DATE UTILS
// ============================================================

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return `Hoje às ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Ontem às ${format(d, 'HH:mm')}`
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function formatShortTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function dateISO(offset_days = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset_days)
  return d.toISOString()
}

// ============================================================
// ID GENERATOR
// ============================================================

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

// ============================================================
// GRADE CALCULATION
// ============================================================

export function computeWeightedAverage(
  assessments: Assessment[],
  grades: AssessmentGrade[],
  student_id: string
): number {
  const pairs = assessments
    .map((a) => {
      const g = grades.find((gr) => gr.assessment_id === a.id && gr.student_id === student_id)
      return g?.score != null ? { score: g.score, weight: a.weight } : null
    })
    .filter((p): p is { score: number; weight: number } => p !== null)

  if (pairs.length === 0) return 0
  const sumWeights = pairs.reduce((acc, p) => acc + p.weight, 0)
  if (sumWeights === 0) return 0
  const sumWeighted = pairs.reduce((acc, p) => acc + p.score * p.weight, 0)
  return Math.round((sumWeighted / sumWeights) * 100) / 100
}

// ============================================================
// CLASS NAMES HELPER
// ============================================================

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================================
// MISC
// ============================================================

export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max) + '…'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
