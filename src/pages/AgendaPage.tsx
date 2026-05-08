import { useState, useMemo } from 'react'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import { hasPermission } from '@/lib/constants'
import { generateId, nowISO } from '@/lib/utils'
import type { CalendarEvent, EventCategory } from '@/types'

const CATEGORY_COLORS: Record<EventCategory, string> = {
  prova: '#ef4444', trabalho: '#f59e0b', evento: '#60a5fa',
  feriado: '#a3a3a3', reuniao: '#a78bfa', atividade: '#34d399', pessoal: '#f472b6',
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  prova: 'Prova', trabalho: 'Trabalho', evento: 'Evento',
  feriado: 'Feriado', reuniao: 'Reunião', atividade: 'Atividade', pessoal: 'Pessoal',
}

type EventScope = 'global' | 'personal' | 'classes'

export default function AgendaPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [newEventModal, setNewEventModal] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>(() => storage.getArray('events'))
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', category: 'evento' as EventCategory,
    start_date: new Date().toISOString().slice(0, 10),
    scope: 'global' as EventScope,
    selectedClassIds: [] as string[],
  })

  const canCreate = currentUser ? hasPermission(currentUser.role, 'create_events') : false
  const allClasses = storage.getArray('classes')

  const myClasses = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'professor') {
      return allClasses.filter((c) => c.teacher_ids.includes(currentUser.id))
    }
    if (currentUser.role === 'coordenador' || currentUser.role === 'diretor') return allClasses
    return []
  }, [currentUser, allClasses])

  const myEvents = useMemo(() => {
    if (!currentUser) return events.filter((e) => e.is_global)
    if (currentUser.role === 'aluno') {
      return events.filter((e) =>
        (e.is_global && !e.is_personal) ||
        e.class_id === currentUser.class_id ||
        (e.class_ids ?? []).includes(currentUser.class_id ?? '')
      )
    }
    if (currentUser.role === 'pai') {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      return events.filter((e) =>
        (e.is_global && !e.is_personal) ||
        e.class_id === child?.class_id ||
        (e.class_ids ?? []).includes(child?.class_id ?? '')
      )
    }
    if (currentUser.role === 'professor') {
      const myClassIds = allClasses.filter((c) => c.teacher_ids.includes(currentUser.id)).map((c) => c.id)
      return events.filter((e) =>
        (e.is_global && !e.is_personal) ||
        (e.is_personal && e.created_by === currentUser.id) ||
        myClassIds.includes(e.class_id ?? '') ||
        (e.class_ids ?? []).some((cid) => myClassIds.includes(cid))
      )
    }
    // coordinator / director — see everything except other people's personal events
    return events.filter((e) => !e.is_personal || e.created_by === currentUser.id)
  }, [events, currentUser, allClasses])

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const allDays = eachDayOfInterval({ start, end })
    const startPad = start.getDay()
    const paddedStart: (Date | null)[] = Array(startPad).fill(null)
    return [...paddedStart, ...allDays]
  }, [currentMonth])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    return myEvents.filter((e) => isSameDay(parseISO(e.start_date), selectedDay))
  }, [myEvents, selectedDay])

  function getEventsForDay(day: Date) {
    return myEvents.filter((e) => isSameDay(parseISO(e.start_date), day))
  }

  function toggleClassId(classId: string) {
    setNewEvent((prev) => ({
      ...prev,
      selectedClassIds: prev.selectedClassIds.includes(classId)
        ? prev.selectedClassIds.filter((id) => id !== classId)
        : [...prev.selectedClassIds, classId],
    }))
  }

  function createEvent() {
    if (!currentUser || !newEvent.title || !newEvent.start_date) return
    const isPersonal = newEvent.scope === 'personal'
    const isGlobal = newEvent.scope === 'global' && (currentUser.role === 'diretor' || currentUser.role === 'coordenador')
    const classIds = newEvent.scope === 'classes' ? newEvent.selectedClassIds : []

    const event: CalendarEvent = {
      id: generateId(),
      title: newEvent.title,
      description: newEvent.description || undefined,
      category: newEvent.category,
      color: CATEGORY_COLORS[newEvent.category],
      start_date: new Date(newEvent.start_date + 'T12:00:00').toISOString(),
      all_day: true,
      created_by: currentUser.id,
      is_global: isGlobal,
      is_personal: isPersonal,
      class_ids: classIds.length > 0 ? classIds : undefined,
      created_at: nowISO(),
    }
    storage.push('events', event)
    setEvents((prev) => [...prev, event])
    addToast({ title: 'Evento criado!', body: newEvent.title, type: 'success' })
    setNewEventModal(false)
    setNewEvent({ title: '', description: '', category: 'evento', start_date: new Date().toISOString().slice(0, 10), scope: 'global', selectedClassIds: [] })
  }

  const upcomingEvents = [...myEvents]
    .filter((e) => new Date(e.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5)

  if (!currentUser) return null

  const isAdminOrTeacher = canCreate

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Agenda"
        subtitle="Calendário e eventos escolares"
        icon={<CalendarDays size={20} />}
        actions={
          isAdminOrTeacher && (
            <Button icon={<Plus size={16} />} onClick={() => setNewEventModal(true)} size="sm">
              Novo Evento
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card noPadding>
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <h3 className="font-semibold text-dark-100 capitalize">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-dark-500 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} />
                  const dayEvents = getEventsForDay(day)
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isCurrentDay = isToday(day)
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={`relative flex flex-col items-center p-1.5 rounded-xl transition-all min-h-14 ${
                        isSelected ? 'bg-amber-500 text-dark-900' :
                        isCurrentDay ? 'bg-amber-500/15 border border-amber-500/30' :
                        'hover:bg-dark-700'
                      } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      <span className={`text-sm font-medium ${isSelected ? 'text-dark-900' : isCurrentDay ? 'text-amber-400' : 'text-dark-200'}`}>
                        {format(day, 'd')}
                      </span>
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((evt) => (
                          <span key={evt.id} className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isSelected ? '#1f2937' : (CATEGORY_COLORS[evt.category] ?? '#f59e0b') }}
                          />
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="px-4 pb-4 flex flex-wrap gap-3">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <span key={cat} className="flex items-center gap-1 text-xs text-dark-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {CATEGORY_LABELS[cat as EventCategory]}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-dark-100 mb-3">
              {selectedDay ? format(selectedDay, "d 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
            </h3>
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-dark-500 text-center py-6">Nenhum evento neste dia</p>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3 p-3 rounded-xl border border-dark-700 hover:border-dark-500 transition-all">
                    <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: CATEGORY_COLORS[evt.category] }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-dark-100">{evt.title}</p>
                        {evt.is_personal && <Lock size={10} className="text-dark-500" />}
                      </div>
                      {evt.description && <p className="text-xs text-dark-500 mt-0.5">{evt.description}</p>}
                      <Badge variant="outline" size="sm" className="mt-1">{CATEGORY_LABELS[evt.category]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-dark-100 mb-3">Próximos Eventos</h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-dark-500 text-center py-6">Nenhum evento próximo</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evt) => {
                  const daysUntil = Math.ceil((new Date(evt.start_date).getTime() - Date.now()) / 86400000)
                  return (
                    <div key={evt.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-dark-900 text-xs font-bold shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[evt.category] }}>
                        {format(parseISO(evt.start_date), 'd')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-dark-100 truncate">{evt.title}</p>
                          {evt.is_personal && <Lock size={10} className="text-dark-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-dark-500">
                          {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `Em ${daysUntil} dias`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New event modal */}
      <Modal
        open={newEventModal}
        onClose={() => setNewEventModal(false)}
        title="Novo Evento"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setNewEventModal(false)}>Cancelar</Button>
            <Button onClick={createEvent} disabled={!newEvent.title || (newEvent.scope === 'classes' && newEvent.selectedClassIds.length === 0)}>
              Criar Evento
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Título" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Nome do evento" fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoria"
              value={newEvent.category}
              onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as EventCategory })}
              options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              fullWidth
            />
            <Input label="Data" type="date" value={newEvent.start_date} onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })} fullWidth />
          </div>

          {/* Scope selection */}
          <div>
            <label className="label">Visibilidade</label>
            <div className="flex gap-2 flex-wrap">
              {(currentUser.role === 'diretor' || currentUser.role === 'coordenador') && (
                <button
                  onClick={() => setNewEvent({ ...newEvent, scope: 'global' })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${newEvent.scope === 'global' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'border-dark-600 text-dark-400 hover:border-dark-500'}`}
                >
                  🌐 Escola toda
                </button>
              )}
              <button
                onClick={() => setNewEvent({ ...newEvent, scope: 'classes' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${newEvent.scope === 'classes' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'border-dark-600 text-dark-400 hover:border-dark-500'}`}
              >
                🏫 Turmas específicas
              </button>
              <button
                onClick={() => setNewEvent({ ...newEvent, scope: 'personal' })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${newEvent.scope === 'personal' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'border-dark-600 text-dark-400 hover:border-dark-500'}`}
              >
                <Lock size={12} className="inline mr-1" />Pessoal
              </button>
            </div>
          </div>

          {/* Class multi-select */}
          {newEvent.scope === 'classes' && myClasses.length > 0 && (
            <div>
              <label className="label">Selecione as turmas</label>
              <div className="flex flex-wrap gap-2">
                {myClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => toggleClassId(cls.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      newEvent.selectedClassIds.includes(cls.id)
                        ? 'bg-electric-500/10 border-electric-500/50 text-electric-400'
                        : 'border-dark-600 text-dark-400 hover:border-dark-500'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Textarea label="Descrição (opcional)" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} fullWidth />
        </div>
      </Modal>

      {/* Invisible motion div for page animation */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden" />
    </div>
  )
}
