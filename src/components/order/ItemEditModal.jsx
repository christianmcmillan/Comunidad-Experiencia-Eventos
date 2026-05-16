import { useState } from 'react'
import { Music2, Search, X } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import useSongsStore from '../../store/useSongsStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const MUSICAL_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'Dbm', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm']

const SPOKEN_PRESETS = [
  'Bienvenida', 'Oración', 'Anuncios', 'Ofrenda', 'Mensaje / Predicación',
  'Llamado / Altar', 'Bendición Final', 'Conectar Grupos', 'Testimonio',
  'Presentación de Bebés', 'Bautismos',
]

function durationToSeconds(val) {
  if (!val) return 0
  if (val.includes(':')) {
    const [m, s] = val.split(':').map(Number)
    return (m || 0) * 60 + (s || 0)
  }
  return parseInt(val, 10) * 60
}

function secondsToDuration(s) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const sec = s % 60
  return sec > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${m}`
}

export default function ItemEditModal({ item, planId, onClose }) {
  const { updateOrderItem } = usePlansStore()
  const { songs } = useSongsStore()
  const [form, setForm] = useState({
    title: item.title || '',
    description: item.description || '',
    duration: secondsToDuration(item.duration),
    key: item.key || '',
    songId: item.songId || '',
    notes: item.notes || '',
  })
  const [songSearch, setSongSearch] = useState('')

  const filteredSongs = songs.filter((s) =>
    s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
    s.artist?.toLowerCase().includes(songSearch.toLowerCase())
  ).slice(0, 20)

  const selectedSong = form.songId ? songs.find((s) => s.id === form.songId) : null

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  function handleSave() {
    updateOrderItem(planId, item.id, {
      ...form,
      duration: durationToSeconds(form.duration),
    })
    onClose()
  }

  const title = {
    header: 'Editar Encabezado',
    song: 'Editar Canción',
    spoken: 'Editar Elemento Hablado',
    media: 'Editar Media',
  }[item.type] || 'Editar'

  return (
    <Modal open title={title} onClose={onClose} size="md">
      <div className="space-y-4">

        {/* Header item */}
        {item.type === 'header' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título de sección</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
              placeholder="PRE-SERVICIO"
            />
          </div>
        )}

        {/* Song item */}
        {item.type === 'song' && (
          <>
            {/* Song picker */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Canción</label>
              {selectedSong ? (
                <div className="flex items-center gap-2 p-2 border border-indigo-200 bg-indigo-50 rounded-md">
                  <Music2 size={14} className="text-indigo-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{selectedSong.title}</p>
                    <p className="text-xs text-gray-500">{selectedSong.artist}</p>
                  </div>
                  <button onClick={() => { set('songId', ''); set('title', 'Canción') }} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={songSearch}
                      onChange={(e) => setSongSearch(e.target.value)}
                      placeholder="Buscar canción..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                    {filteredSongs.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { set('songId', s.id); set('title', s.title) }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 text-left border-b border-gray-100 last:border-0"
                      >
                        <Music2 size={13} className="text-indigo-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{s.title}</p>
                          <p className="text-xs text-gray-400 truncate">{s.artist} {s.bpm ? `• ${s.bpm} BPM` : ''}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {s.keys?.slice(0, 2).map((k) => (
                            <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{k}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                    {filteredSongs.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">Sin resultados</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Key selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tonalidad para este servicio</label>
              <div className="flex flex-wrap gap-1">
                {MUSICAL_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => set('key', k)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      form.key === k
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Spoken item */}
        {item.type === 'spoken' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {SPOKEN_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => set('title', p)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      form.title === p ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Nombre del elemento"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                placeholder="Notas o descripción..."
              />
            </div>
          </>
        )}

        {/* Media item */}
        {item.type === 'media' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Nombre del video / media"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Enlace (YouTube, Vimeo, etc.)</label>
              <input
                type="url"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>
          </>
        )}

        {/* Duration (for non-header items) */}
        {item.type !== 'header' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Duración <span className="text-gray-400 font-normal">(minutos o M:SS)</span>
            </label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="5 o 5:30"
            />
          </div>
        )}

        {/* Notes (all non-header) */}
        {item.type !== 'header' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nota interna (opcional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Visible para el equipo..."
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}
