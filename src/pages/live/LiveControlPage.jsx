import { useState } from 'react'
import { Radio, Tv } from 'lucide-react'
import useLiveStore from '../../store/useLiveStore'

export default function LiveControlPage() {
  const { isLive, videoId, setLive, reset } = useLiveStore()
  const [draftId, setDraftId] = useState(videoId || '')

  function handleToggle() {
    if (isLive) {
      reset()
      setDraftId('')
    } else {
      setLive(true, draftId.trim())
    }
  }

  function handleVideoIdChange(e) {
    const val = e.target.value.trim()
    setDraftId(val)
    if (isLive) setLive(true, val)
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Radio size={22} className="text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-900">Transmisión en Vivo</h1>
      </div>

      {/* Main toggle card */}
      <div
        className={`rounded-2xl p-6 border-2 transition-all duration-300 ${
          isLive
            ? 'border-red-400 bg-red-50'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isLive && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            )}
            <span className={`text-lg font-bold ${isLive ? 'text-red-600' : 'text-gray-400'}`}>
              {isLive ? '🔴 EN VIVO' : '⚫ OFFLINE'}
            </span>
          </div>

          {/* Toggle switch */}
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              isLive ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                isLive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <p className={`text-sm mb-4 ${isLive ? 'text-red-500' : 'text-gray-400'}`}>
          {isLive
            ? 'Los miembros verán el banner EN VIVO en la app.'
            : 'La app mostrará el banner cuando actives la transmisión.'}
        </p>

        {/* Video ID input */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            YouTube Video ID
          </label>
          <input
            type="text"
            value={draftId}
            onChange={handleVideoIdChange}
            placeholder="Ej: dQw4w9WgXcQ"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
          {draftId && (
            <p className="text-xs text-gray-400 mt-1">
              Enlace:{' '}
              <a
                href={`https://youtube.com/watch?v=${draftId}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-500 underline"
              >
                youtube.com/watch?v={draftId}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4 flex gap-3">
        <Tv size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-0.5">¿Cómo funciona?</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Cuando actives el toggle, la app de miembros mostrará automáticamente el banner
            "EN VIVO" con el video de YouTube que ingreses aquí. No se requiere API ni cuotas.
          </p>
        </div>
      </div>
    </div>
  )
}
