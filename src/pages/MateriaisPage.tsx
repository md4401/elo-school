import { useState, useMemo } from 'react'
import { FolderOpen, Plus, Download, Search, Filter, File, Image, Link, Presentation } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { hasPermission } from '@/lib/constants'
import { generateId, nowISO, formatDate, formatFileSize } from '@/lib/utils'
import type { Material, MaterialType } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_ICONS: Record<MaterialType, React.ComponentType<any>> = {
  pdf: File, doc: File, image: Image, link: Link,
  presentation: Presentation, spreadsheet: File, other: File,
}

const TYPE_COLORS: Record<MaterialType, string> = {
  pdf: 'text-red-400 bg-red-500/10',
  doc: 'text-electric-400 bg-electric-500/10',
  image: 'text-green-400 bg-green-500/10',
  link: 'text-purple-400 bg-purple-500/10',
  presentation: 'text-amber-400 bg-amber-500/10',
  spreadsheet: 'text-teal-400 bg-teal-500/10',
  other: 'text-dark-400 bg-dark-700',
}

const TYPE_LABELS: Record<MaterialType, string> = {
  pdf: 'PDF', doc: 'Documento', image: 'Imagem',
  link: 'Link', presentation: 'Apresentação', spreadsheet: 'Planilha', other: 'Outro',
}

export default function MateriaisPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [materials, setMaterials] = useState<Material[]>(() => storage.getArray('materials'))
  const [newMat, setNewMat] = useState({ title: '', description: '', type: 'pdf' as MaterialType, subject_id: '', tags: '' })

  const canCreate = currentUser ? hasPermission(currentUser.role, 'create_materials') : false

  const data = useMemo(() => {
    if (!currentUser) return null
    let mats = materials
    const subjects = storage.getArray('subjects')
    const classes = storage.getArray('classes')

    if (currentUser.role === 'aluno') {
      mats = mats.filter((m) => m.class_id === currentUser.class_id && m.is_approved)
    } else if (currentUser.role === 'pai') {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      mats = mats.filter((m) => m.class_id === child?.class_id && m.is_approved)
    } else if (currentUser.role === 'professor') {
      const myClassIds = classes.filter((c) => c.teacher_ids.includes(currentUser.id)).map((c) => c.id)
      mats = mats.filter((m) => myClassIds.includes(m.class_id))
    }

    if (search) mats = mats.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()) || m.tags.some((t) => t.includes(search.toLowerCase())))
    if (filterSubject) mats = mats.filter((m) => m.subject_id === filterSubject)

    const mySubjects = subjects.filter((s) => {
      if (currentUser.role === 'aluno') {
        const cls = classes.find((c) => c.id === currentUser.class_id)
        return cls?.subject_ids.includes(s.id)
      }
      return true
    })

    return { mats, subjects: mySubjects }
  }, [materials, currentUser, search, filterSubject])

  function createMaterial() {
    if (!currentUser || !newMat.title || !newMat.subject_id) return
    const classes = storage.getArray('classes')
    const myClass = currentUser.role === 'professor'
      ? classes.find((c) => c.teacher_ids.includes(currentUser.id))
      : classes[0]
    if (!myClass) return

    const mat: Material = {
      id: generateId(),
      title: newMat.title,
      description: newMat.description,
      type: newMat.type,
      url: '#',
      subject_id: newMat.subject_id,
      class_id: myClass.id,
      teacher_id: currentUser.id,
      downloads: 0,
      tags: newMat.tags.split(',').map((t) => t.trim()).filter(Boolean),
      created_at: nowISO(),
      is_approved: currentUser.role === 'coordenador' || currentUser.role === 'diretor',
      trimester: 1,
    }
    storage.push('materials', mat)
    setMaterials((prev) => [mat, ...prev])
    addToast({ title: 'Material adicionado!', body: newMat.title, type: 'success' })
    setNewModal(false)
    setNewMat({ title: '', description: '', type: 'pdf', subject_id: '', tags: '' })
  }

  if (!currentUser || !data) return null

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Materiais"
        subtitle="Recursos de aprendizagem da turma"
        icon={<FolderOpen size={20} />}
        actions={
          canCreate && (
            <Button icon={<Plus size={16} />} onClick={() => setNewModal(true)} size="sm">
              Adicionar Material
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input icon={<Search size={16} />} placeholder="Buscar materiais..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
        <Select
          options={[{ value: '', label: 'Todas as disciplinas' }, ...data.subjects.map((s) => ({ value: s.id, label: s.name }))]}
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="w-48"
        />
      </div>

      {data.mats.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={24} />}
          title="Nenhum material encontrado"
          description={search ? 'Tente outros termos de busca' : 'Nenhum material disponível ainda'}
          action={canCreate && <Button icon={<Plus size={16} />} onClick={() => setNewModal(true)} size="sm">Adicionar Material</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.mats.map((mat) => {
            const subject = data.subjects.find((s) => s.id === mat.subject_id)
            const Icon = TYPE_ICONS[mat.type] ?? File
            const colorClass = TYPE_COLORS[mat.type]

            return (
              <Card key={mat.id} hover className="flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-100 leading-snug">{mat.title}</p>
                    <p className="text-xs text-dark-500 mt-0.5">{TYPE_LABELS[mat.type]}</p>
                  </div>
                </div>

                {mat.description && (
                  <p className="text-xs text-dark-400 mb-3 line-clamp-2">{mat.description}</p>
                )}

                <div className="flex flex-wrap gap-1 mb-3">
                  {subject && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: subject.color + '20', color: subject.color }}>
                      {subject.name}
                    </span>
                  )}
                  {mat.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-dark-700">
                  <div className="text-xs text-dark-500">
                    <span>{mat.downloads} downloads</span>
                    {mat.size && <span className="ml-2">· {formatFileSize(mat.size)}</span>}
                  </div>
                  <Button variant="ghost" size="xs" icon={<Download size={12} />} onClick={() => addToast({ title: 'Download iniciado', body: mat.title, type: 'success' })}>
                    Baixar
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={newModal}
        onClose={() => setNewModal(false)}
        title="Adicionar Material"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setNewModal(false)}>Cancelar</Button>
            <Button onClick={createMaterial}>Adicionar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Título" value={newMat.title} onChange={(e) => setNewMat({ ...newMat, title: e.target.value })} fullWidth />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={newMat.type}
              onChange={(e) => setNewMat({ ...newMat, type: e.target.value as MaterialType })}
              options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              fullWidth
            />
            <Select
              label="Disciplina"
              value={newMat.subject_id}
              onChange={(e) => setNewMat({ ...newMat, subject_id: e.target.value })}
              options={[{ value: '', label: 'Selecione' }, ...data.subjects.map((s) => ({ value: s.id, label: s.name }))]}
              fullWidth
            />
          </div>
          <Textarea label="Descrição (opcional)" value={newMat.description} onChange={(e) => setNewMat({ ...newMat, description: e.target.value })} fullWidth />
          <Input label="Tags (separadas por vírgula)" value={newMat.tags} onChange={(e) => setNewMat({ ...newMat, tags: e.target.value })} placeholder="revisão, enem, prova" fullWidth />
        </div>
      </Modal>
    </div>
  )
}
