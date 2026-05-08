import type {
  User, School, SchoolClass, Subject, ClassSubject,
  Assessment, AssessmentGrade, AttendanceRecord,
  Task, TaskSubmission, ClassroomPost,
  Conversation, Message,
  CalendarEvent, Material, Video, Quiz, QuizQuestion,
  Notification, GamificationData, ClassSchedule,
} from '@/types'
import { storage } from './storage'
import { createGamificationData } from './achievements'
import { generateId } from './utils'

// ============================================================
// HELPERS
// ============================================================

function d(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString()
}

function dFixed(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day).toISOString()
}

// ============================================================
// SCHOOL
// ============================================================

const SCHOOL: School = {
  id: 'school_1',
  name: 'Escola Estadual João Paulo II',
  cnpj: '12.345.678/0001-90',
  address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
  phone: '(11) 3456-7890',
  email: 'contato@joaopaulo2.edu.br',
  director_id: 'user_diretor',
  created_at: dFixed(2020, 1, 15),
}

// ============================================================
// SUBJECTS
// ============================================================

const SUBJECTS: Subject[] = [
  // Core
  { id: 'sub_port', name: 'Português', code: 'PORT', color: '#F87171', workload_hours: 120, school_id: 'school_1' },
  { id: 'sub_mat', name: 'Matemática', code: 'MAT', color: '#60A5FA', workload_hours: 120, school_id: 'school_1' },
  { id: 'sub_cien', name: 'Ciências', code: 'CIEN', color: '#34D399', workload_hours: 80, school_id: 'school_1' },
  { id: 'sub_hist', name: 'História', code: 'HIST', color: '#FBBF24', workload_hours: 60, school_id: 'school_1' },
  { id: 'sub_geo', name: 'Geografia', code: 'GEO', color: '#A78BFA', workload_hours: 60, school_id: 'school_1' },
  { id: 'sub_ef', name: 'Educação Física', code: 'EF', color: '#FB923C', workload_hours: 60, school_id: 'school_1' },
  { id: 'sub_ing', name: 'Inglês', code: 'ING', color: '#2DD4BF', workload_hours: 60, school_id: 'school_1' },
  { id: 'sub_arte', name: 'Arte', code: 'ART', color: '#E879F9', workload_hours: 40, school_id: 'school_1' },
  // Extended
  { id: 'sub_fis', name: 'Física', code: 'FIS', color: '#38BDF8', workload_hours: 80, school_id: 'school_1' },
  { id: 'sub_quim', name: 'Química', code: 'QUIM', color: '#4ADE80', workload_hours: 80, school_id: 'school_1' },
  { id: 'sub_bio', name: 'Biologia', code: 'BIO', color: '#86EFAC', workload_hours: 80, school_id: 'school_1' },
  { id: 'sub_filos', name: 'Filosofia', code: 'FILOS', color: '#C4B5FD', workload_hours: 40, school_id: 'school_1' },
  { id: 'sub_socio', name: 'Sociologia', code: 'SOC', color: '#FCA5A5', workload_hours: 40, school_id: 'school_1' },
  { id: 'sub_lit', name: 'Literatura', code: 'LIT', color: '#FCD34D', workload_hours: 60, school_id: 'school_1' },
  { id: 'sub_red', name: 'Redação', code: 'RED', color: '#F472B6', workload_hours: 60, school_id: 'school_1' },
  { id: 'sub_esp', name: 'Espanhol', code: 'ESP', color: '#FDE68A', workload_hours: 40, school_id: 'school_1' },
  { id: 'sub_info', name: 'Informática', code: 'INFO', color: '#67E8F9', workload_hours: 40, school_id: 'school_1' },
  { id: 'sub_mus', name: 'Música', code: 'MUS', color: '#D8B4FE', workload_hours: 40, school_id: 'school_1' },
  { id: 'sub_artes2', name: 'Artes Visuais', code: 'ARTV', color: '#FBB6CE', workload_hours: 40, school_id: 'school_1' },
  { id: 'sub_rel', name: 'Ensino Religioso', code: 'REL', color: '#BBF7D0', workload_hours: 40, school_id: 'school_1' },
]

// ============================================================
// USERS
// ============================================================

const USERS: User[] = [
  // DIRETOR
  {
    id: 'user_diretor',
    name: 'Carlos Eduardo Lima',
    email: 'diretor@elo.com',
    role: 'diretor',
    avatar: undefined,
    phone: '(11) 99999-0001',
    created_at: dFixed(2020, 1, 15),
    updated_at: dFixed(2020, 1, 15),
    is_active: true,
    bio: 'Diretor com 20 anos de experiência em gestão escolar.',
  },
  // COORDENADOR
  {
    id: 'user_coord',
    name: 'Ana Paula Ferreira',
    email: 'coordenador@elo.com',
    role: 'coordenador',
    avatar: undefined,
    phone: '(11) 99999-0002',
    created_at: dFixed(2020, 1, 15),
    updated_at: dFixed(2020, 1, 15),
    is_active: true,
    class_ids: ['class_9a', 'class_8a', 'class_7a'],
    bio: 'Coordenadora pedagógica apaixonada por educação.',
  },
  // PROFESSORES
  {
    id: 'user_prof1',
    name: 'Roberto Alves',
    email: 'professor@elo.com',
    role: 'professor',
    avatar: undefined,
    phone: '(11) 99999-0003',
    created_at: dFixed(2020, 3, 10),
    updated_at: dFixed(2020, 3, 10),
    is_active: true,
    subject_ids: ['sub_mat'],
    class_ids: ['class_9a', 'class_8a', 'class_7a'],
    bio: 'Professor de Matemática há 15 anos.',
  },
  {
    id: 'user_prof2',
    name: 'Juliana Carvalho',
    email: 'juliana@elo.com',
    role: 'professor',
    avatar: undefined,
    phone: '(11) 99999-0004',
    created_at: dFixed(2020, 3, 10),
    updated_at: dFixed(2020, 3, 10),
    is_active: true,
    subject_ids: ['sub_port'],
    class_ids: ['class_9a', 'class_8a'],
    bio: 'Professora de Português e Literatura.',
  },
  {
    id: 'user_prof3',
    name: 'Fernando Gomes',
    email: 'fernando@elo.com',
    role: 'professor',
    avatar: undefined,
    phone: '(11) 99999-0005',
    created_at: dFixed(2020, 3, 10),
    updated_at: dFixed(2020, 3, 10),
    is_active: true,
    subject_ids: ['sub_hist', 'sub_geo'],
    class_ids: ['class_9a', 'class_8a', 'class_7a'],
    bio: 'Professor de História e Geografia.',
  },
  {
    id: 'user_prof4',
    name: 'Camila Santos',
    email: 'camila@elo.com',
    role: 'professor',
    avatar: undefined,
    phone: '(11) 99999-0006',
    created_at: dFixed(2020, 3, 10),
    updated_at: dFixed(2020, 3, 10),
    is_active: true,
    subject_ids: ['sub_cien', 'sub_bio'],
    class_ids: ['class_9a', 'class_7a'],
    bio: 'Professora de Ciências e Biologia formada pela USP.',
  },
  {
    id: 'user_prof5',
    name: 'Pedro Henrique Costa',
    email: 'pedro.prof@elo.com',
    role: 'professor',
    avatar: undefined,
    phone: '(11) 99999-0007',
    created_at: dFixed(2020, 3, 10),
    updated_at: dFixed(2020, 3, 10),
    is_active: true,
    subject_ids: ['sub_fis', 'sub_quim'],
    class_ids: ['class_9a', 'class_8a'],
    bio: 'Professor de Física e Química.',
  },
  {
    id: 'user_prof6',
    name: 'Larissa Oliveira',
    email: 'larissa@elo.com',
    role: 'professor',
    avatar: undefined,
    phone: '(11) 99999-0008',
    created_at: dFixed(2020, 3, 10),
    updated_at: dFixed(2020, 3, 10),
    is_active: true,
    subject_ids: ['sub_ing', 'sub_esp'],
    class_ids: ['class_9a', 'class_8a', 'class_7a'],
    bio: 'Professora de Línguas — Inglês e Espanhol.',
  },
  {
    id: 'user_prof7',
    name: 'Marcos Vinícius Rocha',
    email: 'marcos.prof@elo.com',
    role: 'professor',
    avatar: undefined,
    phone: '(11) 99999-0009',
    created_at: dFixed(2020, 3, 10),
    updated_at: dFixed(2020, 3, 10),
    is_active: true,
    subject_ids: ['sub_info', 'sub_mus'],
    class_ids: ['class_9a', 'class_8a'],
    bio: 'Professor de Informática e Música.',
  },
  // ALUNOS - Turma 9A
  {
    id: 'user_aluno1',
    name: 'Lucas Mendes',
    email: 'aluno@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1001',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024001',
    class_id: 'class_9a',
    year: 9,
  },
  {
    id: 'user_aluno2',
    name: 'Isabela Costa',
    email: 'isabela@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1002',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024002',
    class_id: 'class_9a',
    year: 9,
  },
  {
    id: 'user_aluno3',
    name: 'Pedro Oliveira',
    email: 'pedro@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1003',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024003',
    class_id: 'class_9a',
    year: 9,
  },
  {
    id: 'user_aluno4',
    name: 'Mariana Silva',
    email: 'mariana@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1004',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024004',
    class_id: 'class_9a',
    year: 9,
  },
  {
    id: 'user_aluno5',
    name: 'Gabriel Rodrigues',
    email: 'gabriel@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1005',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024005',
    class_id: 'class_9a',
    year: 9,
  },
  {
    id: 'user_aluno6',
    name: 'Giovanna Ferreira',
    email: 'giovanna@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1006',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024006',
    class_id: 'class_9a',
    year: 9,
  },
  {
    id: 'user_aluno7',
    name: 'Rafael Lima',
    email: 'rafael@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1007',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024007',
    class_id: 'class_9a',
    year: 9,
  },
  {
    id: 'user_aluno8',
    name: 'Sofia Nascimento',
    email: 'sofia@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1008',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024008',
    class_id: 'class_9a',
    year: 9,
  },
  // Alunos - Turma 8A
  {
    id: 'user_aluno9',
    name: 'Beatriz Almeida',
    email: 'beatriz@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1009',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024009',
    class_id: 'class_8a',
    year: 8,
  },
  {
    id: 'user_aluno10',
    name: 'Thiago Martins',
    email: 'thiago@elo.com',
    role: 'aluno',
    avatar: undefined,
    phone: '(11) 99999-1010',
    created_at: dFixed(2024, 2, 1),
    updated_at: dFixed(2024, 2, 1),
    is_active: true,
    enrollment_number: '2024010',
    class_id: 'class_8a',
    year: 8,
  },
  // RESPONSÁVEIS
  {
    id: 'user_pai1',
    name: 'Marcos Mendes',
    email: 'pai@elo.com',
    role: 'pai',
    avatar: undefined,
    phone: '(11) 99999-2001',
    created_at: dFixed(2024, 2, 5),
    updated_at: dFixed(2024, 2, 5),
    is_active: true,
    child_ra: '2024001',
    child_id: 'user_aluno1',
  },
  {
    id: 'user_pai2',
    name: 'Fernanda Costa',
    email: 'fernanda_pai@elo.com',
    role: 'pai',
    avatar: undefined,
    phone: '(11) 99999-2002',
    created_at: dFixed(2024, 2, 5),
    updated_at: dFixed(2024, 2, 5),
    is_active: true,
    child_ra: '2024002',
    child_id: 'user_aluno2',
  },
]

// ============================================================
// CLASSES
// ============================================================

const CLASSES: SchoolClass[] = [
  {
    id: 'class_9a',
    name: '9º Ano A',
    year: 9,
    grade_level: '9A',
    school_id: 'school_1',
    coordinator_id: 'user_coord',
    teacher_ids: ['user_prof1', 'user_prof2', 'user_prof3', 'user_prof4', 'user_prof5', 'user_prof6', 'user_prof7'],
    student_ids: ['user_aluno1', 'user_aluno2', 'user_aluno3', 'user_aluno4', 'user_aluno5', 'user_aluno6', 'user_aluno7', 'user_aluno8'],
    subject_ids: ['sub_port', 'sub_mat', 'sub_cien', 'sub_hist', 'sub_geo', 'sub_ef', 'sub_ing', 'sub_arte', 'sub_fis', 'sub_quim', 'sub_bio', 'sub_filos', 'sub_socio', 'sub_lit', 'sub_red', 'sub_esp', 'sub_info', 'sub_mus', 'sub_artes2', 'sub_rel'],
    shift: 'manha',
    academic_year: 2025,
    max_students: 35,
    room: 'Sala 201',
    created_at: dFixed(2025, 1, 15),
  },
  {
    id: 'class_8a',
    name: '8º Ano A',
    year: 8,
    grade_level: '8A',
    school_id: 'school_1',
    coordinator_id: 'user_coord',
    teacher_ids: ['user_prof1', 'user_prof2', 'user_prof3', 'user_prof5', 'user_prof6', 'user_prof7'],
    student_ids: ['user_aluno9', 'user_aluno10'],
    subject_ids: ['sub_port', 'sub_mat', 'sub_hist', 'sub_geo', 'sub_ef', 'sub_ing', 'sub_fis', 'sub_quim', 'sub_esp', 'sub_info'],
    shift: 'manha',
    academic_year: 2025,
    max_students: 35,
    room: 'Sala 202',
    created_at: dFixed(2025, 1, 15),
  },
  {
    id: 'class_7a',
    name: '7º Ano A',
    year: 7,
    grade_level: '7A',
    school_id: 'school_1',
    coordinator_id: 'user_coord',
    teacher_ids: ['user_prof1', 'user_prof3', 'user_prof4', 'user_prof6'],
    student_ids: [],
    subject_ids: ['sub_port', 'sub_mat', 'sub_cien', 'sub_hist', 'sub_geo', 'sub_ing', 'sub_bio'],
    shift: 'tarde',
    academic_year: 2025,
    max_students: 35,
    room: 'Sala 103',
    created_at: dFixed(2025, 1, 15),
  },
]

// ============================================================
// CLASS SUBJECTS
// ============================================================

const CLASS_SUBJECTS: ClassSubject[] = [
  // 9A
  { id: 'cs_1', class_id: 'class_9a', subject_id: 'sub_port', teacher_id: 'user_prof2', academic_year: 2025, trimester: 1 },
  { id: 'cs_2', class_id: 'class_9a', subject_id: 'sub_mat', teacher_id: 'user_prof1', academic_year: 2025, trimester: 1 },
  { id: 'cs_3', class_id: 'class_9a', subject_id: 'sub_cien', teacher_id: 'user_prof4', academic_year: 2025, trimester: 1 },
  { id: 'cs_4', class_id: 'class_9a', subject_id: 'sub_hist', teacher_id: 'user_prof3', academic_year: 2025, trimester: 1 },
  { id: 'cs_5', class_id: 'class_9a', subject_id: 'sub_geo', teacher_id: 'user_prof3', academic_year: 2025, trimester: 1 },
  { id: 'cs_8', class_id: 'class_9a', subject_id: 'sub_fis', teacher_id: 'user_prof5', academic_year: 2025, trimester: 1 },
  { id: 'cs_9', class_id: 'class_9a', subject_id: 'sub_quim', teacher_id: 'user_prof5', academic_year: 2025, trimester: 1 },
  { id: 'cs_10', class_id: 'class_9a', subject_id: 'sub_bio', teacher_id: 'user_prof4', academic_year: 2025, trimester: 1 },
  { id: 'cs_11', class_id: 'class_9a', subject_id: 'sub_ing', teacher_id: 'user_prof6', academic_year: 2025, trimester: 1 },
  { id: 'cs_12', class_id: 'class_9a', subject_id: 'sub_esp', teacher_id: 'user_prof6', academic_year: 2025, trimester: 1 },
  { id: 'cs_13', class_id: 'class_9a', subject_id: 'sub_info', teacher_id: 'user_prof7', academic_year: 2025, trimester: 1 },
  { id: 'cs_14', class_id: 'class_9a', subject_id: 'sub_mus', teacher_id: 'user_prof7', academic_year: 2025, trimester: 1 },
  { id: 'cs_15', class_id: 'class_9a', subject_id: 'sub_lit', teacher_id: 'user_prof2', academic_year: 2025, trimester: 1 },
  { id: 'cs_16', class_id: 'class_9a', subject_id: 'sub_red', teacher_id: 'user_prof2', academic_year: 2025, trimester: 1 },
  { id: 'cs_17', class_id: 'class_9a', subject_id: 'sub_filos', teacher_id: 'user_prof3', academic_year: 2025, trimester: 1 },
  { id: 'cs_18', class_id: 'class_9a', subject_id: 'sub_socio', teacher_id: 'user_prof3', academic_year: 2025, trimester: 1 },
  // 8A
  { id: 'cs_6', class_id: 'class_8a', subject_id: 'sub_port', teacher_id: 'user_prof2', academic_year: 2025, trimester: 1 },
  { id: 'cs_7', class_id: 'class_8a', subject_id: 'sub_mat', teacher_id: 'user_prof1', academic_year: 2025, trimester: 1 },
  { id: 'cs_19', class_id: 'class_8a', subject_id: 'sub_hist', teacher_id: 'user_prof3', academic_year: 2025, trimester: 1 },
  { id: 'cs_20', class_id: 'class_8a', subject_id: 'sub_fis', teacher_id: 'user_prof5', academic_year: 2025, trimester: 1 },
  { id: 'cs_21', class_id: 'class_8a', subject_id: 'sub_ing', teacher_id: 'user_prof6', academic_year: 2025, trimester: 1 },
  // 7A
  { id: 'cs_22', class_id: 'class_7a', subject_id: 'sub_port', teacher_id: 'user_prof2', academic_year: 2025, trimester: 1 },
  { id: 'cs_23', class_id: 'class_7a', subject_id: 'sub_mat', teacher_id: 'user_prof1', academic_year: 2025, trimester: 1 },
  { id: 'cs_24', class_id: 'class_7a', subject_id: 'sub_cien', teacher_id: 'user_prof4', academic_year: 2025, trimester: 1 },
  { id: 'cs_25', class_id: 'class_7a', subject_id: 'sub_hist', teacher_id: 'user_prof3', academic_year: 2025, trimester: 1 },
  { id: 'cs_26', class_id: 'class_7a', subject_id: 'sub_ing', teacher_id: 'user_prof6', academic_year: 2025, trimester: 1 },
]

// ============================================================
// ASSESSMENTS
// ============================================================

const ASSESSMENTS: Assessment[] = [
  // Turma 9A - Português
  { id: 'ass_port_1_t1', title: 'Prova 1 - Interpretação', type: 'prova', subject_id: 'sub_port', class_id: 'class_9a', teacher_id: 'user_prof2', trimester: 1, weight: 40, max_score: 10, date: dFixed(2025, 3, 15), created_at: dFixed(2025, 2, 20) },
  { id: 'ass_port_2_t1', title: 'Trabalho - Redação', type: 'trabalho', subject_id: 'sub_port', class_id: 'class_9a', teacher_id: 'user_prof2', trimester: 1, weight: 30, max_score: 10, date: dFixed(2025, 4, 10), created_at: dFixed(2025, 3, 1) },
  { id: 'ass_port_3_t1', title: 'Atividade - Gramática', type: 'atividade', subject_id: 'sub_port', class_id: 'class_9a', teacher_id: 'user_prof2', trimester: 1, weight: 30, max_score: 10, date: dFixed(2025, 4, 25), created_at: dFixed(2025, 4, 1) },

  // Turma 9A - Matemática
  { id: 'ass_mat_1_t1', title: 'Prova 1 - Equações', type: 'prova', subject_id: 'sub_mat', class_id: 'class_9a', teacher_id: 'user_prof1', trimester: 1, weight: 50, max_score: 10, date: dFixed(2025, 3, 20), created_at: dFixed(2025, 2, 20) },
  { id: 'ass_mat_2_t1', title: 'Atividade - Funções', type: 'atividade', subject_id: 'sub_mat', class_id: 'class_9a', teacher_id: 'user_prof1', trimester: 1, weight: 25, max_score: 10, date: dFixed(2025, 4, 5), created_at: dFixed(2025, 3, 15) },
  { id: 'ass_mat_3_t1', title: 'Simulado ENEM - Mat', type: 'simulado', subject_id: 'sub_mat', class_id: 'class_9a', teacher_id: 'user_prof1', trimester: 1, weight: 25, max_score: 10, date: dFixed(2025, 4, 20), created_at: dFixed(2025, 4, 1) },

  // Turma 9A - Ciências
  { id: 'ass_cien_1_t1', title: 'Prova 1 - Célula', type: 'prova', subject_id: 'sub_cien', class_id: 'class_9a', teacher_id: 'user_prof4', trimester: 1, weight: 45, max_score: 10, date: dFixed(2025, 3, 18), created_at: dFixed(2025, 2, 25) },
  { id: 'ass_cien_2_t1', title: 'Trabalho - Ecossistemas', type: 'trabalho', subject_id: 'sub_cien', class_id: 'class_9a', teacher_id: 'user_prof4', trimester: 1, weight: 35, max_score: 10, date: dFixed(2025, 4, 15), created_at: dFixed(2025, 3, 10) },
  { id: 'ass_cien_3_t1', title: 'Atividade Prática', type: 'atividade', subject_id: 'sub_cien', class_id: 'class_9a', teacher_id: 'user_prof4', trimester: 1, weight: 20, max_score: 10, date: dFixed(2025, 4, 28), created_at: dFixed(2025, 4, 5) },

  // Turma 9A - História
  { id: 'ass_hist_1_t1', title: 'Prova 1 - Idade Moderna', type: 'prova', subject_id: 'sub_hist', class_id: 'class_9a', teacher_id: 'user_prof3', trimester: 1, weight: 50, max_score: 10, date: dFixed(2025, 3, 22), created_at: dFixed(2025, 2, 28) },
  { id: 'ass_hist_2_t1', title: 'Seminário', type: 'trabalho', subject_id: 'sub_hist', class_id: 'class_9a', teacher_id: 'user_prof3', trimester: 1, weight: 50, max_score: 10, date: dFixed(2025, 4, 22), created_at: dFixed(2025, 3, 20) },

  // Turma 8A - Matemática
  { id: 'ass_mat_8a_1', title: 'Prova 1 - Álgebra', type: 'prova', subject_id: 'sub_mat', class_id: 'class_8a', teacher_id: 'user_prof1', trimester: 1, weight: 60, max_score: 10, date: dFixed(2025, 3, 18), created_at: dFixed(2025, 2, 18) },
  { id: 'ass_mat_8a_2', title: 'Atividade - Geometria', type: 'atividade', subject_id: 'sub_mat', class_id: 'class_8a', teacher_id: 'user_prof1', trimester: 1, weight: 40, max_score: 10, date: dFixed(2025, 4, 15), created_at: dFixed(2025, 3, 15) },
]

// ============================================================
// GRADES
// ============================================================

function grade(assessment_id: string, student_id: string, score: number): AssessmentGrade {
  return {
    id: `grade_${assessment_id}_${student_id}`,
    assessment_id,
    student_id,
    score,
    created_at: d(-10),
    updated_at: d(-5),
  }
}

const GRADES: AssessmentGrade[] = [
  // Lucas (aluno1) - 9A
  grade('ass_port_1_t1', 'user_aluno1', 8.5), grade('ass_port_2_t1', 'user_aluno1', 9.0), grade('ass_port_3_t1', 'user_aluno1', 7.5),
  grade('ass_mat_1_t1', 'user_aluno1', 7.0), grade('ass_mat_2_t1', 'user_aluno1', 8.0), grade('ass_mat_3_t1', 'user_aluno1', 7.5),
  grade('ass_cien_1_t1', 'user_aluno1', 9.0), grade('ass_cien_2_t1', 'user_aluno1', 8.5), grade('ass_cien_3_t1', 'user_aluno1', 9.5),
  grade('ass_hist_1_t1', 'user_aluno1', 6.5), grade('ass_hist_2_t1', 'user_aluno1', 7.0),

  // Isabela (aluno2) - 9A
  grade('ass_port_1_t1', 'user_aluno2', 9.5), grade('ass_port_2_t1', 'user_aluno2', 10.0), grade('ass_port_3_t1', 'user_aluno2', 9.0),
  grade('ass_mat_1_t1', 'user_aluno2', 9.0), grade('ass_mat_2_t1', 'user_aluno2', 9.5), grade('ass_mat_3_t1', 'user_aluno2', 8.5),
  grade('ass_cien_1_t1', 'user_aluno2', 10.0), grade('ass_cien_2_t1', 'user_aluno2', 9.5), grade('ass_cien_3_t1', 'user_aluno2', 10.0),
  grade('ass_hist_1_t1', 'user_aluno2', 9.0), grade('ass_hist_2_t1', 'user_aluno2', 9.5),

  // Pedro (aluno3) - 9A - em risco
  grade('ass_port_1_t1', 'user_aluno3', 4.5), grade('ass_port_2_t1', 'user_aluno3', 5.0), grade('ass_port_3_t1', 'user_aluno3', 4.0),
  grade('ass_mat_1_t1', 'user_aluno3', 3.5), grade('ass_mat_2_t1', 'user_aluno3', 4.0),
  grade('ass_cien_1_t1', 'user_aluno3', 5.5), grade('ass_cien_2_t1', 'user_aluno3', 4.5),
  grade('ass_hist_1_t1', 'user_aluno3', 5.0), grade('ass_hist_2_t1', 'user_aluno3', 4.5),

  // Mariana (aluno4) - 9A
  grade('ass_port_1_t1', 'user_aluno4', 7.5), grade('ass_port_2_t1', 'user_aluno4', 8.0), grade('ass_port_3_t1', 'user_aluno4', 7.0),
  grade('ass_mat_1_t1', 'user_aluno4', 6.5), grade('ass_mat_2_t1', 'user_aluno4', 7.0), grade('ass_mat_3_t1', 'user_aluno4', 6.0),
  grade('ass_cien_1_t1', 'user_aluno4', 8.0), grade('ass_cien_2_t1', 'user_aluno4', 7.5),
  grade('ass_hist_1_t1', 'user_aluno4', 7.0), grade('ass_hist_2_t1', 'user_aluno4', 8.0),

  // Gabriel (aluno5) - 9A
  grade('ass_port_1_t1', 'user_aluno5', 6.0), grade('ass_port_2_t1', 'user_aluno5', 6.5), grade('ass_port_3_t1', 'user_aluno5', 5.5),
  grade('ass_mat_1_t1', 'user_aluno5', 8.5), grade('ass_mat_2_t1', 'user_aluno5', 9.0), grade('ass_mat_3_t1', 'user_aluno5', 8.0),
  grade('ass_cien_1_t1', 'user_aluno5', 7.0), grade('ass_cien_2_t1', 'user_aluno5', 7.5),
  grade('ass_hist_1_t1', 'user_aluno5', 6.0), grade('ass_hist_2_t1', 'user_aluno5', 6.5),

  // Giovanna (aluno6) - 9A
  grade('ass_port_1_t1', 'user_aluno6', 8.0), grade('ass_port_2_t1', 'user_aluno6', 8.5), grade('ass_port_3_t1', 'user_aluno6', 9.0),
  grade('ass_mat_1_t1', 'user_aluno6', 7.5), grade('ass_mat_2_t1', 'user_aluno6', 8.0), grade('ass_mat_3_t1', 'user_aluno6', 7.0),
  grade('ass_cien_1_t1', 'user_aluno6', 8.5), grade('ass_cien_2_t1', 'user_aluno6', 9.0),

  // Rafael (aluno7) - 9A
  grade('ass_port_1_t1', 'user_aluno7', 5.5), grade('ass_port_2_t1', 'user_aluno7', 6.0),
  grade('ass_mat_1_t1', 'user_aluno7', 5.0), grade('ass_mat_2_t1', 'user_aluno7', 5.5),
  grade('ass_cien_1_t1', 'user_aluno7', 6.0), grade('ass_cien_2_t1', 'user_aluno7', 5.5),
  grade('ass_hist_1_t1', 'user_aluno7', 6.5), grade('ass_hist_2_t1', 'user_aluno7', 6.0),

  // Sofia (aluno8) - 9A
  grade('ass_port_1_t1', 'user_aluno8', 9.0), grade('ass_port_2_t1', 'user_aluno8', 9.5), grade('ass_port_3_t1', 'user_aluno8', 8.5),
  grade('ass_mat_1_t1', 'user_aluno8', 8.0), grade('ass_mat_2_t1', 'user_aluno8', 8.5), grade('ass_mat_3_t1', 'user_aluno8', 9.0),
  grade('ass_cien_1_t1', 'user_aluno8', 9.0), grade('ass_cien_2_t1', 'user_aluno8', 9.5),
  grade('ass_hist_1_t1', 'user_aluno8', 8.5), grade('ass_hist_2_t1', 'user_aluno8', 9.0),

  // Beatriz (aluno9) - 8A
  grade('ass_mat_8a_1', 'user_aluno9', 8.5), grade('ass_mat_8a_2', 'user_aluno9', 9.0),

  // Thiago (aluno10) - 8A
  grade('ass_mat_8a_1', 'user_aluno10', 6.0), grade('ass_mat_8a_2', 'user_aluno10', 5.5),
]

// ============================================================
// ATTENDANCE
// ============================================================

function att(student_id: string, subject_id: string, offsetDays: number, present: boolean): AttendanceRecord {
  return {
    id: generateId(),
    student_id,
    class_id: student_id.includes('aluno9') || student_id.includes('aluno10') ? 'class_8a' : 'class_9a',
    subject_id,
    teacher_id: subject_id === 'sub_mat' ? 'user_prof1' : subject_id === 'sub_port' ? 'user_prof2' : 'user_prof3',
    date: d(offsetDays),
    present,
    justified: !present && Math.random() < 0.3,
    created_at: d(offsetDays),
  }
}

const STUDENT_IDS_9A = ['user_aluno1', 'user_aluno2', 'user_aluno3', 'user_aluno4', 'user_aluno5', 'user_aluno6', 'user_aluno7', 'user_aluno8']
const ATTENDANCE_RECORDS: AttendanceRecord[] = []

STUDENT_IDS_9A.forEach((sid) => {
  ['sub_port', 'sub_mat', 'sub_cien', 'sub_hist'].forEach((subj) => {
    for (let i = -60; i <= -1; i += 2) {
      const present = sid === 'user_aluno3' ? Math.random() < 0.55 : sid === 'user_aluno7' ? Math.random() < 0.72 : Math.random() < 0.92
      ATTENDANCE_RECORDS.push(att(sid, subj, i, present))
    }
  })
})

// ============================================================
// TASKS
// ============================================================

const TASKS: Task[] = [
  {
    id: 'task_1',
    title: 'Lista de Exercícios — Funções do 2° Grau',
    description: 'Resolver os exercícios 1 ao 20 do capítulo 5. Mostre todo o desenvolvimento.',
    subject_id: 'sub_mat',
    class_id: 'class_9a',
    teacher_id: 'user_prof1',
    type: 'atividade',
    due_date: d(3),
    max_score: 10,
    allow_late_submission: false,
    attachments: [],
    created_at: d(-5),
    updated_at: d(-5),
    is_published: true,
  },
  {
    id: 'task_2',
    title: 'Redação — Tema: Sustentabilidade',
    description: 'Escreva uma redação argumentativa sobre a importância da sustentabilidade para as futuras gerações. Mínimo 30 linhas.',
    subject_id: 'sub_port',
    class_id: 'class_9a',
    teacher_id: 'user_prof2',
    type: 'trabalho',
    due_date: d(7),
    max_score: 10,
    allow_late_submission: true,
    attachments: [],
    created_at: d(-3),
    updated_at: d(-3),
    is_published: true,
  },
  {
    id: 'task_3',
    title: 'Trabalho em Grupo — Biomas Brasileiros',
    description: 'Forme grupos de 4 alunos e elabore uma apresentação sobre um bioma brasileiro. Cada grupo sorteia um bioma diferente.',
    subject_id: 'sub_cien',
    class_id: 'class_9a',
    teacher_id: 'user_prof4',
    type: 'trabalho',
    due_date: d(14),
    max_score: 10,
    allow_late_submission: false,
    attachments: [],
    created_at: d(-2),
    updated_at: d(-2),
    is_published: true,
  },
  {
    id: 'task_4',
    title: 'Questionário — Revolução Francesa',
    description: 'Responda as questões sobre a Revolução Francesa com base nas aulas e no capítulo 8 do livro didático.',
    subject_id: 'sub_hist',
    class_id: 'class_9a',
    teacher_id: 'user_prof3',
    type: 'atividade',
    due_date: d(-2),
    max_score: 10,
    allow_late_submission: false,
    attachments: [],
    created_at: d(-10),
    updated_at: d(-10),
    is_published: true,
  },
  {
    id: 'task_5',
    title: 'Exercícios de Geometria Analítica',
    description: 'Lista de exercícios sobre ponto, reta e circunferência no plano cartesiano.',
    subject_id: 'sub_mat',
    class_id: 'class_8a',
    teacher_id: 'user_prof1',
    type: 'atividade',
    due_date: d(5),
    max_score: 10,
    allow_late_submission: true,
    attachments: [],
    created_at: d(-4),
    updated_at: d(-4),
    is_published: true,
  },
]

const SUBMISSIONS: TaskSubmission[] = [
  { id: 'sub_t4_a1', task_id: 'task_4', student_id: 'user_aluno1', status: 'corrigido', submitted_at: d(-3), grade: 8.5, feedback: 'Ótimo trabalho! Respostas bem estruturadas.', attachments: [], corrected_at: d(-1), corrected_by: 'user_prof3' },
  { id: 'sub_t4_a2', task_id: 'task_4', student_id: 'user_aluno2', status: 'corrigido', submitted_at: d(-4), grade: 9.5, feedback: 'Excelente! Demonstra domínio do conteúdo.', attachments: [], corrected_at: d(-1), corrected_by: 'user_prof3' },
  { id: 'sub_t4_a3', task_id: 'task_4', student_id: 'user_aluno3', status: 'atrasado', attachments: [] },
  { id: 'sub_t4_a4', task_id: 'task_4', student_id: 'user_aluno4', status: 'entregue', submitted_at: d(-2), attachments: [] },
  { id: 'sub_t1_a1', task_id: 'task_1', student_id: 'user_aluno1', status: 'entregue', submitted_at: d(-1), attachments: [] },
  { id: 'sub_t1_a2', task_id: 'task_1', student_id: 'user_aluno2', status: 'entregue', submitted_at: d(-2), attachments: [] },
]

// ============================================================
// CLASSROOM POSTS
// ============================================================

const CLASSROOM_POSTS: ClassroomPost[] = [
  {
    id: 'post_1',
    author_id: 'user_prof1',
    class_id: 'class_9a',
    subject_id: 'sub_mat',
    type: 'aviso',
    title: 'Prova 2 de Matemática — Aviso Importante',
    content: 'Informo que a Prova 2 de Matemática será realizada na próxima semana. O conteúdo inclui funções do 2° grau, geometria analítica e progressões. Estudem bem!',
    attachments: [],
    created_at: d(-2),
    updated_at: d(-2),
    pinned: true,
    comments: [
      { id: 'cmt_1', author_id: 'user_aluno1', content: 'Professor, a prova vai incluir logaritmos também?', created_at: d(-1) },
      { id: 'cmt_2', author_id: 'user_prof1', content: 'Não, logaritmos ficam para o 3° trimestre!', created_at: d(-1) },
    ],
  },
  {
    id: 'post_2',
    author_id: 'user_prof2',
    class_id: 'class_9a',
    subject_id: 'sub_port',
    type: 'recurso',
    title: 'Material de Apoio — Estrutura da Redação',
    content: 'Disponibilizei no mural um guia completo sobre estrutura de redação argumentativa. Por favor, estudem antes da próxima aula.',
    attachments: [{ id: 'att_1', name: 'guia_redacao.pdf', url: '#', type: 'pdf', size: 1024000 }],
    created_at: d(-5),
    updated_at: d(-5),
    pinned: false,
    comments: [],
  },
  {
    id: 'post_3',
    author_id: 'user_coord',
    class_id: 'class_9a',
    type: 'aviso',
    title: 'Reunião de Pais e Mestres — Maio',
    content: 'Comunicamos que a reunião de pais e mestres será realizada no dia 20 de maio, às 19h, no auditório da escola. A presença dos responsáveis é muito importante!',
    attachments: [],
    created_at: d(-7),
    updated_at: d(-7),
    pinned: false,
    comments: [],
  },
]

// ============================================================
// CONVERSATIONS & MESSAGES
// ============================================================

const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_9a_geral',
    type: 'class',
    name: '9º Ano A — Geral',
    participant_ids: ['user_aluno1', 'user_aluno2', 'user_aluno3', 'user_aluno4', 'user_aluno5', 'user_prof1', 'user_prof2', 'user_coord'],
    class_id: 'class_9a',
    unread_count: 3,
    last_message_at: d(-0.1),
    created_at: dFixed(2025, 2, 1),
    pinned: true,
  },
  {
    id: 'conv_mat_9a',
    type: 'subject',
    name: 'Matemática — 9A',
    participant_ids: ['user_aluno1', 'user_aluno2', 'user_aluno3', 'user_aluno4', 'user_prof1'],
    class_id: 'class_9a',
    subject_id: 'sub_mat',
    unread_count: 1,
    last_message_at: d(-1),
    created_at: dFixed(2025, 2, 1),
  },
  {
    id: 'conv_dm_prof1_aluno1',
    type: 'direct',
    participant_ids: ['user_aluno1', 'user_prof1'],
    unread_count: 0,
    last_message_at: d(-2),
    created_at: d(-30),
  },
  {
    id: 'conv_dm_coord_prof1',
    type: 'direct',
    participant_ids: ['user_coord', 'user_prof1'],
    unread_count: 2,
    last_message_at: d(-0.5),
    created_at: d(-20),
  },
  {
    id: 'conv_dm_pai1_prof2',
    type: 'direct',
    participant_ids: ['user_pai1', 'user_prof2'],
    unread_count: 1,
    last_message_at: d(-1),
    created_at: d(-15),
  },
]

const MESSAGES: Message[] = [
  { id: 'msg_1', conversation_id: 'conv_9a_geral', sender_id: 'user_prof1', type: 'text', content: 'Bom dia, turma! Lembrem-se da prova de quarta-feira!', read_by: ['user_aluno1', 'user_aluno2'], reactions: [], created_at: d(-3) },
  { id: 'msg_2', conversation_id: 'conv_9a_geral', sender_id: 'user_aluno1', type: 'text', content: 'Professor, qual o conteúdo exato?', read_by: ['user_prof1', 'user_aluno2'], reactions: [{ emoji: '👍', user_ids: ['user_prof1'] }], created_at: d(-3) },
  { id: 'msg_3', conversation_id: 'conv_9a_geral', sender_id: 'user_prof1', type: 'text', content: 'Funções do 2° grau, geometria analítica e PA/PG!', read_by: ['user_aluno1'], reactions: [], created_at: d(-2) },
  { id: 'msg_4', conversation_id: 'conv_9a_geral', sender_id: 'user_aluno2', type: 'text', content: 'Obrigada professor! Vou estudar bastante 📚', read_by: ['user_prof1', 'user_aluno1'], reactions: [{ emoji: '❤️', user_ids: ['user_prof1'] }], created_at: d(-0.1) },

  { id: 'msg_5', conversation_id: 'conv_mat_9a', sender_id: 'user_aluno1', type: 'text', content: 'Professor, não entendi o exercício 15 da lista. Pode explicar?', read_by: ['user_prof1'], reactions: [], created_at: d(-1) },
  { id: 'msg_6', conversation_id: 'conv_mat_9a', sender_id: 'user_prof1', type: 'text', content: 'Claro! O exercício usa a fórmula de Bhaskara. Vou postar um vídeo explicando.', read_by: [], reactions: [], created_at: d(-1) },

  { id: 'msg_7', conversation_id: 'conv_dm_prof1_aluno1', sender_id: 'user_aluno1', type: 'text', content: 'Professor, posso remarcar a prova? Estou doente.', read_by: ['user_prof1'], reactions: [], created_at: d(-2) },
  { id: 'msg_8', conversation_id: 'conv_dm_prof1_aluno1', sender_id: 'user_prof1', type: 'text', content: 'Claro Lucas. Traga o atestado médico na próxima aula.', read_by: ['user_aluno1'], reactions: [], created_at: d(-2) },

  { id: 'msg_9', conversation_id: 'conv_dm_pai1_prof2', sender_id: 'user_pai1', type: 'text', content: 'Boa tarde professora. Como está o desempenho do Lucas em Português?', read_by: ['user_prof2'], reactions: [], created_at: d(-1) },
  { id: 'msg_10', conversation_id: 'conv_dm_pai1_prof2', sender_id: 'user_prof2', type: 'text', content: 'Boa tarde! O Lucas está indo bem. Nota 8.5 na última prova. Pode melhorar na redação.', read_by: [], reactions: [], created_at: d(-1) },
]

// Update last messages
CONVERSATIONS[0].last_message = MESSAGES[3]
CONVERSATIONS[1].last_message = MESSAGES[5]
CONVERSATIONS[2].last_message = MESSAGES[7]
CONVERSATIONS[4].last_message = MESSAGES[9]

// ============================================================
// CALENDAR EVENTS
// ============================================================

const EVENTS: CalendarEvent[] = [
  { id: 'evt_1', title: 'Prova de Matemática — 9A', category: 'prova', start_date: d(5), all_day: true, class_id: 'class_9a', subject_id: 'sub_mat', created_by: 'user_prof1', is_global: false, created_at: d(-5) },
  { id: 'evt_2', title: 'Entrega da Redação', category: 'trabalho', start_date: d(7), all_day: true, class_id: 'class_9a', subject_id: 'sub_port', created_by: 'user_prof2', is_global: false, created_at: d(-3) },
  { id: 'evt_3', title: 'Reunião de Pais e Mestres', category: 'reuniao', start_date: dFixed(2025, 5, 20), all_day: false, created_by: 'user_coord', is_global: true, created_at: d(-7), description: 'Auditório da escola, às 19h' },
  { id: 'evt_4', title: 'Feira de Ciências', category: 'evento', start_date: dFixed(2025, 6, 10), all_day: true, created_by: 'user_coord', is_global: true, created_at: d(-30) },
  { id: 'evt_5', title: 'Conselho de Classe', category: 'reuniao', start_date: dFixed(2025, 5, 28), all_day: false, created_by: 'user_diretor', is_global: true, created_at: d(-15) },
  { id: 'evt_6', title: 'Feriado — Corpus Christi', category: 'feriado', start_date: dFixed(2025, 6, 19), all_day: true, created_by: 'user_diretor', is_global: true, created_at: d(-30) },
  { id: 'evt_7', title: 'Simulado ENEM', category: 'prova', start_date: d(12), all_day: true, class_id: 'class_9a', created_by: 'user_coord', is_global: false, created_at: d(-10) },
  { id: 'evt_8', title: 'Semana de Provas — 1º Trimestre', category: 'prova', start_date: d(20), end_date: d(25), all_day: true, created_by: 'user_coord', is_global: true, created_at: d(-20) },
]

// ============================================================
// MATERIALS
// ============================================================

const MATERIALS: Material[] = [
  { id: 'mat_1', title: 'Resumo — Funções do 2° Grau', description: 'Resumo completo com exemplos e exercícios resolvidos', type: 'pdf', url: '#', subject_id: 'sub_mat', class_id: 'class_9a', teacher_id: 'user_prof1', size: 2048000, downloads: 24, tags: ['funções', 'álgebra', 'enem'], created_at: d(-15), is_approved: true, trimester: 1 },
  { id: 'mat_2', title: 'Guia de Redação Argumentativa', description: 'Estrutura, dicas e exemplos de redação nota 1000', type: 'pdf', url: '#', subject_id: 'sub_port', class_id: 'class_9a', teacher_id: 'user_prof2', size: 1536000, downloads: 31, tags: ['redação', 'argumentação', 'enem'], created_at: d(-10), is_approved: true, trimester: 1 },
  { id: 'mat_3', title: 'Mapas — Biomas Brasileiros', description: 'Mapas e infográficos dos principais biomas do Brasil', type: 'image', url: '#', subject_id: 'sub_cien', class_id: 'class_9a', teacher_id: 'user_prof4', size: 3072000, downloads: 18, tags: ['biomas', 'ecologia'], created_at: d(-8), is_approved: true, trimester: 1 },
  { id: 'mat_4', title: 'Linha do Tempo — Revolução Francesa', description: 'Linha do tempo interativa com os principais eventos', type: 'presentation', url: '#', subject_id: 'sub_hist', class_id: 'class_9a', teacher_id: 'user_prof3', size: 4096000, downloads: 15, tags: ['revolução francesa', 'iluminismo'], created_at: d(-12), is_approved: true, trimester: 1 },
  { id: 'mat_5', title: 'Lista de Exercícios — Geometria Analítica', description: 'Lista com 50 exercícios de fixação', type: 'pdf', url: '#', subject_id: 'sub_mat', class_id: 'class_9a', teacher_id: 'user_prof1', size: 1024000, downloads: 28, tags: ['geometria', 'analítica', 'plano cartesiano'], created_at: d(-6), is_approved: true, trimester: 1 },
]

// ============================================================
// VIDEOS
// ============================================================

const VIDEOS: Video[] = [
  { id: 'vid_1', title: 'Fórmula de Bhaskara — Explicação Completa', description: 'Aula completa sobre a fórmula de Bhaskara com exemplos práticos', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail: undefined, duration_seconds: 1823, subject_id: 'sub_mat', class_id: 'class_9a', teacher_id: 'user_prof1', views: 145, tags: ['bhaskara', 'funções', 'algebra'], created_at: d(-14), is_published: true, trimester: 1 },
  { id: 'vid_2', title: 'Como Escrever uma Boa Redação', description: 'Dicas práticas para a redação do ENEM e vestibular', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail: undefined, duration_seconds: 2456, subject_id: 'sub_port', class_id: 'class_9a', teacher_id: 'user_prof2', views: 201, tags: ['redação', 'enem', 'dicas'], created_at: d(-10), is_published: true, trimester: 1 },
  { id: 'vid_3', title: 'Biomas Brasileiros — Visão Geral', description: 'Conheça todos os biomas do Brasil: características, fauna e flora', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail: undefined, duration_seconds: 3012, subject_id: 'sub_cien', class_id: 'class_9a', teacher_id: 'user_prof4', views: 88, tags: ['biomas', 'natureza', 'brasil'], created_at: d(-8), is_published: true, trimester: 1 },
  { id: 'vid_4', title: 'Revolução Francesa — Causas e Consequências', description: 'Aula detalhada sobre a Revolução Francesa e seu impacto no mundo', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', thumbnail: undefined, duration_seconds: 2890, subject_id: 'sub_hist', class_id: 'class_9a', teacher_id: 'user_prof3', views: 112, tags: ['revolução', 'iluminismo', 'história moderna'], created_at: d(-11), is_published: true, trimester: 1 },
]

// ============================================================
// QUIZZES
// ============================================================

const QUIZ_QUESTIONS_MAT: QuizQuestion[] = [
  { id: 'qq_1', quiz_id: 'quiz_1', type: 'multipla_escolha', text: 'Qual é o valor de x na equação 2x² - 8x + 6 = 0?', options: ['x = 1 e x = 3', 'x = 2 e x = 4', 'x = -1 e x = -3', 'x = 0 e x = 4'], correct_option: 0, explanation: 'Usando Bhaskara: Δ = 64 - 48 = 16, x = (8 ± 4)/4, logo x = 3 ou x = 1', points: 2, order: 1 },
  { id: 'qq_2', quiz_id: 'quiz_1', type: 'multipla_escolha', text: 'Uma função quadrática f(x) = ax² + bx + c tem vértice no ponto (2, -4). Se a = 1, qual é o valor de c?', options: ['c = 0', 'c = -8', 'c = 8', 'c = 4'], correct_option: 0, explanation: 'O vértice tem xv = -b/2a = 2, logo b = -4. Substituindo o vértice: -4 = 4 - 8 + c, c = 0', points: 3, order: 2 },
  { id: 'qq_3', quiz_id: 'quiz_1', type: 'verdadeiro_falso', text: 'O discriminante de uma equação do 2° grau determina a quantidade de raízes reais.', correct_boolean: true, explanation: 'Verdadeiro. Se Δ > 0, duas raízes reais; Δ = 0, uma raiz real; Δ < 0, sem raízes reais.', points: 1, order: 3 },
  { id: 'qq_4', quiz_id: 'quiz_1', type: 'multipla_escolha', text: 'Qual é o eixo de simetria da parábola f(x) = x² - 6x + 5?', options: ['x = 3', 'x = -3', 'x = 6', 'x = -6'], correct_option: 0, explanation: 'O eixo de simetria é x = -b/2a = 6/2 = 3', points: 2, order: 4 },
  { id: 'qq_5', quiz_id: 'quiz_1', type: 'multipla_escolha', text: 'Em uma PA com primeiro termo 3 e razão 4, qual é o 10° termo?', options: ['39', '43', '40', '35'], correct_option: 0, explanation: 'an = a1 + (n-1)r = 3 + 9×4 = 3 + 36 = 39', points: 2, order: 5 },
]

const QUIZZES: Quiz[] = [
  {
    id: 'quiz_1',
    title: 'Simulado — Funções Quadráticas e PA',
    description: 'Teste seus conhecimentos sobre funções do 2° grau e progressões aritméticas',
    type: 'enem',
    subject_id: 'sub_mat',
    class_id: 'class_9a',
    teacher_id: 'user_prof1',
    time_limit_minutes: 30,
    questions: QUIZ_QUESTIONS_MAT,
    created_at: d(-7),
    due_date: d(7),
    is_published: true,
    attempts_allowed: 2,
    show_answers_after: true,
    trimester: 1,
  },
  {
    id: 'quiz_2',
    title: 'Quiz Rápido — Revolução Francesa',
    description: 'Questões sobre os principais eventos da Revolução Francesa',
    type: 'multipla_escolha',
    subject_id: 'sub_hist',
    class_id: 'class_9a',
    teacher_id: 'user_prof3',
    time_limit_minutes: 15,
    questions: [
      { id: 'qh_1', quiz_id: 'quiz_2', type: 'multipla_escolha', text: 'Em que ano começou a Revolução Francesa?', options: ['1789', '1776', '1799', '1804'], correct_option: 0, explanation: 'A Revolução Francesa começou em 1789 com a queda da Bastilha.', points: 2, order: 1 },
      { id: 'qh_2', quiz_id: 'quiz_2', type: 'verdadeiro_falso', text: 'Luís XVI foi guilhotinado durante a Revolução Francesa.', correct_boolean: true, explanation: 'Verdadeiro. Luís XVI foi executado em 1793.', points: 2, order: 2 },
      { id: 'qh_3', quiz_id: 'quiz_2', type: 'multipla_escolha', text: 'Qual foi o lema da Revolução Francesa?', options: ['Liberdade, Igualdade, Fraternidade', 'Paz, Terra, Pão', 'Ordem e Progresso', 'União, Força, Liberdade'], correct_option: 0, explanation: 'O lema era "Liberté, Égalité, Fraternité"', points: 2, order: 3 },
    ],
    created_at: d(-5),
    due_date: d(10),
    is_published: true,
    attempts_allowed: 3,
    show_answers_after: true,
    trimester: 1,
  },
]

// ============================================================
// NOTIFICATIONS
// ============================================================

const NOTIFICATIONS: Notification[] = [
  { id: 'notif_1', user_id: 'user_aluno1', type: 'grade', title: 'Nova nota lançada', body: 'Roberto Alves lançou sua nota em Matemática: 7.0', priority: 'medium', read: false, created_at: d(-1) },
  { id: 'notif_2', user_id: 'user_aluno1', type: 'task', title: 'Tarefa com prazo chegando', body: 'Lista de Exercícios — Funções do 2° Grau vence em 3 dias', priority: 'high', read: false, created_at: d(-0.5) },
  { id: 'notif_3', user_id: 'user_aluno1', type: 'event', title: 'Evento amanhã', body: 'Prova de Matemática marcada para daqui a 5 dias', priority: 'medium', read: true, created_at: d(-2) },
  { id: 'notif_4', user_id: 'user_aluno1', type: 'achievement', title: 'Conquista desbloqueada!', body: 'Você desbloqueou: "Em Ascensão" — +75 XP!', priority: 'low', read: true, created_at: d(-3) },
  { id: 'notif_5', user_id: 'user_aluno1', type: 'message', title: 'Nova mensagem', body: 'Professor Roberto enviou uma mensagem no chat de Matemática', priority: 'low', read: false, created_at: d(-1) },

  { id: 'notif_6', user_id: 'user_pai1', type: 'grade', title: 'Nova nota do seu filho', body: 'Lucas recebeu nota 8.5 na Prova de Matemática', priority: 'medium', read: false, created_at: d(-1) },
  { id: 'notif_7', user_id: 'user_pai1', type: 'attendance', title: 'Falta registrada', body: 'Lucas faltou à aula de Ciências hoje', priority: 'high', read: false, created_at: d(-2) },

  { id: 'notif_8', user_id: 'user_prof1', type: 'task', title: 'Tarefas para corrigir', body: '5 alunos entregaram a lista de exercícios', priority: 'medium', read: false, created_at: d(-1) },
  { id: 'notif_9', user_id: 'user_prof1', type: 'system', title: 'Lembrete: Conselho de Classe', body: 'Conselho de Classe em 21 dias', priority: 'low', read: true, created_at: d(-3) },

  { id: 'notif_10', user_id: 'user_coord', type: 'system', title: 'Alunos em risco', body: '3 alunos identificados em risco no 9A', priority: 'urgent', read: false, created_at: d(-0.2) },
]

// ============================================================
// GAMIFICATION
// ============================================================

const GAMIFICATION_DATA: GamificationData[] = [
  { ...createGamificationData('user_aluno1', 1850), streak_days: 12, total_tasks_completed: 18, total_quizzes_completed: 7 },
  { ...createGamificationData('user_aluno2', 3200), streak_days: 25, total_tasks_completed: 32, total_quizzes_completed: 15 },
  { ...createGamificationData('user_aluno3', 350), streak_days: 2, total_tasks_completed: 4, total_quizzes_completed: 1 },
  { ...createGamificationData('user_aluno4', 1100), streak_days: 8, total_tasks_completed: 12, total_quizzes_completed: 5 },
  { ...createGamificationData('user_aluno5', 2750), streak_days: 19, total_tasks_completed: 27, total_quizzes_completed: 11 },
  { ...createGamificationData('user_aluno6', 1650), streak_days: 14, total_tasks_completed: 16, total_quizzes_completed: 9 },
  { ...createGamificationData('user_aluno7', 480), streak_days: 3, total_tasks_completed: 6, total_quizzes_completed: 2 },
  { ...createGamificationData('user_aluno8', 4100), streak_days: 30, total_tasks_completed: 40, total_quizzes_completed: 18 },
  { ...createGamificationData('user_aluno9', 920), streak_days: 7, total_tasks_completed: 10, total_quizzes_completed: 4 },
  { ...createGamificationData('user_aluno10', 650), streak_days: 4, total_tasks_completed: 7, total_quizzes_completed: 3 },
]

// ============================================================
// PASSWORDS
// ============================================================

const PASSWORDS: Record<string, string> = {
  user_diretor: '123456', user_coord: '123456',
  user_prof1: '123456', user_prof2: '123456', user_prof3: '123456',
  user_prof4: '123456', user_prof5: '123456', user_prof6: '123456', user_prof7: '123456',
  user_aluno1: '123456', user_aluno2: '123456', user_aluno3: '123456',
  user_aluno4: '123456', user_aluno5: '123456', user_aluno6: '123456',
  user_aluno7: '123456', user_aluno8: '123456', user_aluno9: '123456', user_aluno10: '123456',
  user_pai1: '123456', user_pai2: '123456',
}

// ============================================================
// SCHEDULES
// ============================================================

const HORARIOS: ClassSchedule[] = [
  {
    id: 'sched_9a',
    class_id: 'class_9a',
    academic_year: 2025,
    created_by: 'user_coord',
    created_at: dFixed(2025, 2, 1),
    updated_at: dFixed(2025, 2, 1),
    slots: [
      { id: 's1', day: 'segunda', time_start: '07:00', time_end: '07:50', subject_id: 'sub_mat', teacher_id: 'user_prof1' },
      { id: 's2', day: 'segunda', time_start: '07:50', time_end: '08:40', subject_id: 'sub_port', teacher_id: 'user_prof2' },
      { id: 's3', day: 'segunda', time_start: '09:00', time_end: '09:50', subject_id: 'sub_hist', teacher_id: 'user_prof3' },
      { id: 's4', day: 'segunda', time_start: '09:50', time_end: '10:40', subject_id: 'sub_fis', teacher_id: 'user_prof5' },
      { id: 's5', day: 'terca', time_start: '07:00', time_end: '07:50', subject_id: 'sub_port', teacher_id: 'user_prof2' },
      { id: 's6', day: 'terca', time_start: '07:50', time_end: '08:40', subject_id: 'sub_cien', teacher_id: 'user_prof4' },
      { id: 's7', day: 'terca', time_start: '09:00', time_end: '09:50', subject_id: 'sub_ing', teacher_id: 'user_prof6' },
      { id: 's8', day: 'terca', time_start: '09:50', time_end: '10:40', subject_id: 'sub_quim', teacher_id: 'user_prof5' },
      { id: 's9', day: 'quarta', time_start: '07:00', time_end: '07:50', subject_id: 'sub_mat', teacher_id: 'user_prof1' },
      { id: 's10', day: 'quarta', time_start: '07:50', time_end: '08:40', subject_id: 'sub_geo', teacher_id: 'user_prof3' },
      { id: 's11', day: 'quarta', time_start: '09:00', time_end: '09:50', subject_id: 'sub_bio', teacher_id: 'user_prof4' },
      { id: 's12', day: 'quarta', time_start: '09:50', time_end: '10:40', subject_id: 'sub_info', teacher_id: 'user_prof7' },
      { id: 's13', day: 'quinta', time_start: '07:00', time_end: '07:50', subject_id: 'sub_hist', teacher_id: 'user_prof3' },
      { id: 's14', day: 'quinta', time_start: '07:50', time_end: '08:40', subject_id: 'sub_red', teacher_id: 'user_prof2' },
      { id: 's15', day: 'quinta', time_start: '09:00', time_end: '09:50', subject_id: 'sub_ef', teacher_id: 'user_prof1' },
      { id: 's16', day: 'quinta', time_start: '09:50', time_end: '10:40', subject_id: 'sub_filos', teacher_id: 'user_prof3' },
      { id: 's17', day: 'sexta', time_start: '07:00', time_end: '07:50', subject_id: 'sub_mat', teacher_id: 'user_prof1' },
      { id: 's18', day: 'sexta', time_start: '07:50', time_end: '08:40', subject_id: 'sub_lit', teacher_id: 'user_prof2' },
      { id: 's19', day: 'sexta', time_start: '09:00', time_end: '09:50', subject_id: 'sub_esp', teacher_id: 'user_prof6' },
      { id: 's20', day: 'sexta', time_start: '09:50', time_end: '10:40', subject_id: 'sub_arte', teacher_id: 'user_prof7' },
    ],
  },
]

// ============================================================
// SEED
// ============================================================

const CURRENT_SEED_VERSION = 3

export function seedIfEmpty(): void {
  const version = storage.get('seed_version') as number | null
  if (storage.get('seeded') && version === CURRENT_SEED_VERSION) return

  // Clear all and re-seed with latest data
  storage.clear_all()

  storage.set('school', SCHOOL)
  storage.set('users', USERS)
  storage.set('passwords', PASSWORDS)
  storage.set('classes', CLASSES)
  storage.set('subjects', SUBJECTS)
  storage.set('class_subjects', CLASS_SUBJECTS)
  storage.set('assessments', ASSESSMENTS)
  storage.set('assessment_grades', GRADES)
  storage.set('attendance', ATTENDANCE_RECORDS)
  storage.set('tasks', TASKS)
  storage.set('task_submissions', SUBMISSIONS)
  storage.set('classroom_posts', CLASSROOM_POSTS)
  storage.set('conversations', CONVERSATIONS)
  storage.set('messages', MESSAGES)
  storage.set('events', EVENTS)
  storage.set('materials', MATERIALS)
  storage.set('videos', VIDEOS)
  storage.set('quizzes', QUIZZES)
  storage.set('quiz_attempts', [])
  storage.set('notifications', NOTIFICATIONS)
  storage.set('gamification', GAMIFICATION_DATA)
  storage.set('horarios', HORARIOS)
  storage.set('api_settings', {})
  storage.set('seed_version', CURRENT_SEED_VERSION)
  storage.set('seeded', true)
}
