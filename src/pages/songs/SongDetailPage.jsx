import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Music2 } from 'lucide-react'
import useSongsStore from '../../store/useSongsStore'
import Badge from '../../components/ui/Badge'

export default function SongDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSong } = useSongsStore()
  const song = getSong(id)

  if (!song) return (
    <div className="p-6 text-sm text-gray-500">
      Canción no encontrada. <button className="text-indigo-600 hover:underline" onClick={() => navigate('/canciones')}>Volver</button>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/canciones')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <Music2 size={20} className="text-indigo-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{song.title}</h1>
            <p className="text-sm text-gray-500">{song.artist}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-2xl">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Detalles</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">BPM</p>
                <p className="font-medium text-gray-800">{song.bpm || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">CCLI</p>
                <p className="font-medium text-gray-800">{song.ccli || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Tonalidades disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {(song.keys || []).map((k) => (
                  <span key={k} className="text-sm bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-medium">{k}</span>
                ))}
                {song.keys?.length === 0 && <span className="text-xs text-gray-400">Sin tonalidades registradas</span>}
              </div>
            </div>
            {(song.themes || []).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Temas</p>
                <div className="flex flex-wrap gap-1">
                  {song.themes.map((t) => (
                    <Badge key={t} color="gray" size="xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Historial</p>
            <div className="text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Último uso</span>
                <span className="text-gray-800">{song.lastScheduled || 'Nunca'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Agregada</span>
                <span className="text-gray-800">{song.createdAt ? new Date(song.createdAt).toLocaleDateString('es-CO') : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
