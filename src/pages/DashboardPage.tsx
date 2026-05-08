import { useAuth } from '@/contexts/AuthContext'
import StudentDashboard from './dashboard/StudentDashboard'
import TeacherDashboard from './dashboard/TeacherDashboard'
import ParentDashboard from './dashboard/ParentDashboard'
import AdminDashboard from './dashboard/AdminDashboard'

export default function DashboardPage() {
  const { currentUser } = useAuth()
  if (!currentUser) return null

  switch (currentUser.role) {
    case 'aluno': return <StudentDashboard />
    case 'pai': return <ParentDashboard />
    case 'professor': return <TeacherDashboard />
    case 'coordenador':
    case 'diretor': return <AdminDashboard />
    default: return null
  }
}
