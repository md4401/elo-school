import { useState, useMemo } from 'react'
import { ClipboardCheck, Check, X, AlertTriangle, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { hasPermission } from '@/lib/constants'
import { generateId, nowISO, formatDate } from '@/lib/utils'
import type { AttendanceRecord } from '@/types'

export default function FrequenciaPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [mode, setMode] = useState<'launch' | 'view'>('view')
  const [refreshKey, setRefreshKey] = useState(0)

  const canEdit = currentUser ? hasPermission(currentUser.role, 'edit_attendance') : false
  const isStudent = currentUser?.role === 'aluno'
  const isParent = currentUser?.role === 'pai'

  const data = useMemo(() => {
    if (!currentUser) return null
    let classes = storage.getArray('classes')
    let subjects = storage.getArray('subjects')

    if (isStudent) classes = classes.filter((c) => c.id === currentUser.class_id)
    else if (isParent) {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      classes = classes.filter((c) => c.id === child?.class_id)
    } else if (currentUser.role === 'professor') {
      classes = classes.filter((c) => c.teacher_ids.includes(currentUser.id))
    }

    return { classes, subjects }
  }, [currentUser, isStudent, isParent])

  const activeClass = useMemo(() => {
    if (!data) return null
    if (selectedClass) return data.classes.find((c) => c.id === selectedClass) ?? data.classes[0]
    return data.classes[0] ?? null
  }, [data, selectedClass])

  const activeSubjects = useMemo(() => {
    if (!data || !activeClass) return []
    return data.subjects.filter((s) => activeClass.subject_ids.includes(s.id))
  }, [data, activeClass])

  const activeSubject = useMemo(() => {
    if (selectedSubject) return activeSubjects.find((s) => s.id === selectedSubject) ?? activeSubjects[0]
    return activeSubjects[0] ?? null
  }, [activeSubjects, selectedSubject])

  const classStudents = useMemo(() => {
    if (!activeClass) return []
    const allStudents = storage.getArray('users').filter((u) => u.role === 'aluno')
    if (isStudent) return allStudents.filter((u) => u.id === currentUser?.id)
    if (isParent) return allStudents.filter((u) => u.id === currentUser?.child_id)
    return allStudents.filter((u) => u.class_id === activeClass.id)
  }, [activeClass, isStudent, isParent, currentUser])

  const attendanceRecords = useMemo(() => {
    if (!activeClass || !activeSubject) return []
    return storage.getArray('attendance').filter(
      (a) => a.class_id === activeClass.id && a.subject_id === activeSubject.id
    )
  // refreshKey forces this memo to re-read storage after a save
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClass, activeSubject, refreshKey])

  function getStudentStats(studentId: string) {
    const records = attendanceRecords.filter((a) => a.student_id === studentId)
    const total = records.length
    const present = records.filter((a) => a.present).length
    const pct = total > 0 ? (present / total) * 100 : 100
    return { total, present, absent: total - present, pct: Math.round(pct) }
  }

  function toggleAttendance(studentId: string) {
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }))
    setSaved(false)
  }

  function initAttendance() {
    const init: Record<string, boolean> = {}
    classStudents.forEach((s) => { init[s.id] = true })
    setAttendance(init)
    setMode('launch')
    setSaved(false)
  }

  function markAll(present: boolean) {
    const all: Record<string, boolean> = {}
    classStudents.forEach((s) => { all[s.id] = present })
    setAttendance(all)
    setSaved(false)
  }

  function saveAttendance() {
    if (!activeClass || !activeSubject || !currentUser) return
    classStudents.forEach((student) => {
      storage.push('attendance', {
        id: generateId(),
        student_id: student.id,
        class_id: activeClass.id,
        subject_id: activeSubject.id,
        teacher_id: currentUser.id,
        date: new Date(selectedDate).toISOString(),
        present: attendance[student.id] ?? true,
        justified: false,
        created_at: nowISO(),
      } as AttendanceRecord)
    })
    setSaved(true)
    setMode('view')
    setRefreshKey((k) => k + 1)
    addToast({ title: 'Frequência salva!', body: `${Object.keys(attendance).length} alunos registrados`, type: 'success' })
  }

  if (!currentUser || !data) return null

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Frequência"
        subtitle="Registro e acompanhamento de presença"
        icon={<ClipboardCheck size={20} />}
        actions={
          canEdit && mode === 'view' && (
            <Button icon={<ClipboardCheck size={16} />} onClick={initAttendance} size="sm">
              Lançar Chamada
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {!isStudent && !isParent && data.classes.length > 1 && (
          <Select
            options={data.classes.map((c) => ({ value: c.id, label: c.name }))}
            value={activeClass?.id ?? ''}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-40"
          />
        )}
        {activeSubjects.length > 1 && (
          <Select
            options={activeSubjects.map((s) => ({ value: s.id, label: s.name }))}
            value={activeSubject?.id ?? ''}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-44"
          />
        )}
        {canEdit && mode === 'launch' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        )}
      </div>

      {/* Launch mode */}
      {mode === 'launch' && canEdit && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-dark-100">Chamada — {activeSubject?.name}</h3>
              <p className="text-sm text-dark-400">{formatDate(selectedDate)} · {activeClass?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => markAll(true)} icon={<Check size={14} />}>Todos presentes</Button>
              <Button variant="ghost" size="sm" onClick={() => markAll(false)} icon={<X size={14} />}>Todos ausentes</Button>
              <Button size="sm" onClick={saveAttendance} icon={<Save size={14} />}>Salvar</Button>
              <Button variant="secondary" size="sm" onClick={() => setMode('view')}>Cancelar</Button>
            </div>
          </div>
          <div className="space-y-2">
            {classStudents.map((student) => {
              const present = attendance[student.id] ?? true
              return (
                <div
                  key={student.id}
                  onClick={() => toggleAttendance(student.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    present ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <Avatar name={student.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-dark-100">{student.name}</p>
                    <p className="text-xs text-dark-500">RA: {student.enrollment_number}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${present ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {present ? <Check size={16} /> : <X size={16} />}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* View mode */}
      {mode === 'view' && (
        <div className="space-y-3">
          {classStudents.map((student) => {
            const stats = getStudentStats(student.id)
            const isAtRisk = stats.pct < 75

            return (
              <Card key={student.id} className={isAtRisk ? 'border-amber-500/20' : ''}>
                <div className="flex items-start gap-3">
                  <Avatar name={student.name} size="md" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-dark-100">{student.name}</p>
                        <p className="text-xs text-dark-500">RA: {student.enrollment_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAtRisk && (
                          <Badge variant="warning" size="sm">
                            <AlertTriangle size={10} className="mr-1" /> Risco
                          </Badge>
                        )}
                        <Badge variant={stats.pct >= 75 ? 'success' : 'danger'}>
                          {stats.pct}%
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress
                        value={stats.pct}
                        max={100}
                        size="sm"
                        color={stats.pct >= 75 ? 'green' : stats.pct >= 60 ? 'amber' : 'red'}
                        label={`${stats.present} presentes / ${stats.absent} faltas de ${stats.total} aulas`}
                        showLabel
                      />
                    </div>
                    {stats.total === 0 && (
                      <p className="text-xs text-dark-500 mt-1">Nenhuma aula registrada ainda</p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}

          {classStudents.length === 0 && (
            <Card className="text-center py-12">
              <ClipboardCheck size={40} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Nenhum aluno encontrado</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
