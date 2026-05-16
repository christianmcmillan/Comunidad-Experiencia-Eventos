import { Film } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'

export default function MediaPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Media</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Film}
          title="Biblioteca de Media"
          description="Sube videos, imágenes y archivos multimedia para usar en tus planes. Próximamente disponible."
        />
      </div>
    </div>
  )
}
