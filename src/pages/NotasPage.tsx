import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Plus, Edit2, Save, X, Download, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  GRADE_STATUS, GRADE_STATUS_COLORS, GRADE_STATUS_LABELS,
  TRIMESTER_LABELS, ASSESSMENT_TYPE_LABELS, hasPermission
} from '@/lib/constants'
import { computeWeightedAverage, generateId, nowISO } from '@/lib/utils'
import type { Assessment, AssessmentGrade, AssessmentType } from '@/types'

export default function NotasPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [trimester, setTrimester] = useState<'1' | '2' | '3'>('1')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [editingGrade, setEditingGrade] = useState<{ assessmentId: string; studentId: string; current: number | null } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newAssessment, setNewAssessment] = useState(false)
  const [newAssForm, setNewAssForm] = useState({ title: '', type: 'prova' as AssessmentType, weight: '40', description: '' })

  const canEdit = currentUser ? hasPermission(currentUser.role, 'edit_grades') : false
  const isStudent = currentUser?.role === 'aluno'
  const isParent = currentUser?.role === 'pai'

  const data = useMemo(() => {
    if (!currentUser) return null
    let classes = storage.getArray('classes')
    let subjects = storage.getArray('subjects')
    let students = storage.getArray('users').filter((u) => u.role === 'aluno')

    if (isStudent) {
      classes = classes.filter((c) => c.id === currentUser.class_id)
      students = [currentUser]
    } else if (isParent) {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      if (child) {
        classes = classes.filter((c) => c.id === child.class_id)
        students = [child]
      }
    } else if (currentUser.role === 'professor') {
      classes = classes.filter((c) => c.teacher_ids.includes(currentUser.id))
      // Teachers only see subjects they teach, based on class_subjects records
      const myClassSubjects = storage.getArray('class_subjects').filter((cs) => cs.teacher_id === currentUser.id)
      const mySubjectIds = [...new Set(myClassSubjects.map((cs) => cs.subject_id))]
      subjects = subjects.filter((s) => mySubjectIds.includes(s.id))
    }

    return { classes, subjects, students }
  }, [currentUser, isStudent, isParent])

  const activeClass = useMemo(() => {
    if (!data) return null
    if (selectedClass) return data.classes.find((c) => c.id === selectedClass) ?? data.classes[0]
    return data.classes[0] ?? null
  }, [data, selectedClass])

  const activeSubjects = useMemo(() => {
    if (!data || !activeClass) return []
    if (currentUser?.role === 'professor') {
      // Within the active class, only subjects where this teacher is assigned
      const myClassSubjects = storage.getArray('class_subjects').filter(
        (cs) => cs.class_id === activeClass.id && cs.teacher_id === currentUser.id
      )
      const mySubjectIds = myClassSubjects.map((cs) => cs.subject_id)
      return data.subjects.filter((s) => mySubjectIds.includes(s.id))
    }
    return data.subjects.filter((s) => activeClass.subject_ids.includes(s.id))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, activeClass, currentUser])

  const activeSubject = useMemo(() => {
    if (selectedSubject) return activeSubjects.find((s) => s.id === selectedSubject) ?? activeSubjects[0]
    return activeSubjects[0] ?? null
  }, [activeSubjects, selectedSubject])

  const assessments = useMemo(() => {
    if (!activeClass || !activeSubject) return []
    return storage.getArray('assessments').filter(
      (a) => a.class_id === activeClass.id && a.subject_id === activeSubject.id && a.trimester === parseInt(trimester)
    )
  }, [activeClass, activeSubject, trimester])

  const classStudents = useMemo(() => {
    if (!data || !activeClass) return []
    if (isStudent) return data.students
    if (isParent) return data.students
    return data.students.filter((s) => s.class_id === activeClass.id)
  }, [data, activeClass, isStudent, isParent])

  const grades = useMemo(() => storage.getArray('assessment_grades'), [])

  function getGrade(assessmentId: string, studentId: string): AssessmentGrade | undefined {
    return grades.find((g) => g.assessment_id === assessmentId && g.student_id === studentId)
  }

  function startEdit(assessmentId: string, studentId: string, current: number | null) {
    if (!canEdit) return
    setEditingGrade({ assessmentId, studentId, current })
    setEditValue(current?.toString() ?? '')
  }

  function saveGrade() {
    if (!editingGrade) return
    const score = editValue === '' ? null : parseFloat(editValue)
    if (score !== null && (score < 0 || score > 10)) {
      addToast({ title: 'Nota inválida', body: 'A nota deve estar entre 0 e 10', type: 'error' })
      return
    }
    const existing = getGrade(editingGrade.assessmentId, editingGrade.studentId)
    if (existing) {
      storage.update<AssessmentGrade>('assessment_grades', existing.id, { score, updated_at: nowISO() })
    } else {
      storage.push('assessment_grades', {
        id: generateId(),
        assessment_id: editingGrade.assessmentId,
        student_id: editingGrade.studentId,
        score,
        created_at: nowISO(),
        updated_at: nowISO(),
      })
    }
    addToast({ title: 'Nota salva!', body: 'Nota atualizada com sucesso', type: 'success' })
    setEditingGrade(null)
  }

  function handleNewAssessment() {
    if (!activeClass || !activeSubject || !currentUser) return
    if (!newAssForm.title.trim()) { addToast({ title: 'Título obrigatório', body: '', type: 'error' }); return }
    storage.push('assessments', {
      id: generateId(),
      title: newAssForm.title,
      type: newAssForm.type,
      subject_id: activeSubject.id,
      class_id: activeClass.id,
      teacher_id: currentUser.id,
      trimester: parseInt(trimester) as 1 | 2 | 3,
      weight: parseFloat(newAssForm.weight) || 40,
      max_score: 10,
      date: nowISO(),
      description: newAssForm.description,
      created_at: nowISO(),
    })
    addToast({ title: 'Avaliação criada!', body: newAssForm.title, type: 'success' })
    setNewAssessment(false)
    setNewAssForm({ title: '', type: 'prova', weight: '40', description: '' })
  }

  if (!currentUser || !data) return null

  return (
    <div className="space-y-6 max-w-full">
      <PageHeader
        title="Notas"
        subtitle="Consulte e gerencie as avaliações"
        icon={<GraduationCap size={20} />}
        actions={
          canEdit && (
            <Button icon={<Plus size={16} />} onClick={() => setNewAssessment(true)} size="sm">
              Nova Avaliação
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
      </div>

      <Tabs defaultValue="1" onValueChange={(v) => setTrimester(v as '1' | '2' | '3')}>
        <TabsList>
          {(['1', '2', '3'] as const).map((t) => (
            <TabsTrigger key={t} value={t}>{TRIMESTER_LABELS[t as unknown as 1 | 2 | 3]}</TabsTrigger>
          ))}
        </TabsList>

        {(['1', '2', '3'] as const).map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            {activeSubject ? (
              <Card noPadding>
                <div className="flex items-center justify-between p-4 border-b border-dark-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeSubject.color }} />
                    <h3 className="font-semibold text-dark-100">{activeSubject.name}</h3>
                    <span className="text-xs text-dark-500">·</span>
                    <span className="text-xs text-dark-400">{assessments.length} avaliações</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-dark-900 border-b border-dark-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase sticky left-0 bg-dark-900 min-w-40">
                          Aluno
                        </th>
                        {assessments.map((a) => (
                          <th key={a.id} className="px-3 py-3 text-center text-xs font-semibold text-dark-400 min-w-28">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="truncate max-w-24">{a.title}</span>
                              <Badge variant="outline" size="sm">{ASSESSMENT_TYPE_LABELS[a.type]}</Badge>
                              <span className="text-dark-600">Peso: {a.weight}%</span>
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-semibold text-dark-400 sticky right-0 bg-dark-900">Média</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-dark-400 sticky right-20 bg-dark-900">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {classStudents.map((student) => {
                        const avg = computeWeightedAverage(assessments, grades, student.id)
                        const studentAtt = storage.getArray('attendance').filter(
                          (a) => a.student_id === student.id && a.subject_id === activeSubject.id
                        )
                        const freqPct = studentAtt.length > 0
                          ? (studentAtt.filter((a) => a.present).length / studentAtt.length) * 100 : 100
                        const status = assessments.length > 0 ? GRADE_STATUS(avg, freqPct) : null

                        return (
                          <tr key={student.id} className="bg-dark-800 hover:bg-dark-750 transition-colors">
                            <td className="px-4 py-3 sticky left-0 bg-inherit">
                              <div>
                                <p className="font-medium text-dark-100">{student.name}</p>
                                <p className="text-xs text-dark-500">RA: {student.enrollment_number}</p>
                              </div>
                            </td>
                            {assessments.map((a) => {
                              const g = getGrade(a.id, student.id)
                              const isEditing = editingGrade?.assessmentId === a.id && editingGrade.studentId === student.id
                              return (
                                <td key={a.id} className="px-3 py-3 text-center">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1 justify-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-14 h-7 bg-dark-900 border border-amber-500 rounded text-center text-xs text-dark-100 focus:outline-none"
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === 'Enter') saveGrade(); if (e.key === 'Escape') setEditingGrade(null) }}
                                      />
                                      <button onClick={saveGrade} className="text-green-400 hover:text-green-300"><Save size={12} /></button>
                                      <button onClick={() => setEditingGrade(null)} className="text-dark-500 hover:text-dark-300"><X size={12} /></button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startEdit(a.id, student.id, g?.score ?? null)}
                                      className={`px-2 py-1 rounded-lg text-sm font-bold transition-all ${
                                        canEdit ? 'hover:bg-dark-700 cursor-pointer group' : 'cursor-default'
                                      } ${g?.score == null ? 'text-dark-600' : g.score >= 7 ? 'text-green-400' : g.score >= 5 ? 'text-amber-400' : 'text-red-400'}`}
                                    >
                                      {g?.score != null ? g.score.toFixed(1) : '—'}
                                      {canEdit && <Edit2 size={10} className="inline ml-1 opacity-0 group-hover:opacity-100" />}
                                    </button>
                                  )}
                                </td>
                              )
                            })}
                            <td className="px-4 py-3 text-center sticky right-20 bg-inherit">
                              {assessments.length > 0 && avg > 0 ? (
                                <span className={`text-sm font-bold ${avg >= 7 ? 'text-green-400' : avg >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {avg.toFixed(1)}
                                </span>
                              ) : <span className="text-dark-600">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center sticky right-0 bg-inherit">
                              {status && (
                                <Badge
                                  className={GRADE_STATUS_COLORS[status]}
                                  size="sm"
                                >
                                  {GRADE_STATUS_LABELS[status]}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="text-center py-12">
                <GraduationCap size={40} className="text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">Nenhuma disciplina encontrada</p>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* New Assessment Modal */}
      <Modal
        open={newAssessment}
        onClose={() => setNewAssessment(false)}
        title="Nova Avaliação"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setNewAssessment(false)}>Cancelar</Button>
            <Button onClick={handleNewAssessment}>Criar Avaliação</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={newAssForm.title}
            onChange={(e) => setNewAssForm({ ...newAssForm, title: e.target.value })}
            placeholder="Ex: Prova 1 — Funções"
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={newAssForm.type}
              onChange={(e) => setNewAssForm({ ...newAssForm, type: e.target.value as AssessmentType })}
              options={Object.entries(ASSESSMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              fullWidth
            />
            <Input
              label="Peso (%)"
              type="number"
              min="1"
              max="100"
              value={newAssForm.weight}
              onChange={(e) => setNewAssForm({ ...newAssForm, weight: e.target.value })}
              fullWidth
            />
          </div>
          <Textarea
            label="Descrição (opcional)"
            value={newAssForm.description}
            onChange={(e) => setNewAssForm({ ...newAssForm, description: e.target.value })}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  )
}
