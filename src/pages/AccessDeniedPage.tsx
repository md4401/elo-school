import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function AccessDeniedPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto">
          <ShieldOff size={40} className="text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-dark-50">Acesso Negado</h1>
        <p className="text-dark-400 max-w-sm">Você não tem permissão para acessar esta página.</p>
        <Button onClick={() => navigate(-1)} variant="secondary" icon={<ArrowLeft size={18} />}>
          Voltar
        </Button>
      </motion.div>
    </div>
  )
}
