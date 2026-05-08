import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, KeyRound } from 'lucide-react'
import { storage } from '@/lib/storage'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Step = 'lookup' | 'reset' | 'done'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('lookup')
  const [identifier, setIdentifier] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [foundUserId, setFoundUserId] = useState('')

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!identifier.trim()) { setError('Digite seu e-mail ou RA'); return }

    if (isSupabaseEnabled && supabase) {
      const users = storage.getArray('users')
      const byRA = users.find((u) => u.enrollment_number === identifier.trim())
      const email = byRA ? byRA.email : identifier.trim()

      setLoading(true)
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      })
      setLoading(false)
      if (err) { setError(err.message); return }
      setStep('done')
    } else {
      const users = storage.getArray('users')
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === identifier.toLowerCase() ||
          (u.enrollment_number && u.enrollment_number === identifier.trim()),
      )
      if (!user) { setError('Conta não encontrada'); return }
      setFoundUserId(user.id)
      setStep('reset')
    }
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (newPassword !== confirmPassword) { setError('Senhas não coincidem'); return }
    const passwords = storage.get('passwords') ?? {}
    passwords[foundUserId] = newPassword
    storage.set('passwords', passwords)
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <Zap size={18} className="text-dark-900" />
          </div>
          <span className="text-xl font-bold text-white">Elo</span>
        </div>

        {step === 'done' ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={32} className="text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-dark-50 mb-2">
              {isSupabaseEnabled ? 'E-mail enviado!' : 'Senha alterada!'}
            </h1>
            <p className="text-dark-400 mb-6">
              {isSupabaseEnabled
                ? 'Verifique sua caixa de entrada para o link de recuperação.'
                : 'Sua senha foi atualizada com sucesso.'}
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors">
              <ArrowLeft size={16} /> Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-dark-50 mb-1">Recuperar senha</h1>
            <p className="text-dark-400 mb-6">
              {step === 'lookup'
                ? 'Informe seu e-mail ou RA para recuperar o acesso'
                : 'Defina uma nova senha para sua conta'}
            </p>

            {step === 'lookup' ? (
              <form onSubmit={handleLookup} className="space-y-4">
                <Input
                  label="E-mail ou RA"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError('') }}
                  placeholder="seu@email.com ou número do RA"
                  icon={<Mail size={16} />}
                  fullWidth
                />
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400">
                    ⚠️ {error}
                  </motion.p>
                )}
                <Button type="submit" fullWidth size="lg" loading={loading} iconRight={<ArrowRight size={18} />}>
                  Continuar
                </Button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Nova senha"
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError('') }}
                  icon={<Lock size={16} />}
                  iconRight={
                    <button type="button" onClick={() => setShowPw(!showPw)} className="hover:text-dark-200 transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  placeholder="Mínimo 6 caracteres"
                  fullWidth
                />
                <Input
                  label="Confirmar nova senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                  icon={<Lock size={16} />}
                  placeholder="Repita a senha"
                  fullWidth
                />
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400">
                    ⚠️ {error}
                  </motion.p>
                )}
                <Button type="submit" fullWidth size="lg" iconRight={<ArrowRight size={18} />}>
                  Salvar nova senha
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-dark-400 hover:text-amber-400 transition-colors">
                <ArrowLeft size={14} /> Voltar para o login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
