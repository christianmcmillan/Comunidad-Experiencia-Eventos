import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Music2, MessageSquare, AlignLeft, Film,
  Copy, Trash2, Search, X
} from 'lucide-react'
import useSongsStore from '../../store/useSongsStore'
import usePlansStore from '../../store/usePlansStore'
import { fmtDuration, fmtClockTime } from './OrderBuilder'

const MUSICAL_KEYS = [
  'C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B',
  'Cm','Dbm','Dm','Ebm','Em','Fm','F#m','Gm','Abm','Am','Bbm','Bm',
]

const SPOKEN_PRESETS = [
  'Bienvenida', 'Oración', 'Anuncios', 'Ofrenda', 'Mensaje / Predicación',
  'Llamado / Altar', 'Bendición Final', 'Conectar Grupos', 'Testimonio',
  'Presentación de Bebés', 'Bautismos',
]

function parseDuration(val) {
  if (!val) return 0
  const str = val.trim()
  if (str.includes(':')) {
    const [m, s] = str.split(':').map(Number)
    return (m || 0) * 60 + (s || 0)
  }
  return parseInt(str, 10) * 60 || 0
}

function fmtDurInput(secs) {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}`
}

const CFG = {
  header:  { icon: AlignLeft,     color: 'text-gray-400',    border: 'border-l-2 border-gray-300',    bg: 'bg-gray-50'  },
  song:    { icon: Music2,        color: 'text-indigo-500',  border: 'border-l-2 border-indigo-400',  bg: 'bg-white'    },
  spoken:  { icon: MessageSquare, color: 'text-emerald-500', border: 'border-l-2 border-emerald-400', bg: 'bg-white'    },
  media:   { icon: Film,          color: 'text-orange-500',  border: 'border-l-2 border-orange-400',  bg: 'bg-white'    },
}

export default function OrderItem({
  item, planId, startSeconds, baseMinutes, sectionTotal,
  onDelete, onDuplicate, isDragging,
}) {
  const { updateOrderItem } = usePlansStore()
  const { songs, getSong }  = useSongsStore()
  const song = item.songId ? getSong(item.songId) : null

  const [editTitle,      setEditTitle]      = useState(false)
  const [editDuration,   setEditDuration]   = useState(false)
  const [titleVal,       setTitleVal]       = useState(item.title || '')
  const [durVal,         setDurVal]         = useState(fmtDurInput(item.duration))
  const [songSearch,     setSongSearch]     = useState('')
  const [showSongPicker, setShowSongPicker] = useState(false)
  const [showKeyPicker,  setShowKeyPicker]  = useState(false)
  const [hovered,        setHovered]        = useState(false)

  const titleRef    = useRef()
  const durRef      = useRef()
  const songRef     = useRef()

  // Auto-open on new blank items
  useEffect(() => {
    if (!item.title) {
      if (item.type === 'song') setShowSongPicker(true)
      else setEditTitle(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep local state in sync when store updates from outside
  useEffect(() => { setTitleVal(item.title || '') }, [item.title])
  useEffect(() => { setDurVal(fmtDurInput(item.duration)) }, [item.duration])

  // Auto-focus inputs when they open
  useEffect(() => { if (editTitle)      titleRef.current?.focus() }, [editTitle])
  useEffect(() => { if (editDuration)   durRef.current?.select()  }, [editDuration])
  useEffect(() => { if (showSongPicker) songRef.current?.focus()  }, [showSongPicker])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({
    id: item.id,
    disabled: isDragging,
  })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortDragging ? 0.4 : 1 }
  const cfg   = CFG[item.type] || CFG.song
  const Icon  = cfg.icon

  function saveTitle() {
    const v = item.type === 'header' ? titleVal.trim().toUpperCase() : titleVal.trim()
    if (v) updateOrderItem(planId, item.id, { title: v })
    setEditTitle(false)
  }

  function saveDuration() {
    updateOrderItem(planId, item.id, { duration: parseDuration(durVal) })
    setEditDuration(false)
  }

  function selectSong(s) {
    updateOrderItem(planId, item.id, {
      songId: s.id,
      title: s.title,
      duration: item.duration || 240,
    })
    setShowSongPicker(false)
    setSongSearch('')
  }

  function clearSong() {
    updateOrderItem(planId, item.id, { songId: '', title: '' })
    setShowSongPicker(true)
  }

  function selectKey(k) {
    updateOrderItem(planId, item.id, { key: k })
    setShowKeyPicker(false)
  }

  function onTitleKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); saveTitle() }
    if (e.key === 'Escape') { setTitleVal(item.title || ''); setEditTitle(false) }
  }

  function onDurKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); saveDuration() }
    if (e.key === 'Escape') { setDurVal(fmtDurInput(item.duration)); setEditDuration(false) }
  }

  const filteredSongs = songs.filter((s) => {
    if (!songSearch.trim()) return true
    const q = songSearch.toLowerCase()
    return s.title.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)
  }).slice(0, 15)

  const clockTime = fmtClockTime(baseMinutes, startSeconds || 0)

  // ── HEADER ──────────────────────────────────────────────────────────────────
  if (item.type === 'header') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 py-1.5 group ${isSortDragging ? 'opacity-40' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button {...attributes} {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={14} />
        </button>

        <div className="flex-1 h-px bg-gray-200" />

        {editTitle ? (
          <input
            ref={titleRef}
            value={titleVal}
            onChange={e => setTitleVal(e.target.value.toUpperCase())}
            onBlur={saveTitle}
            onKeyDown={onTitleKey}
            className="text-xs font-bold uppercase tracking-widest text-gray-600 bg-transparent border-b border-indigo-400 outline-none px-2 text-center w-44"
          />
        ) : (
          <button
            onClick={() => { setTitleVal(item.title || ''); setEditTitle(true) }}
            className="text-xs font-bold uppercase tracking-widest text-gray-500 px-2 hover:text-indigo-600 transition-colors"
          >
            {item.title || 'SECCIÓN'}
          </button>
        )}

        <div className="flex-1 h-px bg-gray-200" />

        {sectionTotal > 0 && (
          <span className="text-xs text-gray-300 tabular-nums">{fmtDuration(sectionTotal)}</span>
        )}

        {hovered && !isDragging && (
          <div className="flex items-center gap-0.5 ml-1">
            <button onClick={onDuplicate} className="p-1 text-gray-300 hover:text-gray-500 transition-colors"><Copy size={12} /></button>
            <button onClick={onDelete}    className="p-1 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
          </div>
        )}
      </div>
    )
  }

  // ── SONG / SPOKEN / MEDIA ────────────────────────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-lg border border-gray-100 shadow-sm ${cfg.bg} ${cfg.border} group transition-shadow ${isSortDragging ? 'shadow-lg' : 'hover:shadow-sm'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <button {...attributes} {...listeners}
        className="p-3 text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing self-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <GripVertical size={14} />
      </button>

      {/* Type icon */}
      <div className="pt-3 pr-1 flex-shrink-0">
        <Icon size={15} className={cfg.color} />
      </div>

      {/* Content */}
      <div className="flex-1 py-2.5 min-w-0">

        {/* ── SONG PICKER (inline) ── */}
        {item.type === 'song' && (showSongPicker || !item.songId) ? (
          <div className="pr-2">
            <div className="relative mb-1">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={songRef}
                type="text"
                value={songSearch}
                onChange={e => setSongSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape' && item.songId) setShowSongPicker(false)
                }}
                placeholder="Buscar canción..."
                className="w-full pl-7 pr-7 py-1.5 text-sm border border-indigo-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              {item.songId && (
                <button
                  onClick={() => setShowSongPicker(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto bg-white shadow-sm">
              {filteredSongs.map(s => (
                <button
                  key={s.id}
                  onClick={() => selectSong(s)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-50 text-left border-b border-gray-100 last:border-0"
                >
                  <Music2 size={12} className="text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.artist}{s.bpm ? ` • ${s.bpm} BPM` : ''}</p>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {s.keys?.slice(0, 2).map(k => (
                      <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded">{k}</span>
                    ))}
                  </div>
                </button>
              ))}
              {filteredSongs.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">Sin resultados</p>
              )}
            </div>
          </div>
        ) : (
          /* ── TITLE ROW ── */
          <div className="flex items-baseline gap-2 flex-wrap">
            {editTitle ? (
              <>
                <input
                  ref={titleRef}
                  value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={onTitleKey}
                  className="text-sm font-semibold text-gray-800 border-b border-indigo-400 outline-none bg-transparent flex-1 min-w-0"
                />
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (item.type === 'song') { setShowSongPicker(true) }
                    else { setTitleVal(item.title || ''); setEditTitle(true) }
                  }}
                  className="text-sm font-semibold text-gray-800 hover:text-indigo-700 transition-colors text-left"
                >
                  {item.title || <span className="text-gray-300 italic text-xs">Sin título</span>}
                </button>
                {item.type === 'song' && song && (
                  <span className="text-xs text-gray-400 truncate">{song.artist}</span>
                )}
              </>
            )}
          </div>
        )}

        {/* Spoken presets (shown while editing title) */}
        {item.type === 'spoken' && editTitle && (
          <div className="flex flex-wrap gap-1 mt-2">
            {SPOKEN_PRESETS.map(p => (
              <button
                key={p}
                onMouseDown={e => { e.preventDefault(); setTitleVal(p) }}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  titleVal === p
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Song key + BPM row */}
        {item.type === 'song' && item.songId && !showSongPicker && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {showKeyPicker ? (
              <div className="flex flex-wrap gap-0.5 my-0.5">
                {MUSICAL_KEYS.map(k => (
                  <button
                    key={k}
                    onClick={() => selectKey(k)}
                    className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${
                      item.key === k
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                <button onClick={() => setShowKeyPicker(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1 ml-0.5">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setShowKeyPicker(true)}
                className={`text-xs px-1.5 py-0.5 rounded font-medium transition-colors ${
                  item.key
                    ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    : 'text-gray-300 border border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-500'
                }`}
              >
                {item.key || '+ clave'}
              </button>
            )}
            {song?.bpm && <span className="text-xs text-gray-400">{song.bpm} BPM</span>}
          </div>
        )}

        {/* Notes & description */}
        {item.notes && !editTitle && (
          <p className="text-xs text-amber-600 italic mt-0.5 truncate">"{item.notes}"</p>
        )}
        {item.description && !editTitle && item.type !== 'song' && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
        )}
      </div>

      {/* Duration + clock time */}
      <div className="py-3 pr-1 flex flex-col items-end gap-0.5 flex-shrink-0 min-w-[56px]">
        {editDuration ? (
          <input
            ref={durRef}
            value={durVal}
            onChange={e => setDurVal(e.target.value)}
            onBlur={saveDuration}
            onKeyDown={onDurKey}
            className="text-xs font-medium text-gray-700 border-b border-indigo-400 outline-none bg-transparent w-14 text-right"
            placeholder="5:00"
          />
        ) : (
          <button
            onClick={() => setEditDuration(true)}
            className={`text-xs font-medium tabular-nums text-right transition-colors ${
              item.duration > 0 ? 'text-gray-600 hover:text-indigo-600' : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            {item.duration > 0 ? fmtDuration(item.duration) : '—'}
          </button>
        )}
        {clockTime && startSeconds !== undefined && (
          <span className="text-xs text-gray-300 tabular-nums">{clockTime}</span>
        )}
      </div>

      {/* Actions on hover */}
      {hovered && !isDragging && !showSongPicker && !showKeyPicker && (
        <div className="py-2 pr-2 flex items-center gap-0.5 self-center flex-shrink-0">
          <button onClick={onDuplicate} className="p-1.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <Copy size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
