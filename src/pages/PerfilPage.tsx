import { useState } from 'react'
import { User, Mail, Lock, Camera, Bell, Moon, Globe, Shield, LogOut, Save, Eye, EyeOff, Phone, Calendar, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'

const ROLE_LABELS: Record<string, string> = {
  aluno: 'Aluno', professor: 'Professor', pai: 'Pai/Responsável',
  coordenador: 'Coordenador', diretor: 'Diretor',
}

const ROLE_COLORS: Record<string, 'amber' | 'info' | 'success' | 'warning' | 'outline'> = {
  aluno: 'outline', professor: 'amber', pai: 'outline',
  coordenador: 'info', diretor: 'warning',
}

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'pt-PT', label: 'Português (Portugal)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'it-IT', label: 'Italiano' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'zh-CN', label: '中文 (简体)' },
  { value: 'ar-SA', label: 'العربية' },
]

export default function PerfilPage() {
  const { currentUser, logout, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useNotifications()

  const [name, setName] = useState(currentUser?.name ?? '')
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [phone, setPhone] = useState(currentUser?.phone ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.date_of_birth ?? '')
  const [bio, setBio] = useState(currentUser?.bio ?? '')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [notificationsOn, setNotificationsOn] = useState(() => {
    return localStorage.getItem('elo_notifications_enabled') !== 'false'
  })
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('elo_language') ?? 'pt-BR'
  })

  function saveProfile() {
    if (!currentUser || !name.trim()) return
    setSaving(true)
    setTimeout(() => {
      updateUser({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, date_of_birth: dateOfBirth || undefined, bio: bio.trim() || undefined })
      addToast({ title: 'Perfil atualizado!', body: 'Suas informações foram salvas.', type: 'success' })
      setSaving(false)
    }, 500)
  }

  function changePassword() {
    if (!currentUser) return
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast({ title: 'Preencha todos os campos', body: '', type: 'error' }); return
    }
    if (newPassword !== confirmPassword) {
      addToast({ title: 'As senhas não coincidem', body: '', type: 'error' }); return
    }
    if (newPassword.length < 6) {
      addToast({ title: 'A senha deve ter ao menos 6 caracteres', body: '', type: 'error' }); return
    }
    const passwords = storage.get('passwords') ?? {}
    if (passwords[currentUser.id] !== currentPassword) {
      addToast({ title: 'Senha atual incorreta', body: '', type: 'error' }); return
    }
    storage.set('passwords', { ...passwords, [currentUser.id]: newPassword })
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    addToast({ title: 'Senha alterada!', body: 'Sua senha foi atualizada com sucesso.', type: 'success' })
  }

  function toggleNotifications() {
    const next = !notificationsOn
    setNotificationsOn(next)
    localStorage.setItem('elo_notifications_enabled', String(next))
    addToast({ title: next ? 'Notificações ativadas' : 'Notificações desativadas', body: '', type: 'success' })
  }

  function saveLanguage(val: string) {
    setLanguage(val)
    localStorage.setItem('elo_language', val)
    addToast({ title: 'Idioma atualizado', body: LANGUAGES.find((l) => l.value === val)?.label ?? '', type: 'success' })
  }

  if (!currentUser) return null

  const cls = currentUser.role === 'aluno'
    ? storage.getArray('classes').find((c) => c.id === currentUser.class_id)
    : null

  const subjects = currentUser.role === 'professor' && currentUser.subject_ids?.length
    ? storage.getArray('subjects').filter((s) => currentUser.subject_ids!.includes(s.id))
    : []

  const teacherClasses = currentUser.role === 'professor'
    ? storage.getArray('classes').filter((c) => c.teacher_ids.includes(currentUser.id))
    : []

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Meu Perfil" subtitle="Gerencie suas informações e preferências" icon={<User size={20} />} />

      {/* Profile hero */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <Avatar name={currentUser.name} size="xl" />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center hover:bg-amber-400 transition-colors">
              <Camera size={14} className="text-dark-900" />
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-dark-50">{currentUser.name}</h2>
            <p className="text-dark-400 mt-1">{currentUser.email}</p>
            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
              <Badge variant={ROLE_COLORS[currentUser.role]} size="md">{ROLE_LABELS[currentUser.role]}</Badge>
              {cls && <Badge variant="outline" size="md">{cls.name}</Badge>}
              {currentUser.enrollment_number && <Badge variant="outline" size="md">RA: {currentUser.enrollment_number}</Badge>}
              {currentUser.year && <Badge variant="outline" size="md">{currentUser.year}º ano</Badge>}
            </div>
            {subjects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 justify-center sm:justify-start">
                {subjects.map((s) => (
                  <span key={s.id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="informacoes">
        <TabsList>
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        </TabsList>

        {/* Profile info */}
        <TabsContent value="informacoes" className="mt-6">
          <Card>
            <h3 className="font-semibold text-dark-100 mb-6">Informações pessoais</h3>
            <div className="space-y-4">
              <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={16} />} fullWidth />
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} fullWidth />
              <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={16} />} placeholder="(00) 00000-0000" fullWidth />
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Data de nascimento</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full h-10 bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Biografia</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                />
              </div>

              {/* Read-only fields */}
              {currentUser.enrollment_number && (
                <Input label="RA (Registro do Aluno)" value={currentUser.enrollment_number} disabled fullWidth />
              )}
              {cls && (
                <Input label="Turma" value={`${cls.name} — ${currentUser.year}º ano`} disabled icon={<BookOpen size={16} />} fullWidth />
              )}
              {subjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Disciplinas que leciona</label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <span key={s.id} className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {teacherClasses.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Turmas</label>
                  <div className="flex flex-wrap gap-2">
                    {teacherClasses.map((c) => (
                      <Badge key={c.id} variant="amber" size="md">{c.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={saveProfile} icon={<Save size={16} />} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="seguranca" className="mt-6 space-y-6">
          <Card>
            <h3 className="font-semibold text-dark-100 mb-6">Alterar senha</h3>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="Senha atual"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  icon={<Lock size={16} />}
                  iconRight={
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-dark-400 hover:text-dark-200">
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  fullWidth
                />
              </div>
              <Input
                label="Nova senha"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock size={16} />}
                iconRight={
                  <button type="button" onClick={() => setShowNew(!showNew)} className="text-dark-400 hover:text-dark-200">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                fullWidth
              />
              <Input
                label="Confirmar nova senha"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={16} />}
                iconRight={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-dark-400 hover:text-dark-200">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                fullWidth
              />
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={changePassword} icon={<Shield size={16} />}>Alterar senha</Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-dark-100 mb-2">Sair da conta</h3>
            <p className="text-sm text-dark-400 mb-4">Encerrar a sessão atual.</p>
            <Button variant="danger" icon={<LogOut size={16} />} onClick={logout}>Sair da conta</Button>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferencias" className="mt-6">
          <Card>
            <h3 className="font-semibold text-dark-100 mb-6">Preferências</h3>
            <div className="space-y-4">

              {/* Dark mode toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-dark-700">
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-dark-400" />
                  <div>
                    <p className="text-sm font-medium text-dark-200">Tema escuro</p>
                    <p className="text-xs text-dark-500">Alternar entre tema claro e escuro</p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-amber-500' : 'bg-dark-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Notifications toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-dark-700">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-dark-400" />
                  <div>
                    <p className="text-sm font-medium text-dark-200">Notificações</p>
                    <p className="text-xs text-dark-500">Receber alertas de atividades</p>
                  </div>
                </div>
                <button
                  onClick={toggleNotifications}
                  className={`relative w-12 h-6 rounded-full transition-colors ${notificationsOn ? 'bg-amber-500' : 'bg-dark-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notificationsOn ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Language */}
              <div className="flex items-start justify-between p-4 rounded-xl border border-dark-700">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-dark-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-dark-200">Idioma</p>
                    <p className="text-xs text-dark-500">Selecione o idioma da interface</p>
                  </div>
                </div>
                <Select
                  value={language}
                  onChange={(e) => saveLanguage(e.target.value)}
                  options={LANGUAGES}
                  className="w-48"
                />
              </div>

            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
