import { jsPDF } from 'jspdf'
import type { User, Assessment, AssessmentGrade, Subject, SchoolClass } from '@/types'
import { computeWeightedAverage } from './utils'
import { GRADE_STATUS } from './constants'

export function generateReportCard(
  student: User,
  schoolClass: SchoolClass,
  subjects: Subject[],
  assessments: Assessment[],
  grades: AssessmentGrade[],
  attendanceMap: Record<string, number>
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const primaryColor: [number, number, number] = [245, 158, 11]
  const darkColor: [number, number, number] = [17, 24, 39]
  const grayColor: [number, number, number] = [107, 114, 128]
  const lightGray: [number, number, number] = [243, 244, 246]

  const pageW = 210
  const margin = 20

  // Header background
  doc.setFillColor(...darkColor)
  doc.rect(0, 0, pageW, 45, 'F')

  doc.setFillColor(...primaryColor)
  doc.rect(0, 45, pageW, 2, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('ELO', margin, 20)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 163, 175)
  doc.text('Plataforma de Gestão Escolar', margin, 28)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('BOLETIM ESCOLAR', 110, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 163, 175)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 190, 28, { align: 'right' })

  // Student info box
  let y = 55
  doc.setFillColor(...lightGray)
  doc.roundedRect(margin, y, pageW - 2 * margin, 30, 3, 3, 'F')

  doc.setTextColor(...darkColor)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(student.name, margin + 5, y + 9)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text(`RA: ${student.enrollment_number ?? 'N/A'}`, margin + 5, y + 17)
  doc.text(`Turma: ${schoolClass.name}`, margin + 5, y + 24)
  doc.text(`Ano: ${schoolClass.academic_year}`, 120, y + 17)
  doc.text(`Turno: ${schoolClass.shift === 'manha' ? 'Manhã' : schoolClass.shift === 'tarde' ? 'Tarde' : 'Noite'}`, 120, y + 24)

  // Table header
  y += 38
  doc.setFillColor(...darkColor)
  doc.rect(margin, y, pageW - 2 * margin, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Disciplina', margin + 3, y + 5.5)
  doc.text('T1', 110, y + 5.5, { align: 'center' })
  doc.text('T2', 130, y + 5.5, { align: 'center' })
  doc.text('T3', 150, y + 5.5, { align: 'center' })
  doc.text('Média', 165, y + 5.5, { align: 'center' })
  doc.text('Freq.', 180, y + 5.5, { align: 'center' })
  doc.text('Situação', 193, y + 5.5, { align: 'center' })

  y += 8

  let totalAvg = 0
  let totalFreq = 0
  let subjectCount = 0

  subjects.forEach((subject, idx) => {
    const rowColor: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [249, 250, 251]
    doc.setFillColor(...rowColor)
    doc.rect(margin, y, pageW - 2 * margin, 9, 'F')

    const subjectAssessments = assessments.filter((a) => a.subject_id === subject.id)
    const t1Assessments = subjectAssessments.filter((a) => a.trimester === 1)
    const t2Assessments = subjectAssessments.filter((a) => a.trimester === 2)
    const t3Assessments = subjectAssessments.filter((a) => a.trimester === 3)

    const avg1 = computeWeightedAverage(t1Assessments, grades, student.id)
    const avg2 = computeWeightedAverage(t2Assessments, grades, student.id)
    const avg3 = computeWeightedAverage(t3Assessments, grades, student.id)
    const avgAll = (avg1 + avg2 + avg3) / 3
    const freq = attendanceMap[subject.id] ?? 100

    totalAvg += avgAll
    totalFreq += freq
    subjectCount++

    const status = GRADE_STATUS(avgAll, freq)
    const statusLabel = status === 'aprovado' ? 'Aprovado' : status === 'recuperacao' ? 'Recuperação' : 'Reprovado'

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...darkColor)
    doc.text(subject.name, margin + 3, y + 6)
    doc.text(avg1 > 0 ? avg1.toFixed(1) : '-', 110, y + 6, { align: 'center' })
    doc.text(avg2 > 0 ? avg2.toFixed(1) : '-', 130, y + 6, { align: 'center' })
    doc.text(avg3 > 0 ? avg3.toFixed(1) : '-', 150, y + 6, { align: 'center' })

    const avgColor: [number, number, number] = avgAll >= 7 ? [5, 150, 105] : avgAll >= 5 ? [217, 119, 6] : [220, 38, 38]
    doc.setTextColor(...avgColor)
    doc.setFont('helvetica', 'bold')
    doc.text(avgAll > 0 ? avgAll.toFixed(1) : '-', 165, y + 6, { align: 'center' })

    doc.setTextColor(...darkColor)
    doc.setFont('helvetica', 'normal')
    doc.text(`${freq.toFixed(0)}%`, 180, y + 6, { align: 'center' })

    const sColor: [number, number, number] = status === 'aprovado' ? [5, 150, 105] : status === 'recuperacao' ? [217, 119, 6] : [220, 38, 38]
    doc.setTextColor(...sColor)
    doc.setFont('helvetica', 'bold')
    doc.text(statusLabel, 193, y + 6, { align: 'center' })

    y += 9
  })

  // Summary row
  if (subjectCount > 0) {
    doc.setFillColor(...primaryColor)
    doc.rect(margin, y, pageW - 2 * margin, 9, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('MÉDIA GERAL', margin + 3, y + 6)
    doc.text((totalAvg / subjectCount).toFixed(1), 165, y + 6, { align: 'center' })
    doc.text(`${(totalFreq / subjectCount).toFixed(0)}%`, 180, y + 6, { align: 'center' })
    y += 9
  }

  // Footer
  y = 275
  doc.setFillColor(...lightGray)
  doc.rect(0, y, pageW, 22, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)
  doc.text('Este documento foi gerado automaticamente pela plataforma Elo e tem validade informativa.', pageW / 2, y + 8, { align: 'center' })
  doc.text('Para uso oficial, solicite o documento assinado à secretaria escolar.', pageW / 2, y + 14, { align: 'center' })

  doc.save(`boletim_${student.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`)
}
