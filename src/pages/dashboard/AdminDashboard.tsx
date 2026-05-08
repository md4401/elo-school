import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, BookOpen, AlertTriangle, TrendingUp, GraduationCap, Bell, Settings2, ChevronRight, Award } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { computeRiskLevel, RISK_LABELS } from '@/lib/constants'
import { computeWeightedAverage } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'

export default function AdminDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const data = useMemo(() => {
    const users = storage.getArray('users')
    const classes = storage.getArray('classes')
    const subjects = storage.getArray('subjects')
    const assessments = storage.getArray('assessments')
    const grades = storage.getArray('assessment_grades')
    const attendance = storage.getArray('attendance')
    const notifications = storage.getArray('notifications').filter((n) => !n.read && n.user_id === currentUser?.id)

    const students = users.filter((u) => u.role === 'aluno')
    const teachers = users.filter((u) => u.role === 'professor')

    const studentRisks = students.map((student) => {
      const studentAssessments = assessments.filter((a) => a.class_id === student.class_id)
      const avg = computeWeightedAverage(studentAssessments, grades, student.id)
      const studentAtt = attendance.filter((a) => a.student_id === student.id)
      const freqPct = studentAtt.length > 0 ? (studentAtt.filter((a) => a.present).length / studentAtt.length) * 100 : 100
      return { student, avg, freqPct, risk: computeRiskLevel(avg, freqPct) }
    })

    const riskCounts = {
      verde: studentRisks.filter((s) => s.risk === 'verde').length,
      amarelo: studentRisks.filter((s) => s.risk === 'amarelo').length,
      vermelho: studentRisks.filter((s) => s.risk === 'vermelho').length,
    }

    const classPerformance = classes.map((cls) => {
      const classStudents = students.filter((s) => s.class_id === cls.id)
      const classAssessments = assessments.filter((a) => a.class_id === cls.id)
      const avg = classStudents.length > 0
        ? classStudents.reduce((acc, s) => acc + computeWeightedAverage(classAssessments, grades, s.id), 0) / classStudents.length
        : 0
      const classAtt = attendance.filter((a) => a.class_id === cls.id)
      const freqPct = classAtt.length > 0 ? (classAtt.filter((a) => a.present).length / classAtt.length) * 100 : 100
      return {
        name: cls.name.replace('º Ano', ''),
        media: Math.round(avg * 10) / 10,
        frequencia: Math.round(freqPct),
        alunos: classStudents.length,
      }
    })

    const riskPieData = [
      { name: 'Regular', value: riskCounts.verde, color: '#22c55e' },
      { name: 'Atenção', value: riskCounts.amarelo, color: '#f59e0b' },
      { name: 'Risco', value: riskCounts.vermelho, color: '#ef4444' },
    ]

    const topRiskStudents = studentRisks.filter((s) => s.risk !== 'verde').slice(0, 6)

    const monthlyTrend = [
      { month: 'Jan', media: 6.8, frequencia: 88 },
      { month: 'Fev', media: 7.1, frequencia: 91 },
      { month: 'Mar', media: 6.9, frequencia: 87 },
      { month: 'Abr', media: 7.3, frequencia: 90 },
      { month: 'Mai', media: 7.5, frequencia: 92 },
    ]

    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      riskCounts,
      classPerformance,
      riskPieData,
      topRiskStudents,
      monthlyTrend,
      unreadNotifs: notifications.length,
      recentNotifications: notifications.slice(0, 4),
    }
  }, [currentUser])

  if (!currentUser) return null

  const isDirector = currentUser.role === 'diretor'

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">
            {isDirector ? 'Painel da Direção' : 'Painel da Coordenação'} 👋
          </h1>
          <p className="text-dark-400">Escola Estadual João Paulo II · Ano Letivo 2025</p>
        </div>
        <div className="flex items-center gap-2">
          {isDirector && (
            <button
              onClick={() => navigate('/gestao')}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-dark-300 hover:border-dark-500 transition-all"
            >
              <Settings2 size={16} />
              Gestão
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alunos', value: data.totalStudents, icon: Users, color: 'text-electric-400', bg: 'bg-electric-500/10', path: '/gestao' },
          { label: 'Professores', value: data.totalTeachers, icon: Award, color: 'text-green-400', bg: 'bg-green-500/10', path: '/gestao' },
          { label: 'Turmas', value: data.totalClasses, icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10', path: '/gestao' },
          { label: 'Em Risco', value: data.riskCounts.vermelho + data.riskCounts.amarelo, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', path: '/analytics', alert: (data.riskCounts.vermelho + data.riskCounts.amarelo) > 0 },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card hover onClick={() => navigate(stat.path)} className="text-center relative cursor-pointer">
              {stat.alert && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
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
        {/* Chart area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-electric-400" />
                <h3 className="font-semibold text-dark-100">Evolução Escolar (2025)</h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-dark-400">
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-amber-500 rounded inline-block" />Média</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1 bg-electric-400 rounded inline-block" />Frequência</span>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyTrend}>
                  <defs>
                    <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
                  <Area type="monotone" dataKey="media" stroke="#f59e0b" fill="url(#colorMedia)" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
                  <Area type="monotone" dataKey="frequencia" stroke="#60a5fa" fill="none" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Class performance */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-amber-400" />
                <h3 className="font-semibold text-dark-100">Desempenho por Turma</h3>
              </div>
              <button onClick={() => navigate('/analytics')} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                Analytics <ChevronRight size={14} />
              </button>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.classPerformance} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
                  <Bar dataKey="media" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Média" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Risk pie */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-400" />
              <h3 className="font-semibold text-dark-100">Distribuição de Risco</h3>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.riskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                    {data.riskPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Risk students */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-400" />
              <h3 className="font-semibold text-dark-100">Alunos em Atenção</h3>
            </div>
            <div className="space-y-2">
              {data.topRiskStudents.map(({ student, avg, risk }) => (
                <div key={student.id} className="flex items-center gap-2 p-2 rounded-xl border border-dark-700">
                  <Avatar name={student.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-dark-200 truncate">{student.name}</p>
                    <Progress value={avg} max={10} size="sm" color={risk === 'vermelho' ? 'red' : 'amber'} />
                  </div>
                  <Badge variant={risk === 'vermelho' ? 'danger' : 'warning'} size="sm">
                    {RISK_LABELS[risk]}
                  </Badge>
                </div>
              ))}
              {data.topRiskStudents.length === 0 && (
                <p className="text-sm text-dark-500 text-center py-6">Nenhum aluno em risco 🎉</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
