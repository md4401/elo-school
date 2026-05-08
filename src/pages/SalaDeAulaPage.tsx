import { useState, useMemo } from 'react'
import { GraduationCap, Users, BookOpen, ClipboardList, Video, FolderOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { computeRiskLevel, RISK_LABELS } from '@/lib/constants'
import { computeWeightedAverage } from '@/lib/utils'

const SHIFT_LABELS: Record<string, string> = {
  manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral',
}

export default function SalaDeAulaPage() {
  const { currentUser } = useAuth()
  const [selectedClassId, setSelectedClassId] = useState('')

  const data = useMemo(() => {
    if (!currentUser) return null
    const allClasses = storage.getArray('classes')
    const subjects = storage.getArray('subjects')
    const allUsers = storage.getArray('users')
    const assessments = storage.getArray('assessments')
    const grades = storage.getArray('assessment_grades')
    const attendance = storage.getArray('attendance')
    const tasks = storage.getArray('tasks')
    const materials = storage.getArray('materials')
    const videos = storage.getArray('videos')
    const quizzes = storage.getArray('quizzes')
    const classSubjects = storage.getArray('class_subjects')

    let myClasses = allClasses
    if (currentUser.role === 'professor') {
      myClasses = allClasses.filter((c) => c.teacher_ids.includes(currentUser.id))
    }

    const activeClass = selectedClassId
      ? myClasses.find((c) => c.id === selectedClassId)
      : myClasses[0]

    if (!activeClass) return null

    const classStudents = allUsers.filter((u) => u.role === 'aluno' && u.class_id === activeClass.id)
    const classSubjectList = subjects.filter((s) => activeClass.subject_ids.includes(s.id))
    const classAssessments = assessments.filter((a) => a.class_id === activeClass.id)
    const classAttendance = attendance.filter((a) => a.class_id === activeClass.id)
    const classTasks = tasks.filter((t) => t.class_id === activeClass.id)
    const classMaterials = materials.filter((m) => m.class_id === activeClass.id)
    const classVideos = videos.filter((v) => v.class_id === activeClass.id)
    const classQuizzes = quizzes.filter((q) => q.class_id === activeClass.id)
    const teachers = allUsers.filter((u) => activeClass.teacher_ids.includes(u.id))

    const studentStats = classStudents.map((student) => {
      const avg = computeWeightedAverage(classAssessments, grades, student.id)
      const studentAtt = classAttendance.filter((a) => a.student_id === student.id)
      const freqPct = studentAtt.length > 0 ? (studentAtt.filter((a) => a.present).length / studentAtt.length) * 100 : 100
      const risk = computeRiskLevel(avg, freqPct)
      return { student, avg, freqPct, risk }
    })

    const subjectsWithTeachers = classSubjectList.map((sub) => {
      const cs = classSubjects.find((cs) => cs.class_id === activeClass.id && cs.subject_id === sub.id)
      const teacher = cs ? allUsers.find((u) => u.id === cs.teacher_id) : null
      return { ...sub, teacher }
    })

    return {
      myClasses,
      activeClass,
      classStudents,
      classSubjects: subjectsWithTeachers,
      classTasks,
      classMaterials,
      classVideos,
      classQuizzes,
      teachers,
      studentStats,
    }
  }, [currentUser, selectedClassId])

  if (!currentUser || !data) return null

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Sala de Aula"
        subtitle="Visão completa da turma"
        icon={<GraduationCap size={20} />}
        actions={
          data.myClasses.length > 1 && (
            <div className="flex gap-2">
              {data.myClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                    data.activeClass.id === cls.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-dark-700 text-dark-400 hover:border-dark-500'
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          )
        }
      />

      <Card className="bg-gradient-to-r from-dark-800 via-dark-900 to-dark-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <GraduationCap size={32} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-dark-50">{data.activeClass.name}</h2>
            <p className="text-dark-400 mt-1">{data.activeClass.year}º ano · {SHIFT_LABELS[data.activeClass.shift]}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-dark-300"><Users size={14} /> {data.classStudents.length} alunos</span>
              <span className="flex items-center gap-1.5 text-dark-300"><BookOpen size={14} /> {data.classSubjects.length} disciplinas</span>
              <span className="flex items-center gap-1.5 text-dark-300"><ClipboardList size={14} /> {data.classTasks.length} tarefas</span>
              <span className="flex items-center gap-1.5 text-dark-300"><FolderOpen size={14} /> {data.classMaterials.length} materiais</span>
            </div>
          </div>
          <div className="flex gap-3">
            {data.teachers.map((t) => (
              <div key={t.id} className="text-center">
                <Avatar name={t.name} size="md" />
                <p className="text-xs text-dark-500 mt-1">{t.name.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="alunos">
        <TabsList>
          <TabsTrigger value="alunos">Alunos ({data.classStudents.length})</TabsTrigger>
          <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
        </TabsList>

        <TabsContent value="alunos" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.studentStats.map(({ student, avg, freqPct, risk }, i) => (
              <motion.div key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card hover className="flex items-center gap-4">
                  <Avatar name={student.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-100 truncate">{student.name}</p>
                    <p className="text-xs text-dark-500">{student.enrollment_number}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-dark-500">Média</span>
                        <span className={avg >= 7 ? 'text-green-400' : avg >= 5 ? 'text-amber-400' : 'text-red-400'}>{avg > 0 ? avg.toFixed(1) : '—'}</span>
                      </div>
                      <Progress value={avg} max={10} size="sm" color={avg >= 7 ? 'green' : avg >= 5 ? 'amber' : 'red'} />
                    </div>
                  </div>
                  <Badge variant={risk === 'vermelho' ? 'danger' : risk === 'amarelo' ? 'warning' : 'success'} size="sm">
                    {RISK_LABELS[risk]}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="disciplinas" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.classSubjects.map((sub) => (
              <Card key={sub.id} hover>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sub.color + '20' }}>
                    <BookOpen size={20} style={{ color: sub.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-dark-100">{sub.name}</p>
                    {sub.teacher && <p className="text-xs text-dark-500">{sub.teacher.name}</p>}
                  </div>
                </div>
                <div className="text-xs text-dark-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Carga horária</span>
                    <span className="text-dark-300">{sub.workload_hours}h/ano</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conteudo" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={18} className="text-amber-400" />
                <h3 className="font-semibold text-dark-100">Tarefas</h3>
              </div>
              <div className="space-y-2">
                {data.classTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                    <span className="text-sm text-dark-300 truncate">{t.title}</span>
                    <Badge variant={t.is_published ? 'success' : 'outline'} size="sm">{t.is_published ? 'Publicada' : 'Rascunho'}</Badge>
                  </div>
                ))}
                {data.classTasks.length === 0 && <p className="text-sm text-dark-500">Nenhuma tarefa</p>}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen size={18} className="text-electric-400" />
                <h3 className="font-semibold text-dark-100">Materiais</h3>
              </div>
              <div className="space-y-2">
                {data.classMaterials.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                    <span className="text-sm text-dark-300 truncate">{m.title}</span>
                    <Badge variant="outline" size="sm">{m.type}</Badge>
                  </div>
                ))}
                {data.classMaterials.length === 0 && <p className="text-sm text-dark-500">Nenhum material</p>}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Video size={18} className="text-green-400" />
                <h3 className="font-semibold text-dark-100">Videoaulas</h3>
              </div>
              <div className="space-y-2">
                {data.classVideos.slice(0, 5).map((v) => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
                    <span className="text-sm text-dark-300 truncate">{v.title}</span>
                    <span className="text-xs text-dark-500">{Math.ceil(v.duration_seconds / 60)}min</span>
                  </div>
                ))}
                {data.classVideos.length === 0 && <p className="text-sm text-dark-500">Nenhuma videoaula</p>}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="desempenho" className="mt-6">
          <Card>
            <h3 className="font-semibold text-dark-100 mb-6">Ranking de Desempenho</h3>
            <div className="space-y-3">
              {data.studentStats
                .sort((a, b) => b.avg - a.avg)
                .map(({ student, avg, freqPct, risk }, i) => (
                  <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl border border-dark-700 hover:border-dark-600 transition-all">
                    <span className="w-8 text-center text-sm font-bold text-dark-500">{i + 1}</span>
                    <Avatar name={student.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-100">{student.name}</p>
                      <div className="mt-1 flex gap-2">
                        <Progress value={avg} max={10} size="sm" color={avg >= 7 ? 'green' : avg >= 5 ? 'amber' : 'red'} className="w-24" />
                        <Progress value={freqPct} max={100} size="sm" color={freqPct >= 75 ? 'green' : 'amber'} className="w-20" />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${avg >= 7 ? 'text-green-400' : avg >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{avg > 0 ? avg.toFixed(1) : '—'}</p>
                      <p className="text-xs text-dark-500">{freqPct.toFixed(0)}%</p>
                    </div>
                    <Badge variant={risk === 'vermelho' ? 'danger' : risk === 'amarelo' ? 'warning' : 'success'} size="sm">
                      {RISK_LABELS[risk]}
                    </Badge>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
