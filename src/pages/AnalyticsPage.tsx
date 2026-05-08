import { useMemo, useState } from 'react'
import { BarChart3, TrendingUp, Users, AlertTriangle, Activity } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { computeRiskLevel, RISK_COLORS, RISK_LABELS } from '@/lib/constants'
import { computeWeightedAverage } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

const GRADE_DIST_RANGES = ['0–4', '4–5', '5–6', '6–7', '7–8', '8–9', '9–10']
const CHART_COLORS = ['#f59e0b', '#60a5fa', '#34d399', '#f87171', '#a78bfa', '#fb923c', '#2dd4bf']

export default function AnalyticsPage() {
  const { currentUser } = useAuth()
  const [selectedClassId, setSelectedClassId] = useState('')

  const data = useMemo(() => {
    if (!currentUser) return null
    let classes = storage.getArray('classes')
    if (currentUser.role === 'professor') {
      classes = classes.filter((c) => c.teacher_ids.includes(currentUser.id))
    }

    const students = storage.getArray('users').filter((u) => u.role === 'aluno')
    const assessments = storage.getArray('assessments')
    const grades = storage.getArray('assessment_grades')
    const attendance = storage.getArray('attendance')
    const subjects = storage.getArray('subjects')

    const activeClass = selectedClassId
      ? classes.find((c) => c.id === selectedClassId)
      : classes[0]

    if (!activeClass) return null

    const classStudents = students.filter((s) => s.class_id === activeClass.id)
    const classAssessments = assessments.filter((a) => a.class_id === activeClass.id)
    const classAttendance = attendance.filter((a) => a.class_id === activeClass.id)
    const classSubjects = subjects.filter((s) => activeClass.subject_ids.includes(s.id))

    const studentAnalytics = classStudents.map((student) => {
      const studentAss = classAssessments
      const avg = computeWeightedAverage(studentAss, grades, student.id)
      const studentAtt = classAttendance.filter((a) => a.student_id === student.id)
      const freqPct = studentAtt.length > 0 ? (studentAtt.filter((a) => a.present).length / studentAtt.length) * 100 : 100
      const risk = computeRiskLevel(avg, freqPct)
      return { student, avg, freqPct, risk }
    })

    const classAvg = classStudents.length > 0
      ? studentAnalytics.reduce((acc, s) => acc + s.avg, 0) / classStudents.length : 0
    const classFreq = studentAnalytics.length > 0
      ? studentAnalytics.reduce((acc, s) => acc + s.freqPct, 0) / studentAnalytics.length : 100

    const subjectAverages = classSubjects.map((sub) => {
      const subAssessments = classAssessments.filter((a) => a.subject_id === sub.id)
      const subGrades = classStudents.map((s) => computeWeightedAverage(subAssessments, grades, s.id)).filter((g) => g > 0)
      const avg = subGrades.length > 0 ? subGrades.reduce((a, b) => a + b, 0) / subGrades.length : 0
      return { name: sub.name, avg: Math.round(avg * 10) / 10, color: sub.color }
    })

    const gradeDist = GRADE_DIST_RANGES.map((range) => {
      const [min, max] = range.split('–').map(Number)
      const count = studentAnalytics.filter((s) => s.avg >= min && s.avg < max).length
      return { range, count }
    })

    const riskDist = [
      { name: 'Regular', value: studentAnalytics.filter((s) => s.risk === 'verde').length, color: '#22c55e' },
      { name: 'Atenção', value: studentAnalytics.filter((s) => s.risk === 'amarelo').length, color: '#f59e0b' },
      { name: 'Risco', value: studentAnalytics.filter((s) => s.risk === 'vermelho').length, color: '#ef4444' },
    ]

    const radarData = subjectAverages.map((s) => ({ subject: s.name.substring(0, 6), value: s.avg }))

    const monthlyTrend = [
      { month: 'Jan', media: 6.5, frequencia: 87 },
      { month: 'Fev', media: 6.9, frequencia: 89 },
      { month: 'Mar', media: 7.1, frequencia: 91 },
      { month: 'Abr', media: 7.0, frequencia: 88 },
      { month: 'Mai', media: classAvg.toFixed(1), frequencia: classFreq.toFixed(0) },
    ]

    return {
      classes,
      activeClass,
      classStudents,
      studentAnalytics,
      classAvg: Math.round(classAvg * 10) / 10,
      classFreq: Math.round(classFreq),
      subjectAverages,
      gradeDist,
      riskDist,
      radarData,
      monthlyTrend,
    }
  }, [currentUser, selectedClassId])

  if (!currentUser || !data) return null

  const TOOLTIP_STYLE = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Analytics"
        subtitle="Métricas detalhadas de desempenho escolar"
        icon={<BarChart3 size={20} />}
        actions={
          data.classes.length > 1 && (
            <Select
              options={data.classes.map((c) => ({ value: c.id, label: c.name }))}
              value={data.activeClass.id}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-40"
            />
          )
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Média da Turma', value: data.classAvg.toFixed(1), color: data.classAvg >= 7 ? 'text-green-400' : 'text-amber-400', icon: TrendingUp },
          { label: 'Frequência Média', value: `${data.classFreq}%`, color: data.classFreq >= 75 ? 'text-green-400' : 'text-amber-400', icon: Activity },
          { label: 'Alunos Total', value: data.classStudents.length, color: 'text-electric-400', icon: Users },
          { label: 'Em Risco', value: data.studentAnalytics.filter((s) => s.risk !== 'verde').length, color: 'text-red-400', icon: AlertTriangle },
        ].map((kpi, i) => (
          <Card key={kpi.label} className="text-center">
            <kpi.icon size={20} className={`${kpi.color} mx-auto mb-2`} />
            <p className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-dark-400 mt-1">{kpi.label}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
          <TabsTrigger value="tendencias">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade distribution */}
            <Card>
              <h3 className="font-semibold text-dark-100 mb-4">Distribuição de Notas</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.gradeDist} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'Alunos']} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Risk distribution */}
            <Card>
              <h3 className="font-semibold text-dark-100 mb-4">Distribuição de Risco</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {data.riskDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Subject radar */}
            {data.radarData.length >= 3 && (
              <Card>
                <h3 className="font-semibold text-dark-100 mb-4">Radar por Disciplina</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'Média']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Subject bar */}
            <Card>
              <h3 className="font-semibold text-dark-100 mb-4">Média por Disciplina</h3>
              <div className="space-y-3">
                {data.subjectAverages.map((sub) => (
                  <div key={sub.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-200">{sub.name}</span>
                      <span className={`text-sm font-bold ${sub.avg >= 7 ? 'text-green-400' : sub.avg >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{sub.avg > 0 ? sub.avg.toFixed(1) : '—'}</span>
                    </div>
                    {sub.avg > 0 && <Progress value={sub.avg} max={10} size="sm" color={sub.avg >= 7 ? 'green' : sub.avg >= 5 ? 'amber' : 'red'} />}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alunos" className="mt-6">
          <Card>
            <h3 className="font-semibold text-dark-100 mb-4">Desempenho Individual</h3>
            <div className="space-y-2">
              {data.studentAnalytics
                .sort((a, b) => b.avg - a.avg)
                .map(({ student, avg, freqPct, risk }, i) => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl border border-dark-700 hover:border-dark-600 transition-all">
                    <span className="text-sm font-bold text-dark-500 w-6 text-center">{i + 1}</span>
                    <Avatar name={student.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-100">{student.name}</p>
                      <div className="mt-1 flex gap-2">
                        <Progress value={avg} max={10} size="sm" color={avg >= 7 ? 'green' : avg >= 5 ? 'amber' : 'red'} className="w-24" />
                        <Progress value={freqPct} max={100} size="sm" color={freqPct >= 75 ? 'green' : 'amber'} className="w-20" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${avg >= 7 ? 'text-green-400' : avg >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{avg > 0 ? avg.toFixed(1) : '—'}</p>
                        <p className="text-xs text-dark-500">{freqPct.toFixed(0)}%</p>
                      </div>
                      <Badge variant={risk === 'vermelho' ? 'danger' : risk === 'amarelo' ? 'warning' : 'success'} size="sm">
                        {RISK_LABELS[risk]}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="disciplinas" className="mt-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subjectAverages} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'Média']} />
                {data.subjectAverages.map((sub, i) => (
                  <Bar key={sub.name} dataKey="avg" fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
                <Bar dataKey="avg" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="tendencias" className="mt-6">
          <Card>
            <h3 className="font-semibold text-dark-100 mb-4">Evolução Mensal</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  <Line type="monotone" dataKey="media" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Média" />
                  <Line type="monotone" dataKey="frequencia" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} name="Frequência %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
