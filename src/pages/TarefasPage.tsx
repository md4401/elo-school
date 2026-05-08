import { useState, useMemo } from 'react'
import { CheckSquare, Plus, Clock, Check, AlertCircle, ChevronDown, ChevronUp, Upload, Edit2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { hasPermission } from '@/lib/constants'
import { formatDate, generateId, nowISO } from '@/lib/utils'
import type { Task, TaskSubmission } from '@/types'

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
  entregue: { label: 'Entregue', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Check },
  atrasado: { label: 'Atrasado', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle },
  corrigido: { label: 'Corrigido', color: 'text-green-400', bg: 'bg-green-500/10', icon: Check },
}

export default function TarefasPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newTaskModal, setNewTaskModal] = useState(false)
  const [submissionModal, setSubmissionModal] = useState<Task | null>(null)
  const [submissionText, setSubmissionText] = useState('')
  const [newTask, setNewTask] = useState({ title: '', description: '', subject_id: '', class_id: '', due_date: '', max_score: '10' })
  const [taskAttachments, setTaskAttachments] = useState<{ name: string; url: string; type: string }[]>([])
  const [taskQuestions, setTaskQuestions] = useState<{ text: string; type: 'dissertativa' | 'multipla_escolha'; options: string[] }[]>([])
  const [newAttachment, setNewAttachment] = useState({ name: '', url: '', type: 'pdf' })
  const [newQuestion, setNewQuestion] = useState({ text: '', type: 'dissertativa' as 'dissertativa' | 'multipla_escolha', options: ['', '', '', ''] })

  const canCreate = currentUser ? hasPermission(currentUser.role, 'create_tasks') : false
  const isStudent = currentUser?.role === 'aluno'

  const data = useMemo(() => {
    if (!currentUser) return null
    let tasks = storage.getArray('tasks')
    const subjects = storage.getArray('subjects')
    const classes = storage.getArray('classes')
    let submissions = storage.getArray('task_submissions')

    if (isStudent) {
      tasks = tasks.filter((t) => t.class_id === currentUser.class_id && t.is_published)
      submissions = submissions.filter((s) => s.student_id === currentUser.id)
    } else if (currentUser.role === 'pai') {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      tasks = tasks.filter((t) => t.class_id === child?.class_id && t.is_published)
      submissions = submissions.filter((s) => s.student_id === child?.id)
    } else if (currentUser.role === 'professor') {
      tasks = tasks.filter((t) => t.teacher_id === currentUser.id)
    }

    const tasksWithInfo = tasks.map((task) => {
      const subject = subjects.find((s) => s.id === task.subject_id)
      const cls = classes.find((c) => c.id === task.class_id)
      const mySubmission = isStudent ? submissions.find((s) => s.task_id === task.id) : null
      const allSubmissions = !isStudent ? submissions.filter((s) => s.task_id === task.id) : []
      const dueDate = new Date(task.due_date)
      const isOverdue = dueDate < new Date() && (!mySubmission || mySubmission.status === 'pendente')
      return { task, subject, cls, mySubmission, allSubmissions, isOverdue }
    })

    return { tasksWithInfo, subjects, classes: canCreate ? classes : [] }
  }, [currentUser, isStudent, canCreate])

  function submitTask(task: Task) {
    if (!currentUser || !submissionText.trim()) return
    const existing = storage.getArray('task_submissions').find(
      (s) => s.task_id === task.id && s.student_id === currentUser.id
    )
    if (existing) {
      storage.update<TaskSubmission>('task_submissions', existing.id, {
        status: 'entregue',
        submitted_at: nowISO(),
      })
    } else {
      storage.push('task_submissions', {
        id: generateId(),
        task_id: task.id,
        student_id: currentUser.id,
        status: 'entregue',
        submitted_at: nowISO(),
        attachments: [],
        answers: [{ question_id: 'text', answer: submissionText }],
      } as TaskSubmission)
    }
    addToast({ title: 'Tarefa entregue!', body: task.title, type: 'success' })
    setSubmissionModal(null)
    setSubmissionText('')
  }

  function addAttachment() {
    if (!newAttachment.name.trim() || !newAttachment.url.trim()) return
    setTaskAttachments((prev) => [...prev, { ...newAttachment }])
    setNewAttachment({ name: '', url: '', type: 'pdf' })
  }

  function addQuestion() {
    if (!newQuestion.text.trim()) return
    setTaskQuestions((prev) => [...prev, { ...newQuestion, options: newQuestion.options.filter(Boolean) }])
    setNewQuestion({ text: '', type: 'dissertativa', options: ['', '', '', ''] })
  }

  function createTask() {
    if (!currentUser || !newTask.title || !newTask.subject_id || !newTask.due_date) {
      addToast({ title: 'Preencha todos os campos obrigatórios', body: '', type: 'error' })
      return
    }
    storage.push('tasks', {
      id: generateId(),
      title: newTask.title,
      description: newTask.description,
      subject_id: newTask.subject_id,
      class_id: newTask.class_id || (data?.classes[0]?.id ?? ''),
      teacher_id: currentUser.id,
      type: taskQuestions.length > 0 ? 'formulario' : 'atividade',
      due_date: new Date(newTask.due_date).toISOString(),
      max_score: parseFloat(newTask.max_score) || 10,
      allow_late_submission: false,
      attachments: taskAttachments.map((a) => ({ id: generateId(), name: a.name, url: a.url, type: a.type as Task['attachments'][0]['type'] })),
      questions: taskQuestions.map((q, i) => ({
        id: generateId(),
        task_id: '',
        type: q.type,
        text: q.text,
        options: q.options.length > 0 ? q.options : undefined,
        points: 1,
        order: i + 1,
      })),
      created_at: nowISO(),
      updated_at: nowISO(),
      is_published: true,
    } as Task)
    addToast({ title: 'Tarefa criada!', body: newTask.title, type: 'success' })
    setNewTaskModal(false)
    setNewTask({ title: '', description: '', subject_id: '', class_id: '', due_date: '', max_score: '10' })
    setTaskAttachments([])
    setTaskQuestions([])
  }

  function deleteTask(id: string) {
    storage.remove_item('tasks', id)
    addToast({ title: 'Tarefa excluída', body: '', type: 'info' })
  }

  if (!currentUser || !data) return null

  const pending = data.tasksWithInfo.filter(({ mySubmission, isOverdue }) => !mySubmission || (mySubmission.status === 'pendente' && !isOverdue))
  const delivered = data.tasksWithInfo.filter(({ mySubmission }) => mySubmission && mySubmission.status !== 'pendente' && mySubmission.status !== 'atrasado')
  const overdue = data.tasksWithInfo.filter(({ isOverdue }) => isOverdue)
  const all = data.tasksWithInfo

  function TaskCard({ task, subject, cls, mySubmission, allSubmissions, isOverdue }: NonNullable<typeof data>['tasksWithInfo'][0]) {
    const isExpanded = expanded === task.id
    const dueDate = new Date(task.due_date)
    const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86400000)
    const statusKey = mySubmission?.status ?? (isOverdue ? 'atrasado' : 'pendente')
    const StatusConfig = STATUS_CONFIG[statusKey]

    return (
      <motion.div layout key={task.id}>
        <Card className={`transition-all ${isOverdue ? 'border-red-500/20' : ''}`}>
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => setExpanded(isExpanded ? null : task.id)}
          >
            <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: subject?.color ?? '#6b7280' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-dark-100">{task.title}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{subject?.name} · {cls?.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusKey === 'corrigido' ? 'success' : statusKey === 'entregue' ? 'info' : statusKey === 'atrasado' ? 'danger' : 'warning'} size="sm">
                    {StatusConfig.label}
                  </Badge>
                  {mySubmission?.grade != null && (
                    <Badge variant="success" size="sm">{mySubmission.grade}/10</Badge>
                  )}
                  {isExpanded ? <ChevronUp size={16} className="text-dark-500" /> : <ChevronDown size={16} className="text-dark-500" />}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-dark-500 flex items-center gap-1">
                  <Clock size={12} />
                  {isOverdue ? 'Atrasado!' : daysLeft === 0 ? 'Vence hoje!' : daysLeft > 0 ? `${daysLeft} dias restantes` : 'Vencido'}
                </span>
                <span className="text-xs text-dark-600">·</span>
                <span className="text-xs text-dark-500">{formatDate(task.due_date)}</span>
                {!isStudent && (
                  <>
                    <span className="text-dark-600">·</span>
                    <span className="text-xs text-dark-500">{allSubmissions.length} entregas</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-dark-700 space-y-3">
                  <p className="text-sm text-dark-300">{task.description || 'Sem descrição adicional.'}</p>

                  {task.attachments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-dark-400 mb-2">Materiais:</p>
                      <div className="flex flex-wrap gap-2">
                        {task.attachments.map((a) => (
                          <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs text-amber-400 hover:border-amber-500 transition-colors">
                            📎 {a.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {mySubmission?.feedback && (
                    <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                      <p className="text-xs font-medium text-green-400 mb-1">Feedback do professor:</p>
                      <p className="text-sm text-dark-200">{mySubmission.feedback}</p>
                    </div>
                  )}

                  {isStudent && !mySubmission && !isOverdue && (
                    <Button size="sm" icon={<Upload size={14} />} onClick={() => setSubmissionModal(task)}>
                      Entregar Tarefa
                    </Button>
                  )}

                  {!isStudent && canCreate && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => deleteTask(task.id)} className="text-red-400 hover:bg-red-500/10">
                        Excluir
                      </Button>
                    </div>
                  )}

                  {!isStudent && allSubmissions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-dark-400 mb-2">Entregas recentes:</p>
                      <div className="space-y-2">
                        {allSubmissions.slice(0, 3).map((sub) => {
                          const student = storage.getArray('users').find((u) => u.id === sub.student_id)
                          return (
                            <div key={sub.id} className="flex items-center gap-2">
                              <Avatar name={student?.name ?? 'Aluno'} size="xs" />
                              <span className="text-xs text-dark-300">{student?.name}</span>
                              <Badge variant={sub.status === 'corrigido' ? 'success' : 'info'} size="sm">{STATUS_CONFIG[sub.status].label}</Badge>
                              {sub.grade != null && <Badge variant="success" size="sm">{sub.grade}/10</Badge>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Tarefas"
        subtitle={isStudent ? 'Suas atividades e entregas' : 'Gerencie as atividades da turma'}
        icon={<CheckSquare size={20} />}
        actions={
          canCreate && (
            <Button icon={<Plus size={16} />} onClick={() => setNewTaskModal(true)} size="sm">
              Nova Tarefa
            </Button>
          )
        }
      />

      {isStudent ? (
        <Tabs defaultValue="pendentes">
          <TabsList>
            <TabsTrigger value="pendentes">Pendentes {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
            <TabsTrigger value="entregues">Entregues</TabsTrigger>
            {overdue.length > 0 && <TabsTrigger value="atrasadas">Atrasadas ({overdue.length})</TabsTrigger>}
          </TabsList>
          <TabsContent value="pendentes" className="mt-4 space-y-3">
            {pending.length === 0 ? <EmptyState icon={<CheckSquare size={24} />} title="Nenhuma tarefa pendente" description="Você está em dia! 🎉" /> :
              pending.map((item) => <TaskCard key={item.task.id} {...item} />)}
          </TabsContent>
          <TabsContent value="entregues" className="mt-4 space-y-3">
            {delivered.length === 0 ? <EmptyState icon={<Check size={24} />} title="Nenhuma tarefa entregue ainda" /> :
              delivered.map((item) => <TaskCard key={item.task.id} {...item} />)}
          </TabsContent>
          {overdue.length > 0 && (
            <TabsContent value="atrasadas" className="mt-4 space-y-3">
              {overdue.map((item) => <TaskCard key={item.task.id} {...item} />)}
            </TabsContent>
          )}
        </Tabs>
      ) : (
        <div className="space-y-3">
          {all.length === 0 ? (
            <EmptyState icon={<CheckSquare size={24} />} title="Nenhuma tarefa criada" description="Crie sua primeira tarefa para a turma"
              action={canCreate && <Button icon={<Plus size={16} />} onClick={() => setNewTaskModal(true)}>Nova Tarefa</Button>} />
          ) : all.map((item) => <TaskCard key={item.task.id} {...item} />)}
        </div>
      )}

      {/* Submit modal */}
      <Modal
        open={!!submissionModal}
        onClose={() => { setSubmissionModal(null); setSubmissionText('') }}
        title={`Entregar: ${submissionModal?.title ?? ''}`}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setSubmissionModal(null)}>Cancelar</Button>
            <Button onClick={() => submissionModal && submitTask(submissionModal)} disabled={!submissionText.trim()}>
              Entregar
            </Button>
          </div>
        }
      >
        <Textarea
          label="Sua resposta"
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          placeholder="Digite sua resposta aqui..."
          rows={6}
          fullWidth
        />
      </Modal>

      {/* New task modal */}
      <Modal
        open={newTaskModal}
        onClose={() => setNewTaskModal(false)}
        title="Nova Tarefa"
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setNewTaskModal(false)}>Cancelar</Button>
            <Button onClick={createTask}>Criar Tarefa</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Título *" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Título da tarefa" fullWidth />
          <Textarea label="Descrição" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Descreva a tarefa..." fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Disciplina *"
              value={newTask.subject_id}
              onChange={(e) => setNewTask({ ...newTask, subject_id: e.target.value })}
              options={[{ value: '', label: 'Selecione' }, ...(storage.getArray('subjects').map((s) => ({ value: s.id, label: s.name })))]}
              fullWidth
            />
            {data && data.classes.length >= 1 && (
              <Select
                label="Turma"
                value={newTask.class_id}
                onChange={(e) => setNewTask({ ...newTask, class_id: e.target.value })}
                options={[{ value: '', label: 'Selecione' }, ...data.classes.map((c) => ({ value: c.id, label: c.name }))]}
                fullWidth
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prazo *" type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} fullWidth />
            <Input label="Pontuação máxima" type="number" value={newTask.max_score} onChange={(e) => setNewTask({ ...newTask, max_score: e.target.value })} fullWidth />
          </div>

          {/* Attachments */}
          <div>
            <p className="text-sm font-medium text-dark-300 mb-2">Materiais anexados</p>
            {taskAttachments.length > 0 && (
              <div className="space-y-1 mb-2">
                {taskAttachments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800 border border-dark-700">
                    <span className="text-sm text-dark-200">{a.name} <span className="text-dark-500">({a.type})</span></span>
                    <button onClick={() => setTaskAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-dark-500 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input value={newAttachment.name} onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })} placeholder="Nome do arquivo" className="flex-1" />
              <Input value={newAttachment.url} onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })} placeholder="URL" className="flex-1" />
              <Select value={newAttachment.type} onChange={(e) => setNewAttachment({ ...newAttachment, type: e.target.value })}
                options={[{ value: 'pdf', label: 'PDF' }, { value: 'image', label: 'Imagem' }, { value: 'link', label: 'Link' }, { value: 'other', label: 'Vídeo/Outro' }]}
                className="w-28" />
              <Button variant="secondary" size="sm" onClick={addAttachment} icon={<Plus size={14} />}>Add</Button>
            </div>
          </div>

          {/* Questions */}
          <div>
            <p className="text-sm font-medium text-dark-300 mb-2">Atividade (questões opcionais)</p>
            {taskQuestions.length > 0 && (
              <div className="space-y-1 mb-2">
                {taskQuestions.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800 border border-dark-700">
                    <span className="text-sm text-dark-200 truncate flex-1">{i + 1}. {q.text}</span>
                    <button onClick={() => setTaskQuestions((prev) => prev.filter((_, j) => j !== i))} className="text-dark-500 hover:text-red-400 ml-2"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2 p-3 border border-dark-700 rounded-xl">
              <textarea value={newQuestion.text} onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                rows={2} placeholder="Texto da questão..."
                className="w-full bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              <div className="flex gap-2">
                <Select value={newQuestion.type} onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as 'dissertativa' | 'multipla_escolha' })}
                  options={[{ value: 'dissertativa', label: 'Dissertativa' }, { value: 'multipla_escolha', label: 'Múltipla escolha' }]} className="flex-1" />
                <Button variant="secondary" size="sm" onClick={addQuestion} icon={<Plus size={14} />}>Adicionar</Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
