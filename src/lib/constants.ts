import type { Permission, UserRole, League, RiskLevel } from '@/types'

// ============================================================
// PERMISSIONS
// ============================================================

export const PERMISSIONS: Record<Permission, UserRole[]> = {
  view_own_data: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'],
  view_class_data: ['professor', 'coordenador', 'diretor'],
  view_all_classes: ['coordenador', 'diretor'],
  view_analytics: ['professor', 'coordenador', 'diretor'],
  view_global_analytics: ['coordenador', 'diretor'],
  edit_grades: ['professor', 'coordenador', 'diretor'],
  edit_attendance: ['professor', 'coordenador', 'diretor'],
  create_tasks: ['professor', 'coordenador', 'diretor'],
  create_materials: ['professor', 'coordenador', 'diretor'],
  create_videos: ['professor', 'coordenador', 'diretor'],
  create_quizzes: ['professor', 'coordenador', 'diretor'],
  create_events: ['professor', 'coordenador', 'diretor'],
  manage_students: ['coordenador', 'diretor'],
  manage_teachers: ['coordenador', 'diretor'],
  manage_classes: ['coordenador', 'diretor'],
  manage_subjects: ['coordenador', 'diretor'],
  manage_users: ['coordenador', 'diretor'],
  delete_students: ['diretor'],
  delete_users: ['diretor'],
  send_notifications: ['professor', 'coordenador', 'diretor'],
  send_global_notifications: ['coordenador', 'diretor'],
  access_chat: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'],
  access_management: ['coordenador', 'diretor'],
  access_gamification: ['aluno'],
  download_reports: ['pai', 'professor', 'coordenador', 'diretor'],
  reset_passwords: ['coordenador', 'diretor'],
  configure_system: ['diretor'],
  view_risk_students: ['professor', 'coordenador', 'diretor'],
  approve_materials: ['coordenador', 'diretor'],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(role)
}

// ============================================================
// ROLE LABELS
// ============================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  aluno: 'Aluno',
  pai: 'Responsável',
  professor: 'Professor',
  coordenador: 'Coordenador',
  diretor: 'Diretor',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  aluno: 'text-electric-400 bg-electric-400/10',
  pai: 'text-purple-400 bg-purple-400/10',
  professor: 'text-green-400 bg-green-400/10',
  coordenador: 'text-amber-400 bg-amber-400/10',
  diretor: 'text-red-400 bg-red-400/10',
}

// ============================================================
// LEAGUES
// ============================================================

export const LEAGUE_CONFIG: Record<League, { label: string; min_xp: number; max_xp: number; color: string; icon: string }> = {
  bronze: { label: 'Bronze', min_xp: 0, max_xp: 999, color: '#cd7f32', icon: '🥉' },
  prata: { label: 'Prata', min_xp: 1000, max_xp: 2499, color: '#c0c0c0', icon: '🥈' },
  ouro: { label: 'Ouro', min_xp: 2500, max_xp: 4999, color: '#ffd700', icon: '🥇' },
  platina: { label: 'Platina', min_xp: 5000, max_xp: 9999, color: '#e5e4e2', icon: '💎' },
  diamante: { label: 'Diamante', min_xp: 10000, max_xp: Infinity, color: '#b9f2ff', icon: '💠' },
}

export function getLeague(xp: number): League {
  if (xp >= 10000) return 'diamante'
  if (xp >= 5000) return 'platina'
  if (xp >= 2500) return 'ouro'
  if (xp >= 1000) return 'prata'
  return 'bronze'
}

export function getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1
}

export function xpForNextLevel(xp: number): number {
  const level = getLevel(xp)
  return level * 100
}

export function xpProgress(xp: number): number {
  return xp % 100
}

// ============================================================
// GRADE STATUS
// ============================================================

export function GRADE_STATUS(avg: number, attendancePct: number): 'aprovado' | 'recuperacao' | 'reprovado' {
  if (avg >= 7 && attendancePct >= 75) return 'aprovado'
  if (avg >= 5) return 'recuperacao'
  return 'reprovado'
}

// ============================================================
// RISK
// ============================================================

export function computeRiskLevel(avg: number, frequencyPct: number): RiskLevel {
  if (avg < 5 || frequencyPct < 60) return 'vermelho'
  if (avg < 7 || frequencyPct < 75) return 'amarelo'
  return 'verde'
}

// ============================================================
// GRADE STATUS LABELS
// ============================================================

export const GRADE_STATUS_LABELS = {
  aprovado: 'Aprovado',
  recuperacao: 'Recuperação',
  reprovado: 'Reprovado',
}

export const GRADE_STATUS_COLORS = {
  aprovado: 'text-green-400 bg-green-400/10 border-green-400/20',
  recuperacao: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  reprovado: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  verde: 'Regular',
  amarelo: 'Atenção',
  vermelho: 'Risco',
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  verde: 'text-green-400 bg-green-400/10',
  amarelo: 'text-amber-400 bg-amber-400/10',
  vermelho: 'text-red-400 bg-red-400/10',
}

// ============================================================
// ASSESSMENT TYPES
// ============================================================

export const ASSESSMENT_TYPE_LABELS = {
  prova: 'Prova',
  atividade: 'Atividade',
  trabalho: 'Trabalho',
  simulado: 'Simulado',
  participacao: 'Participação',
}

// ============================================================
// SUBJECT COLORS
// ============================================================

export const SUBJECT_COLOR_PALETTE = [
  '#F59E0B', '#60A5FA', '#34D399', '#F87171',
  '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9',
  '#4ADE80', '#FACC15', '#38BDF8', '#F472B6',
]

// ============================================================
// TRIMESTER LABELS
// ============================================================

export const TRIMESTER_LABELS = {
  1: '1º Trimestre',
  2: '2º Trimestre',
  3: '3º Trimestre',
}

// ============================================================
// NAVIGATION ITEMS BY ROLE
// ============================================================

export interface NavItem {
  path: string
  label: string
  icon: string
  roles: UserRole[]
  badge?: string
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/agenda', label: 'Agenda', icon: 'CalendarDays', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/notas', label: 'Notas', icon: 'GraduationCap', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/frequencia', label: 'Frequência', icon: 'ClipboardCheck', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/tarefas', label: 'Tarefas', icon: 'CheckSquare', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/sala-de-aula', label: 'Sala de Aula', icon: 'BookOpen', roles: ['aluno', 'professor', 'coordenador', 'diretor'] },
  { path: '/materiais', label: 'Materiais', icon: 'FolderOpen', roles: ['aluno', 'professor', 'coordenador', 'diretor'] },
  { path: '/videoaulas', label: 'Videoaulas', icon: 'PlayCircle', roles: ['aluno', 'professor', 'coordenador', 'diretor'] },
  { path: '/simulados', label: 'Simulados', icon: 'ClipboardList', roles: ['aluno', 'professor', 'coordenador', 'diretor'] },
  { path: '/feed', label: 'Feed', icon: 'Rss', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/chat', label: 'Chat', icon: 'MessageSquare', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/gamificacao', label: 'Gamificação', icon: 'Trophy', roles: ['aluno'] },
  { path: '/analytics', label: 'Analytics', icon: 'BarChart3', roles: ['professor', 'coordenador', 'diretor'] },
  { path: '/notificacoes', label: 'Notificações', icon: 'Bell', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/horarios', label: 'Horários', icon: 'CalendarDays', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
  { path: '/gestao', label: 'Gestão Escolar', icon: 'Settings2', roles: ['coordenador', 'diretor'] },
  { path: '/perfil', label: 'Perfil', icon: 'User', roles: ['aluno', 'pai', 'professor', 'coordenador', 'diretor'] },
]
