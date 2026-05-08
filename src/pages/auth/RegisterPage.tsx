import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, User, Mail, Lock, Phone, Hash, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { storage } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { User as UserType, UserRole } from '@/types'

const ROLE_OPTIONS = [
  { value: 'aluno', label: 'Aluno' },
  { value: 'pai', label: 'Responsável' },
  { value: 'professor', label: 'Professor' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'diretor', label: 'Diretor' },
]

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  role: UserRole
  enrollment_number: string
  class_id: string
}

const INITIAL: FormData = {
  name: '', email: '', password: '', confirmPassword: '',
  phone: '', role: 'aluno', enrollment_number: '', class_id: '',
}

function validate(data: FormData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!data.name.trim()) errors.name = 'Nome é obrigatório'
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = 'E-mail inválido'
  if (data.password.length < 6) errors.password = 'Mínimo 6 caracteres'
  if (data.password !== data.confirmPassword) errors.confirmPassword = 'Senhas não coincidem'
  if (data.phone && !/^\d{10,11}$/.test(data.phone.replace(/\D/g, '')))
    errors.phone = 'Telefone inválido (10 ou 11 dígitos)'
  if (data.role === 'aluno') {
    if (!data.enrollment_number) errors.enrollment_number = 'RA é obrigatório'
    else if (!/^\d+$/.test(data.enrollment_number)) errors.enrollment_number = 'RA deve conter apenas números'
    else {
      const users = storage.getArray('users')
      const exists = users.find((u) => u.enrollment_number === data.enrollment_number)
      if (exists) errors.enrollment_number = 'RA já cadastrado'
    }
  }
  return errors
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const classes = storage.getArray('classes')

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validateStep(s: number): boolean {
    let fields: (keyof FormData)[] = []
    if (s === 1) fields = ['name', 'email', 'role']
    if (s === 2) fields = ['password', 'confirmPassword', 'phone']
    const errs = validate(form)
    const stepErrors: Record<string, string> = {}
    fields.forEach((f) => { if (errs[f]) stepErrors[f] = errs[f] })
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  function handleNext() {
    if (validateStep(step)) setStep(step + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const allErrors = validate(form)
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) return

    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    const newUser: UserType = {
      id: generateId(),
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      role: form.role,
      phone: form.phone.replace(/\D/g, '') || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      enrollment_number: form.role === 'aluno' ? form.enrollment_number : undefined,
      class_id: form.role === 'aluno' && form.class_id ? form.class_id : undefined,
    }

    const passwords = storage.get('passwords') ?? {}
    passwords[newUser.id] = form.password
    storage.push('users', newUser)
    storage.set('passwords', passwords)

    // Auto-login after registration
    const result = await login(form.email, form.password)
    setLoading(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <Zap size={18} className="text-dark-900" />
          </div>
          <span className="text-xl font-bold text-white">Elo</span>
        </div>

        <h1 className="text-2xl font-bold text-dark-50 mb-1">Criar conta</h1>
        <p className="text-dark-400 mb-6">Etapa {step} de {form.role === 'aluno' ? 3 : 2}</p>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, ...(form.role === 'aluno' ? [3] : [])].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-amber-500' : 'bg-dark-700'}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Input label="Nome completo" value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="Seu nome completo" icon={<User size={16} />} error={errors.name} fullWidth />
              <Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="seu@email.com" icon={<Mail size={16} />} error={errors.email} fullWidth />
              <Select label="Tipo de usuário" value={form.role}
                onChange={(e) => set('role', e.target.value)}
                options={ROLE_OPTIONS} error={errors.role} fullWidth />
              <Button type="button" fullWidth size="lg" onClick={handleNext} iconRight={<ArrowRight size={18} />}>
                Continuar
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Input label="Senha" type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Mínimo 6 caracteres" icon={<Lock size={16} />}
                iconRight={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                error={errors.password} fullWidth />
              <Input label="Confirmar senha" type="password" value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                placeholder="Digite a senha novamente" icon={<Lock size={16} />}
                error={errors.confirmPassword} fullWidth />
              <Input label="Telefone (opcional)" value={form.phone}
                onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))}
                placeholder="(11) 99999-0000" icon={<Phone size={16} />}
                error={errors.phone} fullWidth />
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)} icon={<ArrowLeft size={18} />} className="w-16 shrink-0" />
                {form.role === 'aluno' ? (
                  <Button type="button" fullWidth size="lg" onClick={handleNext} iconRight={<ArrowRight size={18} />}>Continuar</Button>
                ) : (
                  <Button type="submit" fullWidth size="lg" loading={loading} iconRight={<ArrowRight size={18} />}>Criar conta</Button>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && form.role === 'aluno' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <Input label="RA (Registro do Aluno)" value={form.enrollment_number}
                onChange={(e) => set('enrollment_number', e.target.value.replace(/\D/g, ''))}
                placeholder="Apenas números" icon={<Hash size={16} />}
                error={errors.enrollment_number} fullWidth
                hint="Seu número de matrícula fornecido pela escola" />
              <Select label="Turma" value={form.class_id}
                onChange={(e) => set('class_id', e.target.value)}
                options={[{ value: '', label: 'Selecione sua turma' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
                error={errors.class_id} fullWidth />
              <div className="flex gap-3">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(2)} icon={<ArrowLeft size={18} />} className="w-16 shrink-0" />
                <Button type="submit" fullWidth size="lg" loading={loading} iconRight={<ArrowRight size={18} />}>Criar conta</Button>
              </div>
            </motion.div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-dark-400">
          Já tem conta?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">Entrar</Link>
        </p>
      </motion.div>
    </div>
  )
}
