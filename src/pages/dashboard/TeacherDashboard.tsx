import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, GraduationCap, ClipboardCheck, AlertTriangle, TrendingUp, CheckSquare, BookOpen, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { computeRiskLevel, RISK_COLORS, RISK_LABELS } from '@/lib/constants'
import { computeWeightedAverage } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function TeacherDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const data = useMemo(() => {
    if (!currentUser) return null
    const classes = storage.getArray('classes').filter((c) => c.teacher_ids.includes(currentUser.id))
    const myClassIds = classes.map((c) => c.id)
    const allStudents = storage.getArray('users').filter((u) => u.role === 'aluno' && myClassIds.includes(u.class_id ?? ''))
    const assessments = storage.getArray('assessments').filter((a) => a.teacher_id === currentUser.id)
    const grades = storage.getArray('assessment_grades')
    const attendance = storage.getArray('attendance').filter((a) => a.teacher_id === currentUser.id)
    const tasks = storage.getArray('tasks').filter((t) => t.teacher_id === currentUser.id)
    const submissions = storage.getArray('task_submissions')
    const subjects = storage.getArray('subjects')

    const pendingCorrections = tasks.filter((t) => {
      const subs = submissions.filter((s) => s.task_id === t.id && s.status === 'entregue')
      return subs.length > 0
    }).length

    const riskStudents = allStudents.map((student) => {
      const studentAssessments = assessments.filter((a) => myClassIds.includes(a.class_id))
      const avg = computeWeightedAverage(studentAssessments, grades, student.id)
      const studentAtt = attendance.filter((a) => a.student_id === student.id)
      const freqPct = studentAtt.length > 0 ? (studentAtt.filter((a) => a.present).length / studentAtt.length) * 100 : 100
      return { student, avg, freqPct, risk: computeRiskLevel(avg, freqPct) }
    }).filter((s) => s.risk !== 'verde').slice(0, 5)

    const classStats = classes.map((cls) => {
      const classStudents = allStudents.filter((s) => s.class_id === cls.id)
      const classAssessments = assessments.filter((a) => a.class_id === cls.id)
      const avgGrade = classStudents.length > 0
        ? classStudents.reduce((acc, s) => acc + computeWeightedAverage(classAssessments, grades, s.id), 0) / classStudents.length
        : 0
      const classAtt = attendance.filter((a) => a.class_id === cls.id)
      const freqPct = classAtt.length > 0 ? (classAtt.filter((a) => a.present).length / classAtt.length) * 100 : 100
      return { name: cls.name, avgGrade: Math.round(avgGrade * 10) / 10, freqPct: Math.round(freqPct) }
    })

    const subjectPerformance = subjects
      .filter((s) => (currentUser.subject_ids ?? []).includes(s.id))
      .map((sub) => {
        const subAssessments = assessments.filter((a) => a.subject_id === sub.id)
        const validGrades = grades.filter((g) => subAssessments.some((a) => a.id === g.assessment_id) && g.score !== null)
        const avg = validGrades.length > 0
          ? validGrades.reduce((acc, g) => acc + (g.score ?? 0), 0) / validGrades.length
          : 0
        return { name: sub.name.substring(0, 8), avg: Math.round(avg * 10) / 10, color: sub.color }
      })

    return {
      classes,
      totalStudents: allStudents.length,
      pendingCorrections,
      riskStudents,
      classStats,
      subjectPerformance,
      recentTasks: tasks.slice(-3).reverse(),
      subjects,
    }
  }, [currentUser])

  if (!currentUser || !data) return null

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Olá, Prof. {currentUser.name.split(' ').pop()}! 👋</h1>
          <p className="text-dark-400 mt-1">Você tem {data.pendingCorrections} atividade{data.pendingCorrections !== 1 ? 's' : ''} para corrigir</p>
        </div>
        <Avatar name={currentUser.name} size="lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Turmas', value: data.classes.length, icon: BookOpen, color: 'text-electric-400', bg: 'bg-electric-500/10' },
          { label: 'Alunos', value: data.totalStudents, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Corrigir', value: data.pendingCorrections, icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10', alert: data.pendingCorrections > 0 },
          { label: 'Em Risco', value: data.riskStudents.length, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', alert: data.riskStudents.length > 0 },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="text-center relative">
              {stat.alert && <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full" />}
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-dark-50">{stat.value}</p>
              <p className="text-xs text-dark-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 space-y-6">
          {data.subjectPerformance.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-electric-400" />
                <h3 className="font-semibold text-dark-100">Desempenho por Disciplina</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.subjectPerformance} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
                      formatter={(v) => [`${v}`, 'Média']}
                    />
                    <Bar dataKey="avg" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Class stats */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-amber-400" />
                <h3 className="font-semibold text-dark-100">Minhas Turmas</h3>
              </div>
              <button onClick={() => navigate('/analytics')} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                Analytics <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-4">
              {data.classStats.map((cls) => (
                <div key={cls.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-200">{cls.name}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant={cls.avgGrade >= 7 ? 'success' : cls.avgGrade >= 5 ? 'warning' : 'danger'} size="sm">
                        Média {cls.avgGrade}
                      </Badge>
                      <Badge variant={cls.freqPct >= 75 ? 'success' : 'warning'} size="sm">
                        {cls.freqPct}% freq
                      </Badge>
                    </div>
                  </div>
                  <Progress value={cls.avgGrade} max={10} size="sm" color={cls.avgGrade >= 7 ? 'green' : cls.avgGrade >= 5 ? 'amber' : 'red'} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Risk students */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-400" />
              <h3 className="font-semibold text-dark-100">Alunos em Atenção</h3>
            </div>
            {data.riskStudents.length === 0 ? (
              <p className="text-sm text-dark-500 text-center py-8">Nenhum aluno em risco 🎉</p>
            ) : (
              <div className="space-y-2">
                {data.riskStudents.map(({ student, avg, freqPct, risk }) => (
                  <div key={student.id} className="flex items-center gap-3 p-2 rounded-xl border border-dark-700">
                    <Avatar name={student.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-200 truncate">{student.name}</p>
                      <p className="text-xs text-dark-500">Média {avg.toFixed(1)} · Freq {freqPct.toFixed(0)}%</p>
                    </div>
                    <Badge variant={risk === 'vermelho' ? 'danger' : 'warning'} size="sm">
                      {RISK_LABELS[risk]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/analytics')}
              className="w-full mt-3 text-xs text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1"
            >
              Ver analytics completo <ChevronRight size={14} />
            </button>
          </Card>

          {/* Recent tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-electric-400" />
                <h3 className="font-semibold text-dark-100">Tarefas Recentes</h3>
              </div>
              <button onClick={() => navigate('/tarefas')} className="text-xs text-amber-400 hover:text-amber-300">Ver todas</button>
            </div>
            <div className="space-y-2">
              {data.recentTasks.map((task) => {
                const subject = data.subjects.find((s) => s.id === task.subject_id)
                const subs = storage.getArray('task_submissions').filter((s) => s.task_id === task.id)
                return (
                  <div key={task.id} className="p-3 rounded-xl border border-dark-700 hover:border-dark-500 transition-all cursor-pointer" onClick={() => navigate('/tarefas')}>
                    <p className="text-sm font-medium text-dark-100 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-dark-500">{subject?.name}</span>
                      <span className="text-dark-600">·</span>
                      <span className="text-xs text-dark-500">{subs.length} entregas</span>
                    </div>
                  </div>
                )
              })}
              {data.recentTasks.length === 0 && (
                <p className="text-sm text-dark-500 text-center py-6">Nenhuma tarefa criada ainda</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
