import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Star, Trophy, Target, BookOpen, CheckSquare, Zap, TrendingUp, Play, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { getLeague, getLevel, xpProgress, xpForNextLevel, LEAGUE_CONFIG } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { RARITY_COLORS } from '@/lib/achievements'

export default function StudentDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const data = useMemo(() => {
    if (!currentUser) return null
    const gamif = storage.getArray('gamification').find((g) => g.student_id === currentUser.id)
    const tasks = storage.getArray('tasks').filter((t) => t.class_id === currentUser.class_id)
    const submissions = storage.getArray('task_submissions').filter((s) => s.student_id === currentUser.id)
    const grades = storage.getArray('assessment_grades').filter((g) => g.student_id === currentUser.id)
    const attendance = storage.getArray('attendance').filter((a) => a.student_id === currentUser.id)
    const subjects = storage.getArray('subjects')
    const assessments = storage.getArray('assessments').filter((a) => a.class_id === currentUser.class_id)
    const quizzes = storage.getArray('quizzes').filter((q) => q.class_id === currentUser.class_id && q.is_published)
    const videos = storage.getArray('videos').filter((v) => v.class_id === currentUser.class_id && v.is_published)
    const leaderboard = storage.getArray('gamification')
      .filter((g) => {
        const u = storage.getArray('users').find((u) => u.id === g.student_id)
        return u?.class_id === currentUser.class_id
      })
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5)

    const pendingTasks = tasks.filter((t) => {
      const sub = submissions.find((s) => s.task_id === t.id)
      return !sub || sub.status === 'pendente'
    })

    const attendancePct = attendance.length > 0
      ? Math.round((attendance.filter((a) => a.present).length / attendance.length) * 100)
      : 100

    const avgGrade = grades.length > 0
      ? grades.filter((g) => g.score !== null).reduce((acc, g) => acc + (g.score ?? 0), 0) / grades.filter((g) => g.score !== null).length
      : 0

    return {
      gamif,
      pendingTasks: pendingTasks.slice(0, 3),
      attendancePct,
      avgGrade: Math.round(avgGrade * 10) / 10,
      subjects,
      assessments,
      quizzes: quizzes.slice(0, 3),
      videos: videos.slice(0, 3),
      leaderboard,
      recentGrades: grades.filter((g) => g.score !== null).slice(-5).reverse(),
    }
  }, [currentUser])

  if (!currentUser || !data) return null

  const xp = data.gamif?.xp ?? 0
  const league = getLeague(xp)
  const level = getLevel(xp)
  const xpProg = xpProgress(xp)
  const xpNext = xpForNextLevel(xp)
  const leagueInfo = LEAGUE_CONFIG[league]
  const streak = data.gamif?.streak_days ?? 0
  const dailyMissions = data.gamif?.daily_missions ?? []
  const weeklyMissions = data.gamif?.weekly_missions ?? []

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Hero XP Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-dark-800 to-electric-400/10 border border-amber-500/20 p-6"
      >
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/5 to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative">
            <Avatar name={currentUser.name} size="xl" />
            <span className="absolute -bottom-1 -right-1 text-xl">{leagueInfo.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-white">Olá, {currentUser.name.split(' ')[0]}! 👋</h1>
              <Badge variant="amber">Nível {level}</Badge>
              <span className="text-sm font-medium" style={{ color: leagueInfo.color }}>
                {leagueInfo.icon} Liga {leagueInfo.label}
              </span>
            </div>
            <p className="text-sm text-dark-400 mb-3">
              {xp.toLocaleString()} XP total · {xpProg}/{xpNext} para o próximo nível
            </p>
            <Progress value={xpProg} max={xpNext} color="amber" size="lg" />
          </div>

          <div className="flex gap-3">
            <div className="text-center">
              <div className="flex items-center gap-1 text-orange-400">
                <Flame size={20} />
                <span className="text-2xl font-bold">{streak}</span>
              </div>
              <p className="text-xs text-dark-500">dias de streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-amber-400">
                <Trophy size={20} />
                <span className="text-2xl font-bold">
                  {data.leaderboard.findIndex((l) => l.student_id === currentUser.id) + 1 || '—'}
                </span>
              </div>
              <p className="text-xs text-dark-500">no ranking</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Média Geral', value: data.avgGrade > 0 ? data.avgGrade.toFixed(1) : '—', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', sub: 'em todas as matérias' },
          { label: 'Frequência', value: `${data.attendancePct}%`, icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-500/10', sub: data.attendancePct >= 75 ? 'em dia ✓' : 'atenção!' },
          { label: 'Tarefas Pendentes', value: data.pendingTasks.length.toString(), icon: Target, color: 'text-electric-400', bg: 'bg-electric-500/10', sub: 'para entregar' },
          { label: 'Conquistas', value: data.gamif?.achievements.filter((a) => a.unlocked).length.toString() ?? '0', icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10', sub: `de ${data.gamif?.achievements.length ?? 0} total` },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="text-center">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-dark-50 mb-0.5">{stat.value}</p>
              <p className="text-xs font-medium text-dark-300">{stat.label}</p>
              <p className="text-xs text-dark-500">{stat.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Missions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-amber-400" />
                <h3 className="font-semibold text-dark-100">Missões do Dia</h3>
              </div>
              <Badge variant="amber">{dailyMissions.filter((m) => m.completed).length}/{dailyMissions.length}</Badge>
            </div>
            <div className="space-y-3">
              {dailyMissions.map((mission) => (
                <div key={mission.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${mission.completed ? 'border-green-500/20 bg-green-500/5' : 'border-dark-700 bg-dark-900/50'}`}>
                  <span className="text-2xl">{mission.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-100">{mission.title}</p>
                    <p className="text-xs text-dark-400">{mission.description}</p>
                    {!mission.completed && (
                      <Progress value={mission.progress} max={mission.target} size="sm" color="amber" className="mt-2" />
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {mission.completed ? (
                      <Badge variant="success">+{mission.xp_reward} XP</Badge>
                    ) : (
                      <span className="text-xs text-amber-400 font-medium">+{mission.xp_reward} XP</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Tasks */}
          {data.pendingTasks.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-electric-400" />
                  <h3 className="font-semibold text-dark-100">Tarefas Pendentes</h3>
                </div>
                <button onClick={() => navigate('/tarefas')} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  Ver todas <ChevronRight size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {data.pendingTasks.map((task) => {
                  const subject = storage.getArray('subjects').find((s) => s.id === task.subject_id)
                  const dueDate = new Date(task.due_date)
                  const isOverdue = dueDate < new Date()
                  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86400000)
                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate('/tarefas')}
                      className="flex items-start gap-3 p-3 rounded-xl border border-dark-700 hover:border-dark-500 cursor-pointer transition-all group"
                    >
                      <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: subject?.color ?? '#6b7280' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-100 group-hover:text-white transition-colors">{task.title}</p>
                        <p className="text-xs text-dark-500">{subject?.name}</p>
                      </div>
                      <Badge variant={isOverdue ? 'danger' : daysLeft <= 2 ? 'warning' : 'outline'} size="sm">
                        {isOverdue ? 'Atrasado' : daysLeft === 0 ? 'Hoje' : `${daysLeft}d`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Continue Studying */}
          {data.videos.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Play size={18} className="text-electric-400" />
                <h3 className="font-semibold text-dark-100">Continue Estudando</h3>
              </div>
              <div className="space-y-3">
                {data.videos.map((video) => {
                  const subject = storage.getArray('subjects').find((s) => s.id === video.subject_id)
                  const minutes = Math.floor(video.duration_seconds / 60)
                  return (
                    <div
                      key={video.id}
                      onClick={() => navigate('/videoaulas')}
                      className="flex items-center gap-3 p-3 rounded-xl border border-dark-700 hover:border-dark-500 cursor-pointer transition-all group"
                    >
                      <div className="w-14 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (subject?.color ?? '#374151') + '20' }}>
                        <Play size={18} style={{ color: subject?.color ?? '#60a5fa' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-100 truncate group-hover:text-white">{video.title}</p>
                        <p className="text-xs text-dark-500">{subject?.name} · {minutes}min</p>
                      </div>
                      <ChevronRight size={16} className="text-dark-600 group-hover:text-dark-300 transition-colors" />
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Ranking */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                <h3 className="font-semibold text-dark-100">Ranking da Turma</h3>
              </div>
              <button onClick={() => navigate('/gamificacao')} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                Ver mais <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {data.leaderboard.map((entry, i) => {
                const user = storage.getArray('users').find((u) => u.id === entry.student_id)
                const isMe = entry.student_id === currentUser.id
                const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                return (
                  <div
                    key={entry.student_id}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all ${isMe ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-dark-700'}`}
                  >
                    <span className="text-lg w-7 text-center shrink-0">{rankEmoji}</span>
                    <Avatar name={user?.name ?? 'Aluno'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-amber-400' : 'text-dark-200'}`}>
                        {user?.name.split(' ')[0] ?? 'Aluno'} {isMe && '(você)'}
                      </p>
                      <p className="text-xs text-dark-500">{entry.xp.toLocaleString()} XP</p>
                    </div>
                    <span className="text-xs" style={{ color: LEAGUE_CONFIG[entry.league].color }}>
                      {LEAGUE_CONFIG[entry.league].icon}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Weekly Missions */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-purple-400" />
              <h3 className="font-semibold text-dark-100">Missões da Semana</h3>
            </div>
            <div className="space-y-3">
              {weeklyMissions.map((mission) => (
                <div key={mission.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-200 flex items-center gap-2">
                      {mission.icon} {mission.title}
                    </span>
                    <span className="text-xs text-amber-400">+{mission.xp_reward}</span>
                  </div>
                  <Progress value={mission.progress} max={mission.target} size="sm" color={mission.completed ? 'green' : 'amber'} />
                  <p className="text-xs text-dark-500">{mission.progress}/{mission.target} {mission.completed && '✓'}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent unlocked achievements */}
          {data.gamif && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-amber-400" />
                <h3 className="font-semibold text-dark-100">Conquistas Recentes</h3>
              </div>
              <div className="space-y-2">
                {data.gamif.achievements
                  .filter((a) => a.unlocked)
                  .slice(-4)
                  .reverse()
                  .map((ach) => (
                    <div key={ach.id} className={`flex items-center gap-3 p-2 rounded-xl border ${RARITY_COLORS[ach.rarity]}`}>
                      <span className="text-2xl">{ach.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-100">{ach.title}</p>
                        <p className="text-xs text-dark-500">+{ach.xp_reward} XP</p>
                      </div>
                    </div>
                  ))}
                {data.gamif.achievements.filter((a) => a.unlocked).length === 0 && (
                  <p className="text-sm text-dark-500 text-center py-4">Nenhuma conquista ainda. Continue estudando!</p>
                )}
              </div>
              <button
                onClick={() => navigate('/gamificacao')}
                className="w-full mt-3 text-xs text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1"
              >
                <TrendingUp size={14} /> Ver todas as conquistas
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
