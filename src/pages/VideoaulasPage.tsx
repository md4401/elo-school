import { useState, useMemo } from 'react'
import { Video, Play, Clock, Search, BookOpen, ExternalLink, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { storage } from '@/lib/storage'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { hasPermission } from '@/lib/constants'
import { generateId, nowISO } from '@/lib/utils'
import type { Video as VideoType, Subject } from '@/types'

export default function VideoaulasPage() {
  const { currentUser } = useAuth()
  const { addToast } = useNotifications()
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [videos, setVideos] = useState<VideoType[]>(() => storage.getArray('videos'))

  const [form, setForm] = useState({
    title: '', description: '', url: '', subject_id: '', class_id: '',
    duration_minutes: '10', trimester: '1' as '1' | '2' | '3',
  })

  const canCreate = currentUser ? hasPermission(currentUser.role, 'create_videos') : false

  const data = useMemo(() => {
    if (!currentUser) return null
    const subjects = storage.getArray('subjects')
    const classes = storage.getArray('classes')
    let filteredVideos = [...videos]

    if (currentUser.role === 'aluno') {
      filteredVideos = filteredVideos.filter((v) => v.class_id === currentUser.class_id && v.is_published)
    } else if (currentUser.role === 'pai') {
      const child = storage.getArray('users').find((u) => u.id === currentUser.child_id)
      filteredVideos = filteredVideos.filter((v) => v.class_id === child?.class_id && v.is_published)
    } else if (currentUser.role === 'professor') {
      const myClassIds = classes.filter((c) => c.teacher_ids.includes(currentUser.id)).map((c) => c.id)
      filteredVideos = filteredVideos.filter((v) => myClassIds.includes(v.class_id))
    }

    if (search) filteredVideos = filteredVideos.filter((v) => v.title.toLowerCase().includes(search.toLowerCase()))
    if (filterSubject) filteredVideos = filteredVideos.filter((v) => v.subject_id === filterSubject)

    const mySubjects = subjects.filter((s) => {
      if (currentUser.role === 'aluno') {
        const cls = classes.find((c) => c.id === currentUser.class_id)
        return cls?.subject_ids.includes(s.id)
      }
      return true
    })

    const myClasses = currentUser.role === 'professor'
      ? classes.filter((c) => c.teacher_ids.includes(currentUser.id))
      : classes

    const subjectGroups = mySubjects.map((sub) => ({
      subject: sub,
      videos: filteredVideos.filter((v) => v.subject_id === sub.id),
    })).filter((g) => g.videos.length > 0)

    return { videos: filteredVideos, subjects: mySubjects, classes: myClasses, subjectGroups }
  }, [currentUser, search, filterSubject, videos])

  function handleCreate() {
    if (!currentUser || !form.title.trim() || !form.url.trim() || !form.subject_id || !form.class_id) {
      addToast({ title: 'Preencha todos os campos obrigatórios', body: '', type: 'error' }); return
    }
    const video: VideoType = {
      id: generateId(),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      url: form.url.trim(),
      subject_id: form.subject_id,
      class_id: form.class_id,
      teacher_id: currentUser.id,
      duration_seconds: Number(form.duration_minutes) * 60,
      views: 0,
      tags: [],
      is_published: true,
      trimester: Number(form.trimester) as 1 | 2 | 3,
      created_at: nowISO(),
    }
    storage.push('videos', video)
    setVideos((prev) => [...prev, video])
    setCreateModal(false)
    setForm({ title: '', description: '', url: '', subject_id: '', class_id: '', duration_minutes: '10', trimester: '1' })
    addToast({ title: 'Videoaula adicionada!', body: video.title, type: 'success' })
  }

  if (!currentUser || !data) return null

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Videoaulas"
        subtitle="Aulas gravadas e conteúdo em vídeo"
        icon={<Video size={20} />}
        actions={canCreate && (
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreateModal(true)}>
            Adicionar Vídeo
          </Button>
        )}
      />

      <div className="flex flex-wrap gap-3">
        <Input icon={<Search size={16} />} placeholder="Buscar videoaulas..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
        <Select
          options={[{ value: '', label: 'Todas as disciplinas' }, ...data.subjects.map((s) => ({ value: s.id, label: s.name }))]}
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="w-48"
        />
      </div>

      {data.videos.length === 0 ? (
        <EmptyState icon={<Video size={24} />} title="Nenhuma videoaula encontrada" description={search ? 'Tente outros termos de busca' : 'Nenhuma videoaula disponível ainda'} />
      ) : filterSubject ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.videos.map((video) => (
            <VideoCard key={video.id} video={video} subjects={data.subjects} onPlay={setSelectedVideo} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {data.subjectGroups.map(({ subject, videos: groupVideos }) => (
            <div key={subject.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                <h3 className="font-semibold text-dark-100">{subject.name}</h3>
                <span className="text-xs text-dark-500">{groupVideos.length} aula{groupVideos.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupVideos.map((video) => (
                  <VideoCard key={video.id} video={video} subjects={data.subjects} onPlay={setSelectedVideo} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video player modal */}
      {selectedVideo && (
        <Modal open={!!selectedVideo} onClose={() => setSelectedVideo(null)} title={selectedVideo.title} size="lg">
          <div className="space-y-4">
            <div className="aspect-video bg-dark-900 rounded-xl flex items-center justify-center border border-dark-700">
              <div className="text-center">
                <Play size={48} className="text-amber-400 mx-auto mb-3" />
                <p className="text-dark-400 text-sm">Player de vídeo</p>
                <Button variant="primary" size="sm" icon={<ExternalLink size={14} />} className="mt-4"
                  onClick={() => window.open(selectedVideo.url, '_blank')}>
                  Abrir vídeo
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {selectedVideo.description && <p className="text-sm text-dark-300">{selectedVideo.description}</p>}
              <div className="flex items-center gap-3 text-xs text-dark-500">
                <span className="flex items-center gap-1"><Clock size={12} /> {Math.ceil(selectedVideo.duration_seconds / 60)} min</span>
                <span>{selectedVideo.views} visualizações</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create video modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Adicionar Videoaula"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Publicar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Título da videoaula"
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Descreva o conteúdo da aula..."
              className="w-full bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>
          <Input
            label="URL do vídeo *"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://youtube.com/watch?v=... ou link direto"
            fullWidth
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Disciplina *"
              value={form.subject_id}
              onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              options={[{ value: '', label: 'Selecione' }, ...data.subjects.map((s) => ({ value: s.id, label: s.name }))]}
              fullWidth
            />
            <Select
              label="Turma *"
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              options={[{ value: '', label: 'Selecione' }, ...data.classes.map((c) => ({ value: c.id, label: c.name }))]}
              fullWidth
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duração (minutos)"
              type="number"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              fullWidth
            />
            <Select
              label="Trimestre"
              value={form.trimester}
              onChange={(e) => setForm({ ...form, trimester: e.target.value as '1' | '2' | '3' })}
              options={[{ value: '1', label: '1º Trimestre' }, { value: '2', label: '2º Trimestre' }, { value: '3', label: '3º Trimestre' }]}
              fullWidth
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function VideoCard({ video, subjects, onPlay }: {
  video: VideoType
  subjects: Subject[]
  onPlay: (v: VideoType) => void
}) {
  const subject = subjects.find((s) => s.id === video.subject_id)
  const durationMin = Math.ceil(video.duration_seconds / 60)

  return (
    <Card hover className="flex flex-col cursor-pointer group" onClick={() => onPlay(video)}>
      <div className="relative aspect-video bg-dark-900 rounded-xl mb-3 overflow-hidden flex items-center justify-center border border-dark-700">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={32} className="text-dark-600" />
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
            <Play size={20} className="text-dark-900 ml-1" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
          {durationMin}min
        </span>
      </div>
      <div className="flex-1">
        <p className="font-medium text-dark-100 text-sm leading-snug line-clamp-2">{video.title}</p>
        {video.description && <p className="text-xs text-dark-400 mt-1 line-clamp-2">{video.description}</p>}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-700">
        {subject && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: subject.color + '20', color: subject.color }}>
            {subject.name}
          </span>
        )}
        <span className="text-xs text-dark-500 ml-auto">{video.views} views</span>
      </div>
    </Card>
  )
}
