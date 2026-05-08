import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Spinner } from '@/components/ui/Spinner'
import { initFromSupabase } from '@/lib/storage'

// Auth pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import AccessDeniedPage from '@/pages/AccessDeniedPage'

// Main pages
import DashboardPage from '@/pages/DashboardPage'
import NotasPage from '@/pages/NotasPage'
import FrequenciaPage from '@/pages/FrequenciaPage'
import TarefasPage from '@/pages/TarefasPage'
import ChatPage from '@/pages/ChatPage'
import FeedPage from '@/pages/FeedPage'
import AgendaPage from '@/pages/AgendaPage'
import GamificacaoPage from '@/pages/GamificacaoPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import MateriaisPage from '@/pages/MateriaisPage'
import VideoaulasPage from '@/pages/VideoaulasPage'
import SimuladosPage from '@/pages/SimuladosPage'
import SalaDeAulaPage from '@/pages/SalaDeAulaPage'
import GestaoPage from '@/pages/GestaoPage'
import HorariosPage from '@/pages/HorariosPage'
import NotificacoesPage from '@/pages/NotificacoesPage'
import PerfilPage from '@/pages/PerfilPage'

import type { Permission } from '@/types'
import { hasPermission } from '@/lib/constants'

function ProtectedRoute({ permission }: { permission?: Permission }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (permission && !hasPermission(currentUser.role, permission)) {
    return <Navigate to="/acesso-negado" replace />
  }

  return <Outlet />
}

function AuthRoute() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public / auth routes */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>

      {/* Password recovery - no auth required */}
      <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />

      {/* Access denied - no auth required */}
      <Route path="/acesso-negado" element={<AccessDeniedPage />} />

      {/* Protected routes wrapped in MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/notas" element={<NotasPage />} />
          <Route path="/frequencia" element={<FrequenciaPage />} />
          <Route path="/tarefas" element={<TarefasPage />} />
          <Route path="/sala-de-aula" element={<SalaDeAulaPage />} />
          <Route path="/materiais" element={<MateriaisPage />} />
          <Route path="/videoaulas" element={<VideoaulasPage />} />
          <Route path="/simulados" element={<SimuladosPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/gamificacao" element={<GamificacaoPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/horarios" element={<HorariosPage />} />
          <Route path="/notificacoes" element={<NotificacoesPage />} />
          <Route path="/perfil" element={<PerfilPage />} />

          {/* Restricted routes */}
          <Route element={<ProtectedRoute permission="access_management" />}>
            <Route path="/gestao" element={<GestaoPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Pre-load Supabase data into localStorage cache before first render.
    // If Supabase is not configured this resolves instantly (no-op).
    initFromSupabase().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
