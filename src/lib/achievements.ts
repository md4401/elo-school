import type { Achievement, GamificationData, Mission } from '@/types'
import { generateId, dateISO } from './utils'

// ============================================================
// ALL ACHIEVEMENTS DEFINITION
// ============================================================

export const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlocked_at'>[] = [
  // NOTAS
  { id: 'ach_nota_10', key: 'nota_10', title: 'Nota Perfeita', description: 'Tire 10 em uma avaliação', icon: '⭐', xp_reward: 50, category: 'notas', rarity: 'incomum' },
  { id: 'ach_media_9', key: 'media_9', title: 'Excepcional', description: 'Média geral acima de 9.0', icon: '🌟', xp_reward: 100, category: 'notas', rarity: 'raro' },
  { id: 'ach_todas_aprovado', key: 'todas_aprovado', title: 'Honra ao Mérito', description: 'Aprovado em todas as disciplinas', icon: '🏆', xp_reward: 200, category: 'notas', rarity: 'epico' },
  { id: 'ach_melhora_nota', key: 'melhora_nota', title: 'Em Ascensão', description: 'Melhore a nota em 2 pontos em qualquer disciplina', icon: '📈', xp_reward: 75, category: 'notas', rarity: 'incomum' },
  { id: 'ach_matematica_10', key: 'matematica_10', title: 'Matemático', description: 'Tire 10 em Matemática', icon: '🔢', xp_reward: 60, category: 'notas', rarity: 'raro' },
  { id: 'ach_redacao_10', key: 'redacao_10', title: 'Escritor', description: 'Tire 10 em Português', icon: '✍️', xp_reward: 60, category: 'notas', rarity: 'raro' },

  // FREQUÊNCIA
  { id: 'ach_freq_100', key: 'freq_100', title: 'Presença Total', description: 'Frequência 100% em um mês', icon: '📅', xp_reward: 80, category: 'frequencia', rarity: 'raro' },
  { id: 'ach_freq_90', key: 'freq_90', title: 'Dedicado', description: 'Frequência acima de 90%', icon: '✅', xp_reward: 40, category: 'frequencia', rarity: 'incomum' },
  { id: 'ach_sem_falta', key: 'sem_falta', title: 'Sem Faltas', description: 'Uma semana inteira sem faltas', icon: '🎯', xp_reward: 30, category: 'frequencia', rarity: 'comum' },

  // TAREFAS
  { id: 'ach_primeira_tarefa', key: 'primeira_tarefa', title: 'Primeiros Passos', description: 'Entregue sua primeira tarefa', icon: '📝', xp_reward: 20, category: 'tarefas', rarity: 'comum' },
  { id: 'ach_10_tarefas', key: '10_tarefas', title: 'Aplicado', description: 'Complete 10 tarefas', icon: '📚', xp_reward: 50, category: 'tarefas', rarity: 'incomum' },
  { id: 'ach_50_tarefas', key: '50_tarefas', title: 'Dedicado', description: 'Complete 50 tarefas', icon: '💼', xp_reward: 150, category: 'tarefas', rarity: 'raro' },
  { id: 'ach_no_prazo', key: 'no_prazo', title: 'Pontual', description: 'Entregue 5 tarefas antes do prazo', icon: '⏰', xp_reward: 40, category: 'tarefas', rarity: 'incomum' },
  { id: 'ach_nota_max_tarefa', key: 'nota_max_tarefa', title: 'Excelência', description: 'Nota máxima em uma tarefa', icon: '💯', xp_reward: 45, category: 'tarefas', rarity: 'incomum' },

  // ENGAJAMENTO
  { id: 'ach_primeiro_login', key: 'primeiro_login', title: 'Bem-vindo!', description: 'Faça seu primeiro login', icon: '👋', xp_reward: 10, category: 'engajamento', rarity: 'comum' },
  { id: 'ach_streak_7', key: 'streak_7', title: 'Uma Semana!', description: '7 dias consecutivos de acesso', icon: '🔥', xp_reward: 70, category: 'engajamento', rarity: 'incomum' },
  { id: 'ach_streak_30', key: 'streak_30', title: 'Um Mês!', description: '30 dias consecutivos de acesso', icon: '🔥🔥', xp_reward: 300, category: 'engajamento', rarity: 'epico' },
  { id: 'ach_streak_100', key: 'streak_100', title: 'Centenário!', description: '100 dias consecutivos de acesso', icon: '💫', xp_reward: 1000, category: 'engajamento', rarity: 'lendario' },
  { id: 'ach_10_logins', key: '10_logins', title: 'Habitual', description: 'Faça 10 logins', icon: '🚀', xp_reward: 25, category: 'engajamento', rarity: 'comum' },
  { id: 'ach_primeiro_simulado', key: 'primeiro_simulado', title: 'Testando Sabedoria', description: 'Complete seu primeiro simulado', icon: '📋', xp_reward: 30, category: 'engajamento', rarity: 'comum' },
  { id: 'ach_10_simulados', key: '10_simulados', title: 'Preparado', description: 'Complete 10 simulados', icon: '🎓', xp_reward: 100, category: 'engajamento', rarity: 'raro' },
  { id: 'ach_simulado_100pct', key: 'simulado_100pct', title: 'Imbatível', description: '100% de acerto em um simulado', icon: '🏅', xp_reward: 120, category: 'engajamento', rarity: 'epico' },

  // SOCIAL
  { id: 'ach_primeira_mensagem', key: 'primeira_mensagem', title: 'Comunicativo', description: 'Envie sua primeira mensagem', icon: '💬', xp_reward: 10, category: 'social', rarity: 'comum' },
  { id: 'ach_100_mensagens', key: '100_mensagens', title: 'Popular', description: 'Envie 100 mensagens', icon: '🗣️', xp_reward: 50, category: 'social', rarity: 'incomum' },
  { id: 'ach_ranking_top3', key: 'ranking_top3', title: 'Top 3!', description: 'Entre no top 3 do ranking', icon: '🥉', xp_reward: 150, category: 'social', rarity: 'raro' },
  { id: 'ach_ranking_1', key: 'ranking_1', title: 'Número 1!', description: 'Lidere o ranking da turma', icon: '👑', xp_reward: 300, category: 'social', rarity: 'epico' },

  // ESPECIAL
  { id: 'ach_nivel_10', key: 'nivel_10', title: 'Nível 10', description: 'Alcance o nível 10', icon: '⚡', xp_reward: 200, category: 'especial', rarity: 'raro' },
  { id: 'ach_nivel_25', key: 'nivel_25', title: 'Nível 25', description: 'Alcance o nível 25', icon: '💥', xp_reward: 500, category: 'especial', rarity: 'epico' },
  { id: 'ach_nivel_50', key: 'nivel_50', title: 'Mestre', description: 'Alcance o nível 50', icon: '🌠', xp_reward: 1000, category: 'especial', rarity: 'lendario' },
  { id: 'ach_liga_prata', key: 'liga_prata', title: 'Liga Prata', description: 'Entre na Liga Prata', icon: '🥈', xp_reward: 100, category: 'especial', rarity: 'incomum' },
  { id: 'ach_liga_ouro', key: 'liga_ouro', title: 'Liga Ouro', description: 'Entre na Liga Ouro', icon: '🥇', xp_reward: 200, category: 'especial', rarity: 'raro' },
  { id: 'ach_liga_platina', key: 'liga_platina', title: 'Liga Platina', description: 'Entre na Liga Platina', icon: '💎', xp_reward: 400, category: 'especial', rarity: 'epico' },
  { id: 'ach_liga_diamante', key: 'liga_diamante', title: 'Liga Diamante', description: 'Entre na Liga Diamante', icon: '💠', xp_reward: 800, category: 'especial', rarity: 'lendario' },
]

// ============================================================
// DEFAULT MISSIONS
// ============================================================

export function createDailyMissions(): Mission[] {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  return [
    {
      id: generateId(),
      title: 'Fazer Login',
      description: 'Acesse a plataforma hoje',
      icon: '🚀',
      xp_reward: 10,
      target: 1,
      progress: 0,
      completed: false,
      type: 'daily',
      category: 'login',
      expires_at: tomorrow.toISOString(),
    },
    {
      id: generateId(),
      title: 'Entregar uma Tarefa',
      description: 'Conclua pelo menos uma tarefa hoje',
      icon: '📝',
      xp_reward: 30,
      target: 1,
      progress: 0,
      completed: false,
      type: 'daily',
      category: 'task',
      expires_at: tomorrow.toISOString(),
    },
    {
      id: generateId(),
      title: 'Fazer um Simulado',
      description: 'Complete um quiz ou simulado',
      icon: '🧠',
      xp_reward: 25,
      target: 1,
      progress: 0,
      completed: false,
      type: 'daily',
      category: 'quiz',
      expires_at: tomorrow.toISOString(),
    },
  ]
}

export function createWeeklyMissions(): Mission[] {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(0, 0, 0, 0)

  return [
    {
      id: generateId(),
      title: '5 Tarefas Esta Semana',
      description: 'Complete 5 tarefas durante a semana',
      icon: '📚',
      xp_reward: 100,
      target: 5,
      progress: 0,
      completed: false,
      type: 'weekly',
      category: 'task',
      expires_at: nextWeek.toISOString(),
    },
    {
      id: generateId(),
      title: '3 Simulados Esta Semana',
      description: 'Faça 3 simulados durante a semana',
      icon: '🎯',
      xp_reward: 80,
      target: 3,
      progress: 0,
      completed: false,
      type: 'weekly',
      category: 'quiz',
      expires_at: nextWeek.toISOString(),
    },
    {
      id: generateId(),
      title: 'Login 5 dias Seguidos',
      description: 'Acesse a plataforma por 5 dias seguidos',
      icon: '🔥',
      xp_reward: 60,
      target: 5,
      progress: 0,
      completed: false,
      type: 'weekly',
      category: 'login',
      expires_at: nextWeek.toISOString(),
    },
  ]
}

// ============================================================
// INITIALIZE GAMIFICATION DATA
// ============================================================

export function createGamificationData(student_id: string, xp = 0): GamificationData {
  const achievements: Achievement[] = ALL_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: false,
    unlocked_at: undefined as string | undefined,
  }))

  // Unlock first-login achievement
  const firstLoginIdx = achievements.findIndex((a) => a.key === 'primeiro_login')
  if (firstLoginIdx !== -1) {
    achievements[firstLoginIdx].unlocked = true
    achievements[firstLoginIdx].unlocked_at = new Date().toISOString()
  }

  return {
    id: generateId(),
    student_id,
    xp,
    level: Math.floor(xp / 100) + 1,
    league: xp >= 10000 ? 'diamante' : xp >= 5000 ? 'platina' : xp >= 2500 ? 'ouro' : xp >= 1000 ? 'prata' : 'bronze',
    streak_days: 1,
    last_activity_date: new Date().toISOString(),
    total_tasks_completed: 0,
    total_quizzes_completed: 0,
    total_logins: 1,
    total_study_minutes: 0,
    achievements,
    daily_missions: createDailyMissions(),
    weekly_missions: createWeeklyMissions(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export const RARITY_COLORS: Record<string, string> = {
  comum: 'text-gray-400 border-gray-600',
  incomum: 'text-green-400 border-green-600',
  raro: 'text-electric-400 border-electric-600',
  epico: 'text-purple-400 border-purple-600',
  lendario: 'text-amber-400 border-amber-600',
}

export const RARITY_LABELS: Record<string, string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  epico: 'Épico',
  lendario: 'Lendário',
}
