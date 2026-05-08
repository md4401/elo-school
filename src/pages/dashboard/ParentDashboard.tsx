import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, ClipboardCheck, AlertTriangle, FileText, ChevronRight, TrendingUp, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { computeRiskLevel, RISK_COLORS, RISK_LABELS, GRADE_STATUS, GRADE_STATUS_COLORS } from '@/lib/constants'
import { computeWeightedAverage } from '@/lib/utils'
import { generateReportCard } from '@/lib/pdf'
import { Button } from '@/components/ui/Button'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function ParentDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const data = useMemo(() => {
    if (!currentUser || !currentUser.child_id) return null
    const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
    if (!child) return null

    const schoolClass = storage.getArray('classes').find((c) => c.id === child.class_id)
    const subjects = storage.getArray('subjects').filter((s) => schoolClass?.subject_ids.includes(s.id))
    const assessments = storage.getArray('assessments').filter((a) => a.class_id === child.class_id)
    const grades = storage.getArray('assessment_grades').filter((g) => g.student_id === child.id)
    const attendance = storage.getArray('attendance').filter((a) => a.student_id === child.id)
    const notifications = storage.getArray('notifications').filter((n) => n.user_id === currentUser.id && !n.read)
    const tasks = storage.getArray('tasks').filter((t) => t.class_id === child.class_id)
    const submissions = storage.getArray('task_submissions').filter((s) => s.student_id === child.id)

    const attendancePct = attendance.length > 0
      ? (attendance.filter((a) => a.present).length / attendance.length) * 100
      : 100

    const subjectGrades = subjects.map((sub) => {
      const subAssessments = assessments.filter((a) => a.subject_id === sub.id)
      const avg = computeWeightedAverage(subAssessments, grades, child.id)
      const subAtt = attendance.filter((a) => a.subject_id === sub.id)
      const freqPct = subAtt.length > 0 ? (subAtt.filter((a) => a.present).length / subAtt.length) * 100 : 100
      const status = GRADE_STATUS(avg, freqPct)
      return { subject: sub, avg, freqPct, status }
    })

    const overallAvg = subjectGrades.length > 0
      ? subjectGrades.reduce((acc, s) => acc + s.avg, 0) / subjectGrades.length
      : 0

    const risk = computeRiskLevel(overallAvg, attendancePct)

    const radarData = subjectGrades.map((sg) => ({
      subject: sg.subject.name.substring(0, 5),
      value: sg.avg,
    }))

    const pendingTasks = tasks.filter((t) => {
      const sub = submissions.find((s) => s.task_id === t.id)
      return !sub || sub.status === 'pendente' || sub.status === 'atrasado'
    }).length

    return {
      child,
      schoolClass,
      subjectGrades,
      overallAvg: Math.round(overallAvg * 10) / 10,
      attendancePct: Math.round(attendancePct),
      risk,
      radarData,
      pendingTasks,
      unreadNotifs: notifications.length,
      recentGrades: grades.filter((g) => g.score !== null).slice(-5).reverse(),
      assessments,
      subjects,
    }
  }, [currentUser])

  if (!currentUser || !data) {
    return (
      <Card className="text-center py-12">
        <AlertTriangle size={40} className="text-amber-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-dark-100 mb-2">Nenhum filho vinculado</h2>
        <p className="text-dark-400 text-sm mb-4">Vincule o RA do seu filho para acompanhar o desempenho.</p>
        <Button onClick={() => navigate('/perfil')}>Vincular filho</Button>
      </Card>
    )
  }

  function handleDownloadPDF() {
    if (!data?.child || !data?.schoolClass) return
    const attendanceMap: Record<string, number> = {}
    data.subjectGrades.forEach((sg) => { attendanceMap[sg.subject.id] = sg.freqPct })
    generateReportCard(
      data.child,
      data.schoolClass,
      data.subjects,
      data.assessments,
      storage.getArray('assessment_grades').filter((g) => g.student_id === data.child.id),
      attendanceMap
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Child card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-dark-800 to-dark-900 border border-dark-700"
      >
        <Avatar name={data.child.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{data.child.name}</h1>
          <p className="text-dark-400">{data.schoolClass?.name} · RA: {data.child.enrollment_number}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={data.risk === 'verde' ? 'success' : data.risk === 'amarelo' ? 'warning' : 'danger'}>
              {RISK_LABELS[data.risk]}
            </Badge>
            {data.unreadNotifs > 0 && (
              <Badge variant="warning">{data.unreadNotifs} notificação{data.unreadNotifs > 1 ? 'ões' : ''}</Badge>
            )}
          </div>
        </div>
        <Button variant="secondary" onClick={handleDownloadPDF} icon={<FileText size={16} />}>
          Baixar Boletim
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Média Geral', value: data.overallAvg > 0 ? data.overallAvg.toFixed(1) : '—', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Frequência', value: `${data.attendancePct}%`, icon: ClipboardCheck, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Tarefas Pendentes', value: data.pendingTasks.toString(), icon: AlertTriangle, color: 'text-electric-400', bg: 'bg-electric-500/10' },
          { label: 'Notificações', value: data.unreadNotifs.toString(), icon: Bell, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="text-center">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-dark-50">{stat.value}</p>
              <p className="text-xs text-dark-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        {data.radarData.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-electric-400" />
              <h3 className="font-semibold text-dark-100">Desempenho por Área</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Subject grades */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-amber-400" />
              <h3 className="font-semibold text-dark-100">Notas por Disciplina</h3>
            </div>
            <button onClick={() => navigate('/notas')} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {data.subjectGrades.map(({ subject, avg, freqPct, status }) => (
              <div key={subject.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }} />
                    <span className="text-sm text-dark-200">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-dark-100">{avg > 0 ? avg.toFixed(1) : '—'}</span>
                    <Badge variant={status === 'aprovado' ? 'success' : status === 'recuperacao' ? 'warning' : 'danger'} size="sm">
                      {freqPct.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={avg} max={10} size="sm" color={avg >= 7 ? 'green' : avg >= 5 ? 'amber' : 'red'} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
