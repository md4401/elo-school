import { useState, useMemo } from 'react'
import { Building2, Users, BookOpen, GraduationCap, Plus, Trash2, UserPlus, Settings, Key, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { generateId, nowISO } from '@/lib/utils'
import type { User, SchoolClass, ClassSubject } from '@/types'

const SHIFT_LABELS: Record<string, string> = {
  manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral',
}

export default function GestaoPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [users, setUsers] = useState<User[]>(() => storage.getArray('users'))
  const [classes, setClasses] = useState<SchoolClass[]>(() => storage.getArray('classes'))
  const subjects = useMemo(() => storage.getArray('subjects'), [])

  const [studentModal, setStudentModal] = useState(false)
  const [teacherModal, setTeacherModal] = useState(false)
  const [newClassModal, setNewClassModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'class'; id: string } | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; login: string; password: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [newStudent, setNewStudent] = useState({ ra: '', name: '', year: '9', class_id: '' })
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', selectedSubjects: [] as string[], selectedClasses: [] as string[] })
  const [newClass, setNewClass] = useState({ name: '', year: '9', shift: 'manha' as SchoolClass['shift'] })

  const data = useMemo(() => {
    const students = users.filter((u) => u.role === 'aluno')
    const teachers = users.filter((u) => u.role === 'professor')
    const staff = users.filter((u) => u.role === 'coordenador' || u.role === 'diretor')
    return { students, teachers, staff }
  }, [users])

  function createStudent() {
    const ra = newStudent.ra.trim()
    const name = newStudent.name.trim()
    if (!ra || !name) { addToast({ title: 'RA e nome são obrigatórios', body: '', type: 'error' }); return }
    if (users.some((u) => u.enrollment_number === ra)) {
      addToast({ title: 'RA já cadastrado', body: `O RA ${ra} já está em uso`, type: 'error' }); return
    }
    const cls = classes.find((c) => c.id === newStudent.class_id) ?? classes[0]
    const email = `${ra}@aluno.escola.com`
    const password = ra
    const user: User = {
      id: generateId(),
      name,
      email,
      role: 'aluno',
      enrollment_number: ra,
      class_id: cls?.id,
      year: Number(newStudent.year),
      is_active: true,
      created_at: nowISO(),
      updated_at: nowISO(),
    }
    storage.push('users', user)
    const passwords = storage.get('passwords') ?? {}
    storage.set('passwords', { ...passwords, [user.id]: password })
    setUsers((prev) => [...prev, user])
    setCreatedCredentials({ name: user.name, login: ra, password })
    setStudentModal(false)
    setNewStudent({ ra: '', name: '', year: '9', class_id: '' })
  }

  function createTeacher() {
    const name = newTeacher.name.trim()
    const email = newTeacher.email.trim()
    if (!name || !email) { addToast({ title: 'Nome e e-mail são obrigatórios', body: '', type: 'error' }); return }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      addToast({ title: 'E-mail já cadastrado', body: '', type: 'error' }); return
    }
    const password = `prof${Math.floor(Math.random() * 9000 + 1000)}`
    const user: User = {
      id: generateId(),
      name,
      email,
      role: 'professor',
      subject_ids: newTeacher.selectedSubjects,
      class_ids: newTeacher.selectedClasses,
      is_active: true,
      created_at: nowISO(),
      updated_at: nowISO(),
    }
    storage.push('users', user)
    const passwords = storage.get('passwords') ?? {}
    storage.set('passwords', { ...passwords, [user.id]: password })

    // Update each selected class: add teacher_id
    const updatedClasses = classes.map((cls) => {
      if (!newTeacher.selectedClasses.includes(cls.id)) return cls
      const updated = { ...cls, teacher_ids: [...new Set([...cls.teacher_ids, user.id])] }
      storage.update<SchoolClass>('classes', cls.id, { teacher_ids: updated.teacher_ids })
      return updated
    })
    setClasses(updatedClasses)

    // Create ClassSubject records for each class × subject
    newTeacher.selectedClasses.forEach((classId) => {
      newTeacher.selectedSubjects.forEach((subjectId) => {
        const existing = storage.getArray('class_subjects').find(
          (cs) => cs.class_id === classId && cs.subject_id === subjectId
        )
        if (!existing) {
          storage.push('class_subjects', {
            id: generateId(),
            class_id: classId,
            subject_id: subjectId,
            teacher_id: user.id,
            academic_year: new Date().getFullYear(),
            trimester: 1,
          } as ClassSubject)
        }
      })
    })

    setUsers((prev) => [...prev, user])
    setCreatedCredentials({ name: user.name, login: email, password })
    setTeacherModal(false)
    setNewTeacher({ name: '', email: '', selectedSubjects: [], selectedClasses: [] })
  }

  function createClass() {
    if (!newClass.name) return
    const cls: SchoolClass = {
      id: generateId(),
      name: newClass.name,
      year: Number(newClass.year),
      grade_level: `${newClass.year}A`,
      school_id: 'school_1',
      teacher_ids: [],
      student_ids: [],
      subject_ids: subjects.slice(0, 8).map((s) => s.id),
      shift: newClass.shift,
      academic_year: new Date().getFullYear(),
      max_students: 35,
      created_at: nowISO(),
    }
    storage.push('classes', cls)
    setClasses((prev) => [...prev, cls])
    addToast({ title: 'Turma criada!', body: cls.name, type: 'success' })
    setNewClassModal(false)
    setNewClass({ name: '', year: '9', shift: 'manha' })
  }

  function deleteUser(id: string) {
    storage.remove_item('users', id)
    setUsers((prev) => prev.filter((u) => u.id !== id))
    addToast({ title: 'Usuário removido', body: '', type: 'success' })
    setDeleteConfirm(null)
  }

  function deleteClass(id: string) {
    storage.remove_item('classes', id)
    setClasses((prev) => prev.filter((c) => c.id !== id))
    addToast({ title: 'Turma removida', body: '', type: 'success' })
    setDeleteConfirm(null)
  }

  function toggleSubject(id: string) {
    setNewTeacher((prev) => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(id)
        ? prev.selectedSubjects.filter((s) => s !== id)
        : [...prev.selectedSubjects, id],
    }))
  }

  function toggleClass(id: string) {
    setNewTeacher((prev) => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(id)
        ? prev.selectedClasses.filter((c) => c !== id)
        : [...prev.selectedClasses, id],
    }))
  }

  const canDelete = currentUser?.role === 'diretor'
  const canCreate = currentUser?.role === 'diretor' || currentUser?.role === 'coordenador'

  if (!currentUser) return null

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Gestão Escolar"
        subtitle="Administração de usuários, turmas e disciplinas"
        icon={<Building2 size={20} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alunos', value: data.students.length, icon: Users, color: 'text-electric-400' },
          { label: 'Professores', value: data.teachers.length, icon: GraduationCap, color: 'text-amber-400' },
          { label: 'Turmas', value: classes.length, icon: BookOpen, color: 'text-green-400' },
          { label: 'Disciplinas', value: subjects.length, icon: Settings, color: 'text-purple-400' },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="alunos">
        <TabsList>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="professores">Professores</TabsTrigger>
          <TabsTrigger value="turmas">Turmas</TabsTrigger>
          <TabsTrigger value="disciplinas">Disciplinas</TabsTrigger>
        </TabsList>

        {/* ALUNOS */}
        <TabsContent value="alunos" className="mt-6">
          <Card noPadding>
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="font-semibold text-dark-100">Alunos ({data.students.length})</h3>
              {canCreate && (
                <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setStudentModal(true)}>
                  Novo Aluno
                </Button>
              )}
            </div>
            <div className="divide-y divide-dark-700">
              {data.students.map((student) => {
                const cls = classes.find((c) => c.id === student.class_id)
                return (
                  <div key={student.id} className="flex items-center gap-4 px-4 py-3 hover:bg-dark-800/50 transition-colors">
                    <Avatar name={student.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-100">{student.name}</p>
                      <p className="text-xs text-dark-500">RA: {student.enrollment_number} · {student.email}</p>
                    </div>
                    {cls && <Badge variant="outline" size="sm">{cls.name}</Badge>}
                    {student.year && <Badge variant="outline" size="sm">{student.year}º ano</Badge>}
                    {canDelete && (
                      <button onClick={() => setDeleteConfirm({ type: 'user', id: student.id })} className="text-dark-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
              {data.students.length === 0 && (
                <div className="p-8 text-center text-dark-500 text-sm">Nenhum aluno cadastrado</div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* PROFESSORES */}
        <TabsContent value="professores" className="mt-6">
          <Card noPadding>
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="font-semibold text-dark-100">Professores ({data.teachers.length})</h3>
              {canCreate && (
                <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setTeacherModal(true)}>
                  Novo Professor
                </Button>
              )}
            </div>
            <div className="divide-y divide-dark-700">
              {data.teachers.map((teacher) => {
                const teacherClasses = classes.filter((c) => c.teacher_ids.includes(teacher.id))
                const teacherSubjects = subjects.filter((s) => teacher.subject_ids?.includes(s.id))
                return (
                  <div key={teacher.id} className="flex items-start gap-4 px-4 py-3 hover:bg-dark-800/50 transition-colors">
                    <Avatar name={teacher.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-100">{teacher.name}</p>
                      <p className="text-xs text-dark-500 mb-2">{teacher.email}</p>
                      {teacherSubjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {teacherSubjects.map((s) => (
                            <span key={s.id} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.name}</span>
                          ))}
                        </div>
                      )}
                      {teacherClasses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {teacherClasses.map((c) => <Badge key={c.id} variant="amber" size="sm">{c.name}</Badge>)}
                        </div>
                      )}
                    </div>
                    {canDelete && (
                      <button onClick={() => setDeleteConfirm({ type: 'user', id: teacher.id })} className="text-dark-600 hover:text-red-400 transition-colors mt-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
              {data.teachers.length === 0 && (
                <div className="p-8 text-center text-dark-500 text-sm">Nenhum professor cadastrado</div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TURMAS */}
        <TabsContent value="turmas" className="mt-6">
          <div className="flex justify-end mb-4">
            {canCreate && <Button size="sm" icon={<Plus size={14} />} onClick={() => setNewClassModal(true)}>Nova Turma</Button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const clsStudents = data.students.filter((s) => s.class_id === cls.id)
              const clsTeachers = data.teachers.filter((t) => cls.teacher_ids.includes(t.id))
              const clsSubjects = subjects.filter((s) => cls.subject_ids.includes(s.id))
              return (
                <Card key={cls.id} hover>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-dark-100">{cls.name}</h3>
                      <p className="text-xs text-dark-500">{cls.year}º ano · {SHIFT_LABELS[cls.shift]}</p>
                    </div>
                    {canDelete && (
                      <button onClick={() => setDeleteConfirm({ type: 'class', id: cls.id })} className="text-dark-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-dark-400 mb-3">
                    <div className="flex justify-between"><span>Alunos</span><span className="text-dark-200">{clsStudents.length}</span></div>
                    <div className="flex justify-between"><span>Professores</span><span className="text-dark-200">{clsTeachers.length}</span></div>
                    <div className="flex justify-between"><span>Disciplinas</span><span className="text-dark-200">{clsSubjects.length}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {clsSubjects.slice(0, 5).map((s) => (
                      <span key={s.id} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.name.substring(0, 10)}</span>
                    ))}
                    {clsSubjects.length > 5 && <span className="text-xs text-dark-500">+{clsSubjects.length - 5}</span>}
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* DISCIPLINAS */}
        <TabsContent value="disciplinas" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <Card key={sub.id} hover>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sub.color + '20' }}>
                    <BookOpen size={18} style={{ color: sub.color }} />
                  </div>
                  <div>
                    <p className="font-medium text-dark-100">{sub.name}</p>
                    <p className="text-xs text-dark-500">{sub.code}</p>
                  </div>
                </div>
                <p className="text-xs text-dark-500">{sub.workload_hours}h/ano</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* NEW STUDENT MODAL */}
      <Modal
        open={studentModal}
        onClose={() => setStudentModal(false)}
        title="Cadastrar Aluno"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStudentModal(false)}>Cancelar</Button>
            <Button onClick={createStudent}>Criar Conta</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-electric-400/10 border border-electric-400/20">
            <p className="text-xs text-electric-400">O login e senha serão gerados automaticamente a partir do RA.</p>
          </div>
          <Input
            label="RA (Registro do Aluno)"
            value={newStudent.ra}
            onChange={(e) => setNewStudent({ ...newStudent, ra: e.target.value })}
            placeholder="Ex: 20251234"
            fullWidth
          />
          <Input
            label="Nome completo"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            placeholder="Nome do aluno"
            fullWidth
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Ano"
              value={newStudent.year}
              onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
              options={['6', '7', '8', '9', '1', '2', '3'].map((y) => ({ value: y, label: y.length === 1 && Number(y) <= 3 ? `${y}º EM` : `${y}º EF` }))}
              fullWidth
            />
            <Select
              label="Turma"
              value={newStudent.class_id}
              onChange={(e) => setNewStudent({ ...newStudent, class_id: e.target.value })}
              options={[{ value: '', label: 'Selecione' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
              fullWidth
            />
          </div>
          {newStudent.ra && (
            <div className="p-3 rounded-xl bg-dark-800 border border-dark-700 space-y-1">
              <p className="text-xs text-dark-400">Credenciais que serão criadas:</p>
              <p className="text-xs text-dark-200">Login: <span className="text-amber-400 font-mono">{newStudent.ra}</span></p>
              <p className="text-xs text-dark-200">Senha: <span className="text-amber-400 font-mono">{newStudent.ra}</span></p>
              <p className="text-xs text-dark-200">E-mail: <span className="text-amber-400 font-mono">{newStudent.ra}@aluno.escola.com</span></p>
            </div>
          )}
        </div>
      </Modal>

      {/* NEW TEACHER MODAL */}
      <Modal
        open={teacherModal}
        onClose={() => setTeacherModal(false)}
        title="Cadastrar Professor"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setTeacherModal(false)}>Cancelar</Button>
            <Button onClick={createTeacher}>Criar Conta</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome completo"
            value={newTeacher.name}
            onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
            placeholder="Nome do professor"
            fullWidth
          />
          <Input
            label="E-mail"
            type="email"
            value={newTeacher.email}
            onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
            placeholder="professor@escola.com"
            fullWidth
          />

          <div>
            <p className="text-sm font-medium text-dark-200 mb-2">Disciplinas que leciona</p>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-dark-700 rounded-xl p-2">
              {subjects.map((sub) => (
                <label key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTeacher.selectedSubjects.includes(sub.id)}
                    onChange={() => toggleSubject(sub.id)}
                    className="accent-amber-500"
                  />
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                  <span className="text-sm text-dark-200">{sub.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-dark-200 mb-2">Turmas em que leciona</p>
            <div className="max-h-32 overflow-y-auto space-y-1 border border-dark-700 rounded-xl p-2">
              {classes.map((cls) => (
                <label key={cls.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTeacher.selectedClasses.includes(cls.id)}
                    onChange={() => toggleClass(cls.id)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-dark-200">{cls.name}</span>
                  <span className="text-xs text-dark-500">{cls.year}º ano · {SHIFT_LABELS[cls.shift]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-dark-800 border border-dark-700">
            <p className="text-xs text-dark-400">Uma senha aleatória será gerada para o primeiro acesso.</p>
          </div>
        </div>
      </Modal>

      {/* NEW CLASS MODAL */}
      <Modal
        open={newClassModal}
        onClose={() => setNewClassModal(false)}
        title="Nova Turma"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setNewClassModal(false)}>Cancelar</Button>
            <Button onClick={createClass}>Criar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Nome da turma" value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} placeholder="Ex: 9º A" fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ano"
              value={newClass.year}
              onChange={(e) => setNewClass({ ...newClass, year: e.target.value })}
              options={['6', '7', '8', '9', '1', '2', '3'].map((y) => ({ value: y, label: `${y}º ano` }))}
              fullWidth
            />
            <Select
              label="Período"
              value={newClass.shift}
              onChange={(e) => setNewClass({ ...newClass, shift: e.target.value as SchoolClass['shift'] })}
              options={Object.entries(SHIFT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              fullWidth
            />
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => {
              if (!deleteConfirm) return
              if (deleteConfirm.type === 'user') deleteUser(deleteConfirm.id)
              else deleteClass(deleteConfirm.id)
            }}>Excluir</Button>
          </div>
        }
      >
        <p className="text-dark-300">Tem certeza que deseja excluir? Esta ação não pode ser desfeita.</p>
      </Modal>

      {/* CREDENTIALS MODAL */}
      <Modal
        open={!!createdCredentials}
        onClose={() => { setCreatedCredentials(null); setShowPassword(false) }}
        title="Conta criada com sucesso!"
        footer={
          <div className="flex justify-end">
            <Button onClick={() => { setCreatedCredentials(null); setShowPassword(false) }}>Fechar</Button>
          </div>
        }
      >
        {createdCredentials && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <Key size={20} className="text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-400">Credenciais de acesso</p>
                <p className="text-xs text-dark-400">Anote e entregue ao usuário</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-dark-800 border border-dark-700">
                <p className="text-xs text-dark-500 mb-1">Usuário</p>
                <p className="font-semibold text-dark-100">{createdCredentials.name}</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-800 border border-dark-700">
                <p className="text-xs text-dark-500 mb-1">Login</p>
                <p className="font-mono text-amber-400">{createdCredentials.login}</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-800 border border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-dark-500 mb-1">Senha</p>
                    <p className="font-mono text-amber-400">{showPassword ? createdCredentials.password : '••••••••'}</p>
                  </div>
                  <button onClick={() => setShowPassword(!showPassword)} className="text-dark-400 hover:text-dark-200">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
