import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const DEMO_ACCOUNTS = [
  { email: 'aluno@elo.com', label: 'Aluno', color: 'text-electric-400' },
  { email: 'pai@elo.com', label: 'Responsável', color: 'text-purple-400' },
  { email: 'professor@elo.com', label: 'Professor', color: 'text-green-400' },
  { email: 'coordenador@elo.com', label: 'Coordenador', color: 'text-amber-400' },
  { email: 'diretor@elo.com', label: 'Diretor', color: 'text-red-400' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error ?? 'Erro ao fazer login')
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail)
    setPassword('123456')
    setError('')
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-gradient-to-br from-dark-800 via-dark-900 to-dark-950 border-r border-dark-700 p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Zap size={22} className="text-dark-900" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">Elo</span>
              <span className="block text-xs text-dark-400">Gestão Escolar</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              A plataforma escolar<br />
              <span className="text-amber-400">mais moderna</span> do Brasil
            </h2>
            <p className="text-dark-400 text-base leading-relaxed">
              Conectamos alunos, professores, pais e gestores em um único ecossistema inteligente.
            </p>
          </motion.div>

          <div className="mt-12 space-y-4">
            {[
              { icon: '🎯', title: 'Gamificação real', desc: 'XP, ligas, conquistas e rankings motivam o aprendizado' },
              { icon: '📊', title: 'Analytics preditivos', desc: 'Identifique alunos em risco antes que seja tarde' },
              { icon: '💬', title: 'Comunicação unificada', desc: 'Chat, feed e notificações em tempo real' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-dark-800/50 border border-dark-700"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-dark-100">{item.title}</p>
                  <p className="text-xs text-dark-400 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs text-dark-600">© 2025 Elo Gestão Escolar. Todos os direitos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <Zap size={18} className="text-dark-900" />
            </div>
            <span className="text-xl font-bold text-white">Elo</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-dark-50">Bem-vindo de volta</h1>
            <p className="text-dark-400 mt-1">Faça login para acessar sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="E-mail ou RA"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com ou número do RA"
              icon={<Mail size={16} />}
              required
              fullWidth
            />
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={16} />}
              iconRight={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-dark-200 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
              fullWidth
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400 flex items-center gap-1"
              >
                ⚠️ {error}
              </motion.p>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              iconRight={<ArrowRight size={18} />}
            >
              Entrar
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/recuperar-senha" className="text-sm text-dark-400 hover:text-amber-400 transition-colors">
              Esqueceu sua senha?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-xs text-dark-500 mb-3 text-center">Contas demo (senha: 123456)</p>
            <div className="grid grid-cols-5 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-dark-800 border border-dark-700 hover:border-dark-500 transition-all"
                >
                  <span className={`text-xs font-medium ${acc.color}`}>{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-dark-400">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-amber-400 hover:text-amber-300 font-medium">
              Cadastre-se
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
