import { useState, useMemo } from 'react'
import { CalendarDays, Plus, Trash2, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { hasPermission } from '@/lib/constants'
import { generateId, nowISO } from '@/lib/utils'
import type { ClassSchedule, ScheduleSlot, WeekDay } from '@/types'

const DAYS: { key: WeekDay; label: string }[] = [
  { key: 'segunda', label: 'Segunda' },
  { key: 'terca', label: 'Terça' },
  { key: 'quarta', label: 'Quarta' },
  { key: 'quinta', label: 'Quinta' },
  { key: 'sexta', label: 'Sexta' },
]

const TIME_SLOTS = [
  '07:00', '07:50', '08:40', '09:30', '10:30', '11:20',
  '13:00', '13:50', '14:40', '15:30', '16:20', '17:10', '19:00', '19:50', '20:40',
]

export default function HorariosPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [selectedClassId, setSelectedClassId] = useState('')
  const [addSlotModal, setAddSlotModal] = useState(false)
  const [newSlot, setNewSlot] = useState<{ day: WeekDay; time_start: string; time_end: string; subject_id: string; teacher_id: string }>({
    day: 'segunda', time_start: '07:00', time_end: '07:50', subject_id: '', teacher_id: '',
  })

  const canEdit = currentUser ? hasPermission(currentUser.role, 'manage_classes') : false

  const data = useMemo(() => {
    if (!currentUser) return null
    const allClasses = storage.getArray('classes')
    const subjects = storage.getArray('subjects')
    const teachers = storage.getArray('users').filter((u) => u.role === 'professor')

    let visibleClasses = allClasses
    if (currentUser.role === 'professor') {
      visibleClasses = allClasses.filter((c) => c.teacher_ids.includes(currentUser.id))
    } else if (currentUser.role === 'aluno') {
      visibleClasses = allClasses.filter((c) => c.id === currentUser.class_id)
    } else if (currentUser.role === 'pai') {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      visibleClasses = allClasses.filter((c) => c.id === child?.class_id)
    }

    return { classes: visibleClasses, subjects, teachers }
  }, [currentUser])

  const activeClass = useMemo(() => {
    if (!data) return null
    if (selectedClassId) return data.classes.find((c) => c.id === selectedClassId) ?? data.classes[0]
    return data.classes[0] ?? null
  }, [data, selectedClassId])

  const schedule = useMemo((): ClassSchedule | null => {
    if (!activeClass) return null
    return storage.getArray('horarios').find((h) => h.class_id === activeClass.id) ?? null
  }, [activeClass])

  const [localSchedule, setLocalSchedule] = useState<ClassSchedule | null>(null)
  const currentSchedule = localSchedule ?? schedule

  function getSlots(day: WeekDay): ScheduleSlot[] {
    return (currentSchedule?.slots ?? [])
      .filter((s) => s.day === day)
      .sort((a, b) => a.time_start.localeCompare(b.time_start))
  }

  function addSlot() {
    if (!activeClass || !currentUser || !newSlot.subject_id) {
      addToast({ title: 'Selecione a disciplina', body: '', type: 'error' }); return
    }
    const slot: ScheduleSlot = {
      id: generateId(),
      day: newSlot.day,
      time_start: newSlot.time_start,
      time_end: newSlot.time_end,
      subject_id: newSlot.subject_id,
      teacher_id: newSlot.teacher_id,
    }
    const existing = currentSchedule ?? {
      id: generateId(),
      class_id: activeClass.id,
      academic_year: new Date().getFullYear(),
      slots: [],
      created_by: currentUser.id,
      created_at: nowISO(),
      updated_at: nowISO(),
    }
    const updated: ClassSchedule = { ...existing, slots: [...existing.slots, slot], updated_at: nowISO() }
    setLocalSchedule(updated)
    setAddSlotModal(false)
    setNewSlot({ day: 'segunda', time_start: '07:00', time_end: '07:50', subject_id: '', teacher_id: '' })
  }

  function removeSlot(slotId: string) {
    if (!currentSchedule) return
    const updated: ClassSchedule = { ...currentSchedule, slots: currentSchedule.slots.filter((s) => s.id !== slotId), updated_at: nowISO() }
    setLocalSchedule(updated)
  }

  function saveSchedule() {
    if (!localSchedule) return
    const existing = storage.getArray('horarios').find((h) => h.class_id === localSchedule.class_id)
    if (existing) {
      storage.update<ClassSchedule>('horarios', existing.id, {
        slots: localSchedule.slots,
        updated_at: nowISO(),
      })
    } else {
      storage.push('horarios', localSchedule)
    }
    setLocalSchedule(null)
    addToast({ title: 'Horário salvo!', body: `${localSchedule.slots.length} aulas configuradas`, type: 'success' })
  }

  if (!currentUser || !data) return null

  const isDirty = localSchedule !== null

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Horários"
        subtitle="Grade de aulas semanal"
        icon={<CalendarDays size={20} />}
        actions={
          <div className="flex gap-2">
            {canEdit && (
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setAddSlotModal(true)} disabled={!activeClass}>
                Adicionar Aula
              </Button>
            )}
            {canEdit && isDirty && (
              <Button size="sm" icon={<Save size={14} />} onClick={saveSchedule}>
                Salvar
              </Button>
            )}
          </div>
        }
      />

      {/* Class selector */}
      {data.classes.length > 1 && (
        <Select
          options={data.classes.map((c) => ({ value: c.id, label: c.name }))}
          value={activeClass?.id ?? ''}
          onChange={(e) => { setSelectedClassId(e.target.value); setLocalSchedule(null) }}
          className="w-48"
        />
      )}

      {activeClass ? (
        <>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-dark-100">{activeClass.name}</h2>
            <Badge variant="outline" size="sm">{activeClass.year}º ano</Badge>
            {isDirty && <Badge variant="warning" size="sm">Alterações não salvas</Badge>}
          </div>

          {/* Timetable grid */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="w-20 py-2 text-xs text-dark-500 font-medium text-left">Horário</th>
                  {DAYS.map((d) => (
                    <th key={d.key} className="py-2 text-xs text-dark-300 font-semibold text-center">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time} className="border-t border-dark-800">
                    <td className="py-1 pr-3 text-xs text-dark-500 font-mono">{time}</td>
                    {DAYS.map((d) => {
                      const slot = getSlots(d.key).find((s) => s.time_start === time)
                      const subject = slot ? data.subjects.find((s) => s.id === slot.subject_id) : null
                      const teacher = slot ? data.teachers.find((t) => t.id === slot.teacher_id) : null
                      return (
                        <td key={d.key} className="py-1 px-1">
                          {slot && subject ? (
                            <div
                              className="group relative rounded-lg px-2 py-1.5 text-xs"
                              style={{ backgroundColor: subject.color + '20', borderLeft: `3px solid ${subject.color}` }}
                            >
                              <p className="font-medium leading-tight" style={{ color: subject.color }}>{subject.name}</p>
                              {teacher && <p className="text-dark-400 text-xs mt-0.5 truncate">{teacher.name.split(' ')[0]}</p>}
                              {canEdit && (
                                <button
                                  onClick={() => removeSlot(slot.id)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-dark-500 hover:text-red-400 transition-all"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                          ) : null}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(currentSchedule?.slots ?? []).length === 0 && (
            <Card className="text-center py-12">
              <CalendarDays size={40} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Nenhuma aula configurada ainda</p>
              {canEdit && <p className="text-xs text-dark-600 mt-1">Clique em "Adicionar Aula" para montar o horário</p>}
            </Card>
          )}
        </>
      ) : (
        <Card className="text-center py-12">
          <CalendarDays size={40} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">Nenhuma turma disponível</p>
        </Card>
      )}

      {/* Add slot modal */}
      <Modal
        open={addSlotModal}
        onClose={() => setAddSlotModal(false)}
        title="Adicionar Aula ao Horário"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setAddSlotModal(false)}>Cancelar</Button>
            <Button onClick={addSlot}>Adicionar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Dia da semana"
            value={newSlot.day}
            onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value as WeekDay })}
            options={DAYS.map((d) => ({ value: d.key, label: d.label }))}
            fullWidth
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Início"
              value={newSlot.time_start}
              onChange={(e) => setNewSlot({ ...newSlot, time_start: e.target.value })}
              options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
              fullWidth
            />
            <Select
              label="Fim"
              value={newSlot.time_end}
              onChange={(e) => setNewSlot({ ...newSlot, time_end: e.target.value })}
              options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
              fullWidth
            />
          </div>
          <Select
            label="Disciplina *"
            value={newSlot.subject_id}
            onChange={(e) => setNewSlot({ ...newSlot, subject_id: e.target.value })}
            options={[
              { value: '', label: 'Selecione a disciplina' },
              ...(activeClass ? data.subjects.filter((s) => activeClass.subject_ids.includes(s.id)) : data.subjects)
                .map((s) => ({ value: s.id, label: s.name })),
            ]}
            fullWidth
          />
          <Select
            label="Professor"
            value={newSlot.teacher_id}
            onChange={(e) => setNewSlot({ ...newSlot, teacher_id: e.target.value })}
            options={[
              { value: '', label: 'Selecione o professor' },
              ...(activeClass
                ? data.teachers.filter((t) => activeClass.teacher_ids.includes(t.id))
                : data.teachers
              ).map((t) => ({ value: t.id, label: t.name })),
            ]}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  )
}
