import { useState, useMemo } from 'react'
import { ClipboardList, Play, Clock, CheckCircle, XCircle, BarChart2, ChevronRight, ChevronLeft, Plus, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { hasPermission } from '@/lib/constants'
import { generateId, nowISO } from '@/lib/utils'
import { generateQuizQuestions } from '@/lib/gemini'
import type { Quiz, QuizAttempt, QuizQuestion } from '@/types'

type Phase = 'list' | 'quiz' | 'result'

const QUIZ_TYPES = [
  { value: 'multipla_escolha', label: 'Quiz Rápido', desc: '4 alternativas A-D', emoji: '⚡' },
  { value: 'enem', label: 'Estilo ENEM', desc: '5 alternativas A-E', emoji: '📚' },
  { value: 'verdadeiro_falso', label: 'Verdadeiro/Falso', desc: 'Questões V ou F', emoji: '✅' },
  { value: 'dissertativa', label: 'Dissertativa', desc: 'Resposta aberta', emoji: '✍️' },
  { value: 'desafio', label: 'Misto', desc: 'Mix de tipos', emoji: '🎯' },
] as const

function getOptionCount(type: string) {
  if (type === 'enem') return 5
  if (type === 'verdadeiro_falso') return 2
  if (type === 'dissertativa') return 0
  return 4
}

function getCorrectAnswer(q: QuizQuestion): string {
  if (q.type === 'verdadeiro_falso') return q.correct_boolean ? 'Verdadeiro' : 'Falso'
  if (q.type === 'multipla_escolha' && q.options) return q.options[q.correct_option ?? 0] ?? ''
  return ''
}

function isAnswerCorrect(q: QuizQuestion, answer: string): boolean {
  if (q.type === 'dissertativa') return true
  return answer === getCorrectAnswer(q)
}

interface NewQuestion {
  text: string
  type: 'multipla_escolha' | 'verdadeiro_falso' | 'dissertativa'
  options: string[]
  correct_option: number
  correct_boolean: boolean
  explanation: string
  points: number
}

function makeEmptyQuestion(quizType: string, index: number): NewQuestion {
  const isVF = quizType === 'verdadeiro_falso'
  const isDiss = quizType === 'dissertativa'
  const count = getOptionCount(quizType)
  return {
    text: '',
    type: isDiss ? 'dissertativa' : isVF ? 'verdadeiro_falso' : 'multipla_escolha',
    options: Array.from({ length: count }, () => ''),
    correct_option: 0,
    correct_boolean: true,
    explanation: '',
    points: 10 / Math.max(1, index),
  }
}

export default function SimuladosPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [phase, setPhase] = useState<Phase>('list')
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => storage.getArray('quiz_attempts'))
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => storage.getArray('quizzes'))

  // Creation
  const [createStep, setCreateStep] = useState<'meta' | number>('meta')
  const [createModal, setCreateModal] = useState(false)
  const [meta, setMeta] = useState({
    title: '', description: '', quizType: 'multipla_escolha', subject_id: '', class_id: '',
    questionCount: 5, time_limit: 0, trimester: '1' as '1' | '2' | '3',
  })
  const [questions, setQuestions] = useState<NewQuestion[]>([])
  const [editingQ, setEditingQ] = useState<NewQuestion | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const canCreate = currentUser ? hasPermission(currentUser.role, 'create_quizzes') : false

  const data = useMemo(() => {
    if (!currentUser) return null
    const subjects = storage.getArray('subjects')
    const classes = storage.getArray('classes')
    let filtered = [...quizzes]

    if (currentUser.role === 'aluno') {
      filtered = filtered.filter((q) => q.class_id === currentUser.class_id && q.is_published)
    } else if (currentUser.role === 'pai') {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      filtered = filtered.filter((q) => q.class_id === child?.class_id && q.is_published)
    } else if (currentUser.role === 'professor') {
      const myClassIds = classes.filter((c) => c.teacher_ids.includes(currentUser.id)).map((c) => c.id)
      filtered = filtered.filter((q) => myClassIds.includes(q.class_id))
    }

    const myClasses = currentUser.role === 'professor'
      ? classes.filter((c) => c.teacher_ids.includes(currentUser.id))
      : classes

    return { quizzes: filtered, subjects, classes: myClasses }
  }, [currentUser, quizzes])

  // ---- QUIZ TAKING ----
  function startQuiz(quiz: Quiz) {
    setActiveQuiz(quiz); setCurrentQ(0); setAnswers({}); setPhase('quiz')
  }

  function selectAnswer(answer: string) {
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }))
  }

  function nextQuestion() {
    if (!activeQuiz) return
    if (currentQ < activeQuiz.questions.length - 1) setCurrentQ((prev) => prev + 1)
    else submitQuiz()
  }

  function prevQuestion() { setCurrentQ((prev) => Math.max(0, prev - 1)) }

  function submitQuiz() {
    if (!activeQuiz || !currentUser) return
    const sorted = [...activeQuiz.questions].sort((a, b) => a.order - b.order)
    let correctCount = 0, totalPoints = 0, earnedPoints = 0
    sorted.forEach((q, i) => {
      const answer = answers[i] ?? ''
      totalPoints += q.points
      if (isAnswerCorrect(q, answer)) { correctCount++; earnedPoints += q.points }
    })
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const now = nowISO()
    const attempt: QuizAttempt = {
      id: generateId(), quiz_id: activeQuiz.id, student_id: currentUser.id,
      answers: sorted.map((q, i) => ({ question_id: q.id, answer: answers[i] ?? '' })),
      score: earnedPoints, max_score: totalPoints, percentage, time_spent_seconds: 0,
      started_at: now, finished_at: now,
    }
    storage.push('quiz_attempts', attempt)
    setAttempts((prev) => [attempt, ...prev])
    setLastAttempt(attempt)
    setPhase('result')
    addToast({
      title: 'Simulado concluído!',
      body: `${correctCount}/${sorted.length} questões (${percentage}%)`,
      type: percentage >= 70 ? 'success' : 'info',
    })
  }

  function resetToList() {
    setPhase('list'); setActiveQuiz(null); setCurrentQ(0); setAnswers({}); setLastAttempt(null)
  }

  // ---- QUIZ CREATION ----
  function openCreate() {
    setMeta({ title: '', description: '', quizType: 'multipla_escolha', subject_id: '', class_id: '', questionCount: 5, time_limit: 0, trimester: '1' })
    setQuestions([])
    setCreateStep('meta')
    setCreateModal(true)
  }

  function proceedToQuestions() {
    if (!meta.title.trim() || !meta.subject_id || !meta.class_id) {
      addToast({ title: 'Preencha título, disciplina e turma', body: '', type: 'error' }); return
    }
    const qs = Array.from({ length: meta.questionCount }, (_, i) => makeEmptyQuestion(meta.quizType, i + 1))
    setQuestions(qs)
    setEditingQ({ ...qs[0] })
    setCreateStep(0)
  }

  async function generateWithAI() {
    if (!meta.title.trim() || !meta.subject_id || !meta.class_id) {
      addToast({ title: 'Preencha título, disciplina e turma antes de usar a IA', body: '', type: 'error' }); return
    }
    const subject = data?.subjects.find((s) => s.id === meta.subject_id)
    setAiLoading(true)
    try {
      const aiQs = await generateQuizQuestions(meta.quizType, meta.questionCount, meta.title, subject?.name ?? 'Geral')
      const qs: NewQuestion[] = aiQs.map((q, i) => ({
        text: q.text,
        type: meta.quizType === 'verdadeiro_falso' ? 'verdadeiro_falso'
            : meta.quizType === 'dissertativa' ? 'dissertativa' : 'multipla_escolha',
        options: q.options ?? Array.from({ length: getOptionCount(meta.quizType) }, () => ''),
        correct_option: q.correct_option ?? 0,
        correct_boolean: q.correct_boolean ?? true,
        explanation: q.explanation ?? '',
        points: Math.max(1, Math.round(10 / Math.max(1, i + 1))),
      }))
      setQuestions(qs)
      setEditingQ({ ...qs[0] })
      setCreateStep(0)
      addToast({ title: '✨ Questões geradas com IA!', body: `${qs.length} questões prontas para revisar`, type: 'success' })
    } catch (err) {
      addToast({ title: 'Erro ao gerar com IA', body: err instanceof Error ? err.message : 'Tente novamente', type: 'error' })
    } finally {
      setAiLoading(false)
    }
  }

  function saveCurrentQuestion() {
    if (typeof createStep !== 'number' || !editingQ) return
    if (!editingQ.text.trim()) { addToast({ title: 'Texto da questão é obrigatório', body: '', type: 'error' }); return }
    const updated = [...questions]
    updated[createStep] = editingQ
    setQuestions(updated)
    if (createStep < meta.questionCount - 1) {
      const next = createStep + 1
      setCreateStep(next)
      setEditingQ({ ...updated[next] })
    } else {
      publishQuiz(updated)
    }
  }

  function publishQuiz(finalQuestions: NewQuestion[]) {
    if (!currentUser) return
    const quizType = meta.quizType as Quiz['type']
    const quiz: Quiz = {
      id: generateId(),
      title: meta.title.trim(),
      description: meta.description.trim() || undefined,
      type: quizType,
      subject_id: meta.subject_id,
      class_id: meta.class_id,
      teacher_id: currentUser.id,
      questions: finalQuestions.map((q, i): QuizQuestion => ({
        id: generateId(),
        quiz_id: '',
        type: q.type,
        text: q.text.trim(),
        options: q.options.filter(Boolean).length > 0 ? q.options.filter(Boolean) : undefined,
        correct_option: q.correct_option,
        correct_boolean: q.correct_boolean,
        explanation: q.explanation.trim() || undefined,
        points: 1,
        order: i + 1,
      })),
      time_limit_minutes: meta.time_limit > 0 ? meta.time_limit : undefined,
      is_published: true,
      attempts_allowed: 3,
      show_answers_after: true,
      trimester: Number(meta.trimester) as 1 | 2 | 3,
      created_at: nowISO(),
    }
    storage.push('quizzes', quiz)
    setQuizzes((prev) => [...prev, quiz])
    setCreateModal(false)
    addToast({ title: 'Simulado criado!', body: `${finalQuestions.length} questões publicadas`, type: 'success' })
  }

  if (!currentUser || !data) return null

  // ----- QUIZ TAKING VIEW -----
  if (phase === 'quiz' && activeQuiz) {
    const sorted = [...activeQuiz.questions].sort((a, b) => a.order - b.order)
    const question = sorted[currentQ]
    const selectedAnswer = answers[currentQ] ?? ''
    const isTrueFalse = question.type === 'verdadeiro_falso'
    const isDiss = question.type === 'dissertativa'
    const options = isTrueFalse ? ['Verdadeiro', 'Falso'] : (question.options ?? [])

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" icon={<XCircle size={16} />} onClick={resetToList}>Sair</Button>
          <span className="text-sm text-dark-400">Questão {currentQ + 1} de {sorted.length}</span>
          <Badge variant="amber">{activeQuiz.title}</Badge>
        </div>
        <Progress value={currentQ + 1} max={sorted.length} size="sm" color="amber" />
        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <Card>
              <p className="text-xs text-dark-500 mb-3">Questão {currentQ + 1} · {question.points} ponto{question.points !== 1 ? 's' : ''}</p>
              <p className="font-medium text-dark-100 text-lg leading-relaxed mb-6">{question.text}</p>
              {isDiss ? (
                <textarea
                  value={selectedAnswer}
                  onChange={(e) => selectAnswer(e.target.value)}
                  rows={4}
                  placeholder="Digite sua resposta aqui..."
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl text-sm text-dark-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              ) : (
                <div className="space-y-3">
                  {options.map((opt, i) => {
                    const letter = isTrueFalse ? (i === 0 ? 'V' : 'F') : String.fromCharCode(65 + i)
                    const isSelected = selectedAnswer === opt
                    return (
                      <button key={opt} onClick={() => selectAnswer(opt)}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${isSelected ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-dark-700 hover:border-dark-500 text-dark-200'}`}>
                        <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-amber-500 text-dark-900' : 'bg-dark-700 text-dark-400'}`}>{letter}</span>
                        <span className="text-sm leading-relaxed">{opt}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-between">
          <Button variant="secondary" icon={<ChevronLeft size={16} />} onClick={prevQuestion} disabled={currentQ === 0}>Anterior</Button>
          <Button onClick={nextQuestion} disabled={!selectedAnswer && !isDiss} icon={currentQ === sorted.length - 1 ? <CheckCircle size={16} /> : <ChevronRight size={16} />}>
            {currentQ === sorted.length - 1 ? 'Finalizar' : 'Próxima'}
          </Button>
        </div>
      </div>
    )
  }

  // ----- RESULT VIEW -----
  if (phase === 'result' && lastAttempt && activeQuiz) {
    const sorted = [...activeQuiz.questions].sort((a, b) => a.order - b.order)
    const passed = lastAttempt.percentage >= 70
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader title="Resultado" subtitle={activeQuiz.title} icon={<ClipboardList size={20} />} />
        <Card className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {passed ? <CheckCircle size={48} className="text-green-400" /> : <XCircle size={48} className="text-red-400" />}
            </div>
          </motion.div>
          <p className={`text-5xl font-black mb-2 ${passed ? 'text-green-400' : 'text-red-400'}`}>{lastAttempt.percentage}%</p>
          <p className="text-dark-300 mb-1">{lastAttempt.score} de {lastAttempt.max_score} pontos</p>
          <Badge variant={passed ? 'success' : 'danger'} size="md" className="mt-2">{passed ? 'Aprovado!' : 'Continue praticando'}</Badge>
        </Card>
        <Card>
          <h3 className="font-semibold text-dark-100 mb-4">Revisão das questões</h3>
          <div className="space-y-4">
            {sorted.map((q, i) => {
              const userAnswer = answers[i] ?? ''
              const correct = getCorrectAnswer(q)
              const isCorrect = isAnswerCorrect(q, userAnswer)
              return (
                <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <p className="text-sm text-dark-200 mb-2">{i + 1}. {q.text}</p>
                  {q.type !== 'dissertativa' && (
                    <>
                      <p className={`text-xs ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{isCorrect ? '✓' : '✗'} Sua resposta: {userAnswer || 'Não respondida'}</p>
                      {!isCorrect && <p className="text-xs text-green-400 mt-0.5">✓ Correta: {correct}</p>}
                    </>
                  )}
                  {q.type === 'dissertativa' && userAnswer && <p className="text-xs text-dark-400 mt-1">Resposta: {userAnswer}</p>}
                  {q.explanation && <p className="text-xs text-dark-400 mt-2 border-t border-dark-700 pt-2">{q.explanation}</p>}
                </div>
              )
            })}
          </div>
        </Card>
        <Button onClick={resetToList} fullWidth variant="secondary">Voltar para Simulados</Button>
      </div>
    )
  }

  // ----- LIST VIEW -----
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Simulados"
        subtitle="Pratique com questões e avalie seu conhecimento"
        icon={<ClipboardList size={20} />}
        actions={canCreate && (
          <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>Criar Simulado</Button>
        )}
      />

      {data.quizzes.length === 0 ? (
        <EmptyState icon={<ClipboardList size={24} />} title="Nenhum simulado disponível" description="Simulados criados pelos professores aparecerão aqui" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.quizzes.map((quiz) => {
            const subject = data.subjects.find((s) => s.id === quiz.subject_id)
            const myAttempts = attempts.filter((a) => a.quiz_id === quiz.id && a.student_id === currentUser.id)
            const bestPct = myAttempts.length > 0 ? Math.max(...myAttempts.map((a) => a.percentage)) : null
            const typeConfig = QUIZ_TYPES.find((t) => t.value === quiz.type) ?? QUIZ_TYPES[0]

            return (
              <Card key={quiz.id} hover className="flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-lg">
                    {typeConfig.emoji}
                  </div>
                  {bestPct !== null && <Badge variant={bestPct >= 70 ? 'success' : 'danger'} size="sm">{bestPct}%</Badge>}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-dark-100">{quiz.title}</p>
                  {quiz.description && <p className="text-xs text-dark-400 mt-1 line-clamp-2">{quiz.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-dark-500">
                    <span className="flex items-center gap-1"><BarChart2 size={12} /> {quiz.questions.length} questões</span>
                    {quiz.time_limit_minutes && <span className="flex items-center gap-1"><Clock size={12} /> {quiz.time_limit_minutes} min</span>}
                  </div>
                  <Badge variant="outline" size="sm" className="mt-2">{typeConfig.label}</Badge>
                </div>
                <div className="mt-4 pt-3 border-t border-dark-700 flex items-center justify-between">
                  {subject && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: subject.color + '20', color: subject.color }}>{subject.name}</span>}
                  <Button size="sm" variant={myAttempts.length > 0 ? 'secondary' : 'primary'} icon={<Play size={14} />} onClick={() => startQuiz(quiz)} className="ml-auto">
                    {myAttempts.length > 0 ? 'Refazer' : 'Iniciar'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title={createStep === 'meta' ? 'Criar Simulado' : `Questão ${(createStep as number) + 1} de ${meta.questionCount}`}
        size="lg"
        footer={
          <div className="flex gap-3 justify-between">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancelar</Button>
            {createStep === 'meta' ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  icon={<Sparkles size={14} />}
                  onClick={generateWithAI}
                  loading={aiLoading}
                  className="text-amber-400 border-amber-500/40 hover:border-amber-500"
                >
                  Gerar com IA
                </Button>
                <Button onClick={proceedToQuestions}>Continuar →</Button>
              </div>
            ) : (
              <Button onClick={saveCurrentQuestion}>
                {(createStep as number) < meta.questionCount - 1 ? 'Próxima Questão →' : 'Publicar Simulado'}
              </Button>
            )}
          </div>
        }
      >
        {createStep === 'meta' ? (
          <div className="space-y-4">
            <Input label="Título do simulado *" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="Ex: Revisão de Matemática" fullWidth />
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Descrição</label>
              <textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} rows={2} placeholder="Descrição opcional..." className="w-full bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
            </div>
            <div>
              <p className="text-sm font-medium text-dark-300 mb-2">Tipo de simulado *</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUIZ_TYPES.map((t) => (
                  <button key={t.value} onClick={() => setMeta({ ...meta, quizType: t.value })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${meta.quizType === t.value ? 'border-amber-500 bg-amber-500/10' : 'border-dark-700 hover:border-dark-500'}`}>
                    <span className="text-2xl">{t.emoji}</span>
                    <span className={`text-xs font-medium ${meta.quizType === t.value ? 'text-amber-400' : 'text-dark-200'}`}>{t.label}</span>
                    <span className="text-xs text-dark-500">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Disciplina *" value={meta.subject_id} onChange={(e) => setMeta({ ...meta, subject_id: e.target.value })}
                options={[{ value: '', label: 'Selecione' }, ...(data?.subjects ?? []).map((s) => ({ value: s.id, label: s.name }))]} fullWidth />
              <Select label="Turma *" value={meta.class_id} onChange={(e) => setMeta({ ...meta, class_id: e.target.value })}
                options={[{ value: '', label: 'Selecione' }, ...(data?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))]} fullWidth />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Nº de questões (1–10)</label>
                <input type="range" min={1} max={10} value={meta.questionCount} onChange={(e) => setMeta({ ...meta, questionCount: Number(e.target.value) })}
                  className="w-full accent-amber-500" />
                <p className="text-center text-amber-400 font-bold mt-1">{meta.questionCount}</p>
              </div>
              <Input label="Tempo limite (min, 0 = sem limite)" type="number" value={String(meta.time_limit)}
                onChange={(e) => setMeta({ ...meta, time_limit: Number(e.target.value) })} fullWidth />
            </div>
          </div>
        ) : editingQ ? (
          <div className="space-y-4">
            <Progress value={(createStep as number) + 1} max={meta.questionCount} size="sm" color="amber" />
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Enunciado da questão *</label>
              <textarea value={editingQ.text} onChange={(e) => setEditingQ({ ...editingQ, text: e.target.value })}
                rows={3} placeholder="Digite o enunciado da questão..." className="w-full bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
            </div>

            {editingQ.type === 'multipla_escolha' && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-dark-300">Alternativas</p>
                {editingQ.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button onClick={() => setEditingQ({ ...editingQ, correct_option: i })}
                      className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${editingQ.correct_option === i ? 'bg-green-500 text-white' : 'bg-dark-700 text-dark-400 hover:bg-dark-600'}`}>
                      {String.fromCharCode(65 + i)}
                    </button>
                    <input value={opt} onChange={(e) => {
                      const updated = [...editingQ.options]; updated[i] = e.target.value
                      setEditingQ({ ...editingQ, options: updated })
                    }} placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                      className="flex-1 h-9 bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                  </div>
                ))}
                <p className="text-xs text-dark-500">Clique na letra para marcar como correta (verde)</p>
              </div>
            )}

            {editingQ.type === 'verdadeiro_falso' && (
              <div>
                <p className="text-sm font-medium text-dark-300 mb-2">Resposta correta</p>
                <div className="flex gap-3">
                  {['Verdadeiro', 'Falso'].map((v) => (
                    <button key={v} onClick={() => setEditingQ({ ...editingQ, correct_boolean: v === 'Verdadeiro' })}
                      className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${(v === 'Verdadeiro') === editingQ.correct_boolean ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-dark-700 text-dark-400 hover:border-dark-500'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingQ.type === 'dissertativa' && (
              <div className="p-3 rounded-xl bg-dark-800 border border-dark-700">
                <p className="text-xs text-dark-400">Questão dissertativa — o aluno digitará a resposta. Não há resposta automática para corrigir.</p>
              </div>
            )}

            <Input label="Explicação (opcional)" value={editingQ.explanation}
              onChange={(e) => setEditingQ({ ...editingQ, explanation: e.target.value })}
              placeholder="Explicação da resposta correta..." fullWidth />
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
