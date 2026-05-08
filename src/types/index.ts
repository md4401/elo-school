// ============================================================
// CORE ENUMS
// ============================================================

export type UserRole = 'aluno' | 'pai' | 'professor' | 'coordenador' | 'diretor'

export type Permission =
  | 'view_own_data'
  | 'view_class_data'
  | 'view_all_classes'
  | 'view_analytics'
  | 'view_global_analytics'
  | 'edit_grades'
  | 'edit_attendance'
  | 'create_tasks'
  | 'create_materials'
  | 'create_videos'
  | 'create_quizzes'
  | 'create_events'
  | 'manage_students'
  | 'manage_teachers'
  | 'manage_classes'
  | 'manage_subjects'
  | 'manage_users'
  | 'delete_students'
  | 'delete_users'
  | 'send_notifications'
  | 'send_global_notifications'
  | 'access_chat'
  | 'access_management'
  | 'access_gamification'
  | 'download_reports'
  | 'reset_passwords'
  | 'configure_system'
  | 'view_risk_students'
  | 'approve_materials'

export type GradeStatus = 'aprovado' | 'recuperacao' | 'reprovado'
export type AssessmentType = 'prova' | 'atividade' | 'trabalho' | 'simulado' | 'participacao'
export type TaskStatus = 'pendente' | 'entregue' | 'atrasado' | 'corrigido'
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'
export type NotificationType = 'grade' | 'attendance' | 'task' | 'event' | 'message' | 'system' | 'achievement' | 'general'
export type EventCategory = 'prova' | 'trabalho' | 'evento' | 'feriado' | 'reuniao' | 'atividade' | 'pessoal'
export type MaterialType = 'pdf' | 'doc' | 'image' | 'link' | 'presentation' | 'spreadsheet' | 'other'
export type QuizType = 'multipla_escolha' | 'verdadeiro_falso' | 'dissertativa' | 'enem' | 'desafio'
export type RiskLevel = 'verde' | 'amarelo' | 'vermelho'
export type League = 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante'
export type MessageType = 'text' | 'image' | 'file' | 'audio'

// ============================================================
// USER & AUTH
// ============================================================

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone?: string
  created_at: string
  updated_at: string
  is_active: boolean
  // Student-specific
  enrollment_number?: string
  class_id?: string
  year?: number
  // Teacher/Coordinator
  subject_ids?: string[]
  class_ids?: string[]
  // Parent
  child_ra?: string
  child_id?: string
  // Profile extras
  bio?: string
  date_of_birth?: string
}

export interface AuthSession {
  user: User
  token: string
  expires_at: string
}

// ============================================================
// SCHOOL STRUCTURE
// ============================================================

export interface School {
  id: string
  name: string
  cnpj?: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  director_id?: string
  created_at: string
}

export interface SchoolClass {
  id: string
  name: string
  year: number
  grade_level: string
  school_id: string
  coordinator_id?: string
  teacher_ids: string[]
  student_ids: string[]
  subject_ids: string[]
  shift: 'manha' | 'tarde' | 'noite' | 'integral'
  academic_year: number
  max_students: number
  room?: string
  created_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  description?: string
  color: string
  icon?: string
  workload_hours: number
  school_id: string
}

export interface ClassSubject {
  id: string
  class_id: string
  subject_id: string
  teacher_id: string
  academic_year: number
  trimester: 1 | 2 | 3
}

// ============================================================
// GRADES
// ============================================================

export interface Assessment {
  id: string
  title: string
  type: AssessmentType
  subject_id: string
  class_id: string
  teacher_id: string
  trimester: 1 | 2 | 3
  weight: number
  max_score: number
  date: string
  description?: string
  created_at: string
}

export interface AssessmentGrade {
  id: string
  assessment_id: string
  student_id: string
  score: number | null
  observation?: string
  created_at: string
  updated_at: string
}

export interface StudentGradeSummary {
  student_id: string
  subject_id: string
  class_id: string
  trimester: 1 | 2 | 3
  weighted_average: number
  status: GradeStatus
  attendance_pct: number
}

// ============================================================
// ATTENDANCE
// ============================================================

export interface AttendanceRecord {
  id: string
  student_id: string
  class_id: string
  subject_id: string
  teacher_id: string
  date: string
  present: boolean
  justified: boolean
  observation?: string
  created_at: string
}

export interface AttendanceSummary {
  student_id: string
  subject_id: string
  class_id: string
  total_classes: number
  present: number
  absent: number
  justified: number
  percentage: number
}

// ============================================================
// TASKS & CLASSROOM
// ============================================================

export interface Task {
  id: string
  title: string
  description: string
  subject_id: string
  class_id: string
  teacher_id: string
  type: 'atividade' | 'trabalho' | 'formulario' | 'recurso' | 'aviso'
  due_date: string
  max_score?: number
  allow_late_submission: boolean
  attachments: Attachment[]
  created_at: string
  updated_at: string
  is_published: boolean
  questions?: TaskQuestion[]
}

export interface TaskQuestion {
  id: string
  task_id: string
  type: 'multipla_escolha' | 'dissertativa' | 'checkbox' | 'upload'
  text: string
  options?: string[]
  correct_option?: number
  points: number
  order: number
}

export interface TaskSubmission {
  id: string
  task_id: string
  student_id: string
  status: TaskStatus
  submitted_at?: string
  grade?: number
  feedback?: string
  answers?: { question_id: string; answer: string | string[] }[]
  attachments: Attachment[]
  corrected_at?: string
  corrected_by?: string
}

export interface ClassroomPost {
  id: string
  author_id: string
  class_id: string
  subject_id?: string
  type: 'aviso' | 'atividade' | 'recurso' | 'formulario'
  title: string
  content: string
  attachments: Attachment[]
  task_id?: string
  created_at: string
  updated_at: string
  pinned: boolean
  comments: PostComment[]
}

export interface PostComment {
  id: string
  author_id: string
  content: string
  created_at: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: MaterialType
  size?: number
}

// ============================================================
// CHAT & MESSAGING
// ============================================================

export interface Conversation {
  id: string
  type: 'direct' | 'group' | 'class' | 'subject'
  name?: string
  avatar?: string
  participant_ids: string[]
  class_id?: string
  subject_id?: string
  last_message?: Message
  last_message_at?: string
  unread_count: number
  created_at: string
  pinned?: boolean
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  type: MessageType
  content: string
  attachment?: Attachment
  read_by: string[]
  reactions: MessageReaction[]
  reply_to?: string
  created_at: string
  edited_at?: string
  is_pinned?: boolean
}

export interface MessageReaction {
  emoji: string
  user_ids: string[]
}

// ============================================================
// CALENDAR & EVENTS
// ============================================================

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  category: EventCategory
  color?: string
  start_date: string
  end_date?: string
  all_day: boolean
  class_id?: string
  class_ids?: string[]
  subject_id?: string
  created_by: string
  is_global: boolean
  is_personal?: boolean
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  reminder_minutes?: number
  created_at: string
}

// ============================================================
// SCHEDULES (Horários)
// ============================================================

export type WeekDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta'

export interface ScheduleSlot {
  id: string
  day: WeekDay
  time_start: string
  time_end: string
  subject_id: string
  teacher_id: string
}

export interface ClassSchedule {
  id: string
  class_id: string
  academic_year: number
  slots: ScheduleSlot[]
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================================
// MATERIALS & VIDEOS
// ============================================================

export interface Material {
  id: string
  title: string
  description?: string
  type: MaterialType
  url: string
  subject_id: string
  class_id: string
  teacher_id: string
  size?: number
  downloads: number
  tags: string[]
  created_at: string
  is_approved: boolean
  trimester: 1 | 2 | 3
}

export interface Video {
  id: string
  title: string
  description?: string
  url: string
  thumbnail?: string
  duration_seconds: number
  subject_id: string
  class_id: string
  teacher_id: string
  views: number
  tags: string[]
  created_at: string
  is_published: boolean
  trimester: 1 | 2 | 3
}

// ============================================================
// QUIZZES & SIMULADOS
// ============================================================

export interface Quiz {
  id: string
  title: string
  description?: string
  type: QuizType
  subject_id?: string
  class_id: string
  teacher_id: string
  time_limit_minutes?: number
  questions: QuizQuestion[]
  created_at: string
  due_date?: string
  is_published: boolean
  attempts_allowed: number
  show_answers_after: boolean
  trimester?: 1 | 2 | 3
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  type: 'multipla_escolha' | 'verdadeiro_falso' | 'dissertativa'
  text: string
  options?: string[]
  correct_option?: number
  correct_boolean?: boolean
  explanation?: string
  points: number
  order: number
  image_url?: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  student_id: string
  answers: { question_id: string; answer: string | boolean | number }[]
  score: number
  max_score: number
  percentage: number
  time_spent_seconds: number
  started_at: string
  finished_at: string
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  priority: NotificationPriority
  read: boolean
  action_url?: string
  metadata?: Record<string, string>
  created_at: string
}

// ============================================================
// GAMIFICATION
// ============================================================

export interface GamificationData {
  id: string
  student_id: string
  xp: number
  level: number
  league: League
  streak_days: number
  last_activity_date: string
  total_tasks_completed: number
  total_quizzes_completed: number
  total_logins: number
  total_study_minutes: number
  achievements: Achievement[]
  daily_missions: Mission[]
  weekly_missions: Mission[]
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  key: string
  title: string
  description: string
  icon: string
  xp_reward: number
  unlocked: boolean
  unlocked_at?: string
  category: 'notas' | 'frequencia' | 'tarefas' | 'engajamento' | 'social' | 'especial'
  rarity: 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario'
}

export interface Mission {
  id: string
  title: string
  description: string
  icon: string
  xp_reward: number
  target: number
  progress: number
  completed: boolean
  type: 'daily' | 'weekly'
  category: 'login' | 'task' | 'quiz' | 'grade' | 'study' | 'social'
  expires_at: string
}

export interface LeaderboardEntry {
  student_id: string
  student_name: string
  avatar?: string
  xp: number
  level: number
  league: League
  rank: number
  class_id: string
}

// ============================================================
// ANALYTICS
// ============================================================

export interface ClassAnalytics {
  class_id: string
  class_name: string
  total_students: number
  average_grade: number
  attendance_rate: number
  risk_students: { verde: number; amarelo: number; vermelho: number }
  grade_distribution: { range: string; count: number }[]
  subject_averages: { subject_id: string; subject_name: string; average: number }[]
  evolution: { month: string; average: number; attendance: number }[]
}

export interface StudentAnalytics {
  student_id: string
  overall_average: number
  attendance_rate: number
  risk_level: RiskLevel
  subject_grades: { subject_id: string; subject_name: string; average: number; trend: 'up' | 'down' | 'stable' }[]
  trimester_evolution: { trimester: number; average: number }[]
  tasks_completion_rate: number
  quiz_average: number
}

// ============================================================
// STORAGE SHAPE
// ============================================================

export interface StorageSchema {
  seeded: boolean
  seed_version: number
  users: User[]
  passwords: Record<string, string>
  school: School
  classes: SchoolClass[]
  subjects: Subject[]
  class_subjects: ClassSubject[]
  assessments: Assessment[]
  assessment_grades: AssessmentGrade[]
  attendance: AttendanceRecord[]
  tasks: Task[]
  task_submissions: TaskSubmission[]
  classroom_posts: ClassroomPost[]
  conversations: Conversation[]
  messages: Message[]
  events: CalendarEvent[]
  materials: Material[]
  videos: Video[]
  quizzes: Quiz[]
  quiz_attempts: QuizAttempt[]
  notifications: Notification[]
  gamification: GamificationData[]
  horarios: ClassSchedule[]
  api_settings: Record<string, string>
}
