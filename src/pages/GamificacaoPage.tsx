import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Flame, Zap, Target, Crown, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { getLeague, getLevel, xpProgress, xpForNextLevel, LEAGUE_CONFIG } from '@/lib/constants'
import { RARITY_COLORS, RARITY_LABELS } from '@/lib/achievements'
import type { Achievement } from '@/types'

const CATEGORY_LABELS: Record<Achievement['category'], string> = {
  notas: '📚 Notas',
  frequencia: '📅 Frequência',
  tarefas: '✅ Tarefas',
  engajamento: '🚀 Engajamento',
  social: '💬 Social',
  especial: '⭐ Especial',
}

export default function GamificacaoPage() {
  const { currentUser } = useAuth()

  const data = useMemo(() => {
    if (!currentUser) return null
    const gamif = storage.getArray('gamification').find((g) => g.student_id === currentUser.id)
    if (!gamif) return null

    const leaderboard = storage.getArray('gamification')
      .filter((g) => {
        const u = storage.getArray('users').find((u) => u.id === g.student_id)
        return u?.class_id === currentUser.class_id
      })
      .sort((a, b) => b.xp - a.xp)
      .map((g, idx) => {
        const user = storage.getArray('users').find((u) => u.id === g.student_id)
        return { ...g, user, rank: idx + 1 }
      })

    const achievementsByCategory = Object.entries(CATEGORY_LABELS).reduce((acc, [cat]) => {
      acc[cat as Achievement['category']] = gamif.achievements.filter((a) => a.category === cat)
      return acc
    }, {} as Record<Achievement['category'], Achievement[]>)

    return { gamif, leaderboard, achievementsByCategory }
  }, [currentUser])

  if (!currentUser || !data || !data.gamif) return null

  const { gamif, leaderboard, achievementsByCategory } = data
  const xp = gamif.xp
  const league = getLeague(xp)
  const level = getLevel(xp)
  const xpProg = xpProgress(xp)
  const xpNext = xpForNextLevel(xp)
  const leagueInfo = LEAGUE_CONFIG[league]
  const myRank = leaderboard.find((l) => l.student_id === currentUser.id)?.rank ?? 0
  const unlockedCount = gamif.achievements.filter((a) => a.unlocked).length
  const totalCount = gamif.achievements.length

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader title="Gamificação" subtitle="Seu progresso, conquistas e ranking" icon={<Trophy size={20} />} />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-dark-800 via-dark-900 to-dark-800 border border-dark-700"
      >
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 60%), radial-gradient(circle at 80% 50%, #60a5fa 0%, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar + league */}
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar name={currentUser.name} size="xl" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-3xl">{leagueInfo.icon}</span>
            </div>
            <p className="text-sm font-semibold mt-3" style={{ color: leagueInfo.color }}>Liga {leagueInfo.label}</p>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-black text-white">Nível {level}</span>
                <span className="text-lg text-dark-400">{xp.toLocaleString()} XP</span>
                {myRank > 0 && (
                  <Badge variant="amber" className="ml-auto">#{myRank} no ranking</Badge>
                )}
              </div>
              <Progress value={xpProg} max={xpNext} size="lg" color="amber" label={`${xpProg}/${xpNext} XP para Nível ${level + 1}`} showLabel />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Flame, value: gamif.streak_days, label: 'Streak', color: 'text-orange-400' },
                { icon: Star, value: `${unlockedCount}/${totalCount}`, label: 'Conquistas', color: 'text-amber-400' },
                { icon: Target, value: gamif.total_tasks_completed, label: 'Tarefas', color: 'text-green-400' },
                { icon: Zap, value: gamif.total_quizzes_completed, label: 'Simulados', color: 'text-electric-400' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 p-3 rounded-xl bg-dark-800/60 border border-dark-700">
                  <stat.icon size={18} className={stat.color} />
                  <div>
                    <p className="text-lg font-bold text-dark-50">{stat.value}</p>
                    <p className="text-xs text-dark-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="conquistas">
        <TabsList>
          <TabsTrigger value="conquistas">Conquistas ({unlockedCount})</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="missoes">Missões</TabsTrigger>
          <TabsTrigger value="ligas">Ligas</TabsTrigger>
        </TabsList>

        {/* Achievements */}
        <TabsContent value="conquistas" className="mt-6 space-y-6">
          {(Object.entries(achievementsByCategory) as [Achievement['category'], Achievement[]][]).map(([category, achievements]) => (
            <div key={category}>
              <h3 className="font-semibold text-dark-200 mb-3">{CATEGORY_LABELS[category]}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {achievements.map((ach) => (
                  <motion.div
                    key={ach.id}
                    whileHover={{ scale: ach.unlocked ? 1.02 : 1 }}
                    className={`relative p-4 rounded-xl border text-center transition-all ${
                      ach.unlocked
                        ? `${RARITY_COLORS[ach.rarity]} bg-dark-800`
                        : 'border-dark-700 bg-dark-900/50 opacity-50'
                    }`}
                  >
                    <span className={`text-3xl ${!ach.unlocked && 'grayscale'}`}>{ach.icon}</span>
                    <p className="text-sm font-semibold text-dark-100 mt-2">{ach.title}</p>
                    <p className="text-xs text-dark-400 mt-1">{ach.description}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Badge
                        className={`text-xs ${RARITY_COLORS[ach.rarity]}`}
                        size="sm"
                      >
                        {RARITY_LABELS[ach.rarity]}
                      </Badge>
                    </div>
                    {ach.unlocked && (
                      <p className="text-xs text-amber-400 mt-1 font-medium">+{ach.xp_reward} XP</p>
                    )}
                    {!ach.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                        <span className="text-3xl">🔒</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Ranking */}
        <TabsContent value="ranking" className="mt-6">
          <Card>
            <h3 className="font-semibold text-dark-100 mb-4">Ranking da Turma</h3>
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const isMe = entry.student_id === currentUser.id
                const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null
                const leagueInfo = LEAGUE_CONFIG[entry.league]

                return (
                  <motion.div
                    key={entry.student_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (entry.rank - 1) * 0.05 }}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      isMe ? 'border-amber-500/30 bg-amber-500/10' : 'border-dark-700 hover:border-dark-600 bg-dark-800'
                    }`}
                  >
                    <div className="w-8 text-center shrink-0">
                      {rankEmoji ? (
                        <span className="text-xl">{rankEmoji}</span>
                      ) : (
                        <span className="text-sm font-bold text-dark-400">#{entry.rank}</span>
                      )}
                    </div>
                    <Avatar name={entry.user?.name ?? 'Aluno'} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isMe ? 'text-amber-400' : 'text-dark-100'}`}>
                        {entry.user?.name ?? 'Aluno'} {isMe && '(você)'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: leagueInfo.color }}>{leagueInfo.icon} {leagueInfo.label}</span>
                        <span className="text-xs text-dark-500">Nível {getLevel(entry.xp)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-400">{entry.xp.toLocaleString()}</p>
                      <p className="text-xs text-dark-500">XP</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Missions */}
        <TabsContent value="missoes" className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold text-dark-200 mb-3">Missões do Dia</h3>
            <div className="space-y-3">
              {gamif.daily_missions.map((mission) => (
                <Card key={mission.id} className={mission.completed ? 'border-green-500/20 bg-green-500/5' : ''}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{mission.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-dark-100">{mission.title}</p>
                        <Badge variant={mission.completed ? 'success' : 'amber'}>{mission.completed ? 'Completa!' : `+${mission.xp_reward} XP`}</Badge>
                      </div>
                      <p className="text-sm text-dark-400 mb-2">{mission.description}</p>
                      <Progress value={mission.progress} max={mission.target} size="sm" color={mission.completed ? 'green' : 'amber'} label={`${mission.progress}/${mission.target}`} showLabel />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-dark-200 mb-3">Missões da Semana</h3>
            <div className="space-y-3">
              {gamif.weekly_missions.map((mission) => (
                <Card key={mission.id} className={mission.completed ? 'border-green-500/20 bg-green-500/5' : ''}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{mission.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-dark-100">{mission.title}</p>
                        <Badge variant={mission.completed ? 'success' : 'purple'}>{mission.completed ? 'Completa!' : `+${mission.xp_reward} XP`}</Badge>
                      </div>
                      <p className="text-sm text-dark-400 mb-2">{mission.description}</p>
                      <Progress value={mission.progress} max={mission.target} size="md" color={mission.completed ? 'green' : 'purple'} label={`${mission.progress}/${mission.target}`} showLabel />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Leagues */}
        <TabsContent value="ligas" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.entries(LEAGUE_CONFIG) as [string, typeof LEAGUE_CONFIG['bronze']][]).map(([key, league]) => {
              const isCurrent = getLeague(xp) === key
              const isPassed = xp > league.max_xp
              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  className={`p-5 rounded-2xl border text-center transition-all ${
                    isCurrent ? 'border-2' : isPassed ? 'border-dark-700 bg-dark-800/50' : 'border-dark-700 bg-dark-800 opacity-60'
                  }`}
                  style={isCurrent ? { borderColor: league.color, backgroundColor: league.color + '10' } : {}}
                >
                  <span className="text-5xl">{league.icon}</span>
                  <h3 className="text-lg font-bold mt-3" style={{ color: league.color }}>{league.label}</h3>
                  <p className="text-sm text-dark-400 mt-1">
                    {league.max_xp === Infinity ? `${league.min_xp.toLocaleString()}+ XP` : `${league.min_xp.toLocaleString()} – ${league.max_xp.toLocaleString()} XP`}
                  </p>
                  {isCurrent && (
                    <div className="mt-3">
                      <Badge className="text-sm px-3 py-1" style={{ color: league.color, backgroundColor: league.color + '20' }}>
                        Liga Atual ✓
                      </Badge>
                      <div className="mt-2">
                        <Progress value={xp - league.min_xp} max={league.max_xp === Infinity ? xp : league.max_xp - league.min_xp} size="sm" color="amber" />
                      </div>
                    </div>
                  )}
                  {isPassed && !isCurrent && (
                    <Badge variant="success" className="mt-3">Completada ✓</Badge>
                  )}
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
