import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Music2, Plus, X, Edit2, Check } from 'lucide-react'
import useSongsStore from '../../store/useSongsStore'
import usePlansStore from '../../store/usePlansStore'

const MUSICAL_KEYS = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B']
const THEME_SUGGESTIONS = ['alabanza','adoración','comunión','ofrenda','bienvenida','cierre','navidad','pascua','ayuno','bautismo']

function Field({ label, value, onSave, type = 'text', placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  function save() { onSave(val); setEditing(false) }
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type={type}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus
            className="flex-1 text-sm border-b border-indigo-400 outline-none bg-transparent"
            placeholder={placeholder}
          />
          <button onClick={save} className="text-indigo-500 hover:text-indigo-700"><Check size={14} /></button>
          <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>
      ) : (
        <button
          onClick={() => { setVal(value || ''); setEditing(true) }}
          className="text-sm font-medium text-gray-800 hover:text-indigo-700 transition-colors text-left w-full"
        >
          {value || <span className="text-gray-300 italic">—</span>}
        </button>
      )}
    </div>
  )
}

export default function SongDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSong, updateSong } = useSongsStore()
  const { plans } = usePlansStore()
  const song = getSong(id)

  const [newTheme, setNewTheme] = useState('')
  const [addingKey, setAddingKey] = useState(false)

  if (!song) return (
    <div className="p-6 text-sm text-gray-500">
      Canción no encontrada.{' '}
      <button className="text-indigo-600 hover:underline" onClick={() => navigate('/canciones')}>Volver</button>
    </div>
  )

  // Compute usage count from all plans
  const usagePlans = plans.filter(p =>
    (p.order || []).some(item => item.songId === id)
  )
  const usageCount = usagePlans.length

  function addTheme(theme) {
    const t = theme.trim().toLowerCase()
    if (!t || (song.themes || []).includes(t)) return
    updateSong(id, { themes: [...(song.themes || []), t] })
    setNewTheme('')
  }

  function removeTheme(theme) {
    updateSong(id, { themes: (song.themes || []).filter(t => t !== theme) })
  }

  function addKey(key) {
    if ((song.keys || []).includes(key)) return
    updateSong(id, { keys: [...(song.keys || []), key] })
    setAddingKey(false)
  }

  function removeKey(key) {
    updateSong(id, { keys: (song.keys || []).filter(k => k !== key) })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/canciones')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <Music2 size={20} className="text-indigo-500" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{song.title}</h1>
          <p className="text-sm text-gray-500">{song.artist}</p>
        </div>
        {usageCount > 0 && (
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
            Usado {usageCount} {usageCount === 1 ? 'vez' : 'veces'}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-5">

          {/* Editable details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Detalles</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Título" value={song.title} onSave={v => updateSong(id, { title: v })} />
              <Field label="Artista" value={song.artist} onSave={v => updateSong(id, { artist: v })} />
              <Field label="BPM" value={song.bpm?.toString()} type="number" onSave={v => updateSong(id, { bpm: Number(v) || null })} />
              <Field label="CCLI #" value={song.ccli} onSave={v => updateSong(id, { ccli: v })} placeholder="ej: 7148817" />
            </div>
          </div>

          {/* Keys */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Tonalidades</p>
            <div className="flex flex-wrap gap-1.5">
              {(song.keys || []).map(k => (
                <span key={k} className="inline-flex items-center gap-1 text-sm bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg font-medium group">
                  {k}
                  <button onClick={() => removeKey(k)} className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-red-500 transition-all">
                    <X size={11} />
                  </button>
                </span>
              ))}
              {addingKey ? (
                <div className="flex flex-wrap gap-1 mt-1 w-full">
                  {MUSICAL_KEYS.filter(k => !(song.keys || []).includes(k)).map(k => (
                    <button
                      key={k}
                      onClick={() => addKey(k)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {k}
                    </button>
                  ))}
                  <button onClick={() => setAddingKey(false)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingKey(true)}
                  className="text-xs px-2.5 py-1 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  <Plus size={11} /> Agregar
                </button>
              )}
            </div>
          </div>

          {/* Tags / Themes */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Etiquetas</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(song.themes || []).map(t => (
                <span key={t} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full group">
                  {t}
                  <button onClick={() => removeTheme(t)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
                    <X size={10} />
                  </button>
                </span>
              ))}
              {(song.themes || []).length === 0 && (
                <span className="text-xs text-gray-400">Sin etiquetas</span>
              )}
            </div>
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1 mb-2">
              {THEME_SUGGESTIONS.filter(t => !(song.themes || []).includes(t)).map(t => (
                <button
                  key={t}
                  onClick={() => addTheme(t)}
                  className="text-xs px-2 py-0.5 border border-dashed border-gray-200 rounded-full text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>
            {/* Custom tag input */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newTheme}
                onChange={e => setNewTheme(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTheme(newTheme) }}
                placeholder="Nueva etiqueta..."
                className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40"
              />
              <button
                onClick={() => addTheme(newTheme)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Usage history */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Historial de uso</p>
            {usagePlans.length === 0 ? (
              <p className="text-sm text-gray-400">Esta canción no ha sido programada todavía.</p>
            ) : (
              <div className="space-y-1">
                {usagePlans.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700">{p.title}</span>
                    <span className="text-xs text-gray-400">{p.dates?.[0] || '—'}</span>
                  </div>
                ))}
                {usagePlans.length > 10 && (
                  <p className="text-xs text-gray-400 pt-1">+{usagePlans.length - 10} más</p>
                )}
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
              <span>Agregada: {song.createdAt ? new Date(song.createdAt).toLocaleDateString('es-CO') : '—'}</span>
              <span>Último uso: {song.lastScheduled || 'Nunca'}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
