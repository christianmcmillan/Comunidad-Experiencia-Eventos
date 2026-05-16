import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Music2, MessageSquare, Film, AlignLeft,
  Copy, Trash2, Search, X, Paperclip, Link2, FileText, ExternalLink,
  ChevronsLeft,
} from 'lucide-react'
import useSongsStore from '../../store/useSongsStore'
import usePlansStore from '../../store/usePlansStore'
import { fmtDuration, fmtClockTime } from './OrderBuilder'

const MUSICAL_KEYS = [
  'C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B',
  'Cm','Dbm','Dm','Ebm','Em','Fm','F#m','Gm','Abm','Am','Bbm','Bm',
]

const SPOKEN_PRESETS = [
  'Bienvenida','Oración','Anuncios','Ofrenda','Mensaje / Predicación',
  'Llamado / Altar','Bendición Final','Conectar Grupos','Testimonio',
  'Presentación de Bebés','Bautismos',
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

const TYPE_CFG = {
  header:  { icon: AlignLeft,     color: 'text-gray-400'    },
  section: { icon: AlignLeft,     color: 'text-gray-400'    },
  song:    { icon: Music2,        color: 'text-indigo-400'  },
  spoken:  { icon: MessageSquare, color: 'text-emerald-500' },
  media:   { icon: Film,          color: 'text-orange-400'  },
}

const isSection = (type) => type === 'header' || type === 'section'

export default function OrderItem({
  item, planId, startSeconds, baseMinutes, sectionTotal,
  onDelete, onDuplicate, isDragging,
}) {
  const { updateOrderItem, addAttachment, removeAttachment } = usePlansStore()
  const { songs, getSong } = useSongsStore()
  const song = item.songId ? getSong(item.songId) : null

  const [editTitle,       setEditTitle]       = useState(false)
  const [editDuration,    setEditDuration]    = useState(false)
  const [editDescription, setEditDescription] = useState(false)
  const [titleVal,        setTitleVal]        = useState(item.title || '')
  const [durVal,          setDurVal]          = useState(fmtDurInput(item.duration))
  const [descVal,         setDescVal]         = useState(item.description || '')
  const [songSearch,      setSongSearch]      = useState('')
  const [showSongPicker,  setShowSongPicker]  = useState(false)
  const [showKeyPicker,   setShowKeyPicker]   = useState(false)
  const [hovered,         setHovered]         = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [attUrl,          setAttUrl]          = useState('')
  const [attName,         setAttName]         = useState('')

  const titleRef = useRef()
  const durRef   = useRef()
  const songRef  = useRef()
  const descRef  = useRef()

  useEffect(() => {
    if (!item.title) {
      if (item.type === 'song') setShowSongPicker(true)
      else setEditTitle(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setTitleVal(item.title || '') }, [item.title])
  useEffect(() => { setDurVal(fmtDurInput(item.duration)) }, [item.duration])
  useEffect(() => { setDescVal(item.description || '') }, [item.description])
  useEffect(() => { if (editTitle)       titleRef.current?.focus() }, [editTitle])
  useEffect(() => { if (editDuration)    durRef.current?.select()  }, [editDuration])
  useEffect(() => { if (showSongPicker)  songRef.current?.focus()  }, [showSongPicker])
  useEffect(() => { if (editDescription) descRef.current?.focus()  }, [editDescription])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({
    id: item.id, disabled: isDragging,
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortDragging ? 0.4 : 1 }

  const cfg  = TYPE_CFG[item.type] || TYPE_CFG.song
  const Icon = cfg.icon

  function saveTitle() {
    const v = isSection(item.type) ? titleVal.trim().toUpperCase() : titleVal.trim()
    if (v) updateOrderItem(planId, item.id, { title: v })
    setEditTitle(false)
  }
  function saveDuration() {
    updateOrderItem(planId, item.id, { duration: parseDuration(durVal) })
    setEditDuration(false)
  }
  function saveDescription() {
    updateOrderItem(planId, item.id, { description: descVal.trim() })
    setEditDescription(false)
  }
  function selectSong(s) {
    updateOrderItem(planId, item.id, { songId: s.id, title: s.title, duration: item.duration || 240 })
    setShowSongPicker(false); setSongSearch('')
  }
  function selectKey(k) {
    updateOrderItem(planId, item.id, { key: k }); setShowKeyPicker(false)
  }
  function onTitleKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); saveTitle() }
    if (e.key === 'Escape') { setTitleVal(item.title || ''); setEditTitle(false) }
  }
  function onDurKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); saveDuration() }
    if (e.key === 'Escape') { setDurVal(fmtDurInput(item.duration)); setEditDuration(false) }
  }

  const filteredSongs = songs.filter(s => {
    if (!songSearch.trim()) return true
    const q = songSearch.toLowerCase()
    return s.title.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)
  }).slice(0, 15)

  const clockTime = fmtClockTime(baseMinutes, startSeconds || 0)
  const attCount  = (item.attachments || []).length

  // ── SECTION / HEADER ─────────────────────────────────────────────────────────
  if (isSection(item.type)) {
    return (
      <div
        ref={setNodeRef} style={style}
        className="flex items-center bg-gray-50 border-b border-t border-gray-200 group py-1.5"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button {...attributes} {...listeners}
          className="w-7 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <GripVertical size={13} />
        </button>
        <div className="w-[52px] flex-shrink-0" />
        <div className="w-[52px] flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {editTitle ? (
            <input ref={titleRef} value={titleVal}
              onChange={e => setTitleVal(e.target.value.toUpperCase())}
              onBlur={saveTitle} onKeyDown={onTitleKey}
              className="text-xs font-bold uppercase tracking-wider text-gray-600 bg-transparent border-b border-indigo-400 outline-none w-full" />
          ) : (
            <button onClick={() => { setTitleVal(item.title || ''); setEditTitle(true) }}
              className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-indigo-600 transition-colors">
              {item.title || 'SECCIÓN'}
            </button>
          )}
        </div>

        {sectionTotal > 0 && (
          <span className="text-xs text-gray-400 tabular-nums mr-2">{fmtDuration(sectionTotal)}</span>
        )}

        {/* Before-service toggle */}
        {(hovered || item.beforeService) && !isDragging && (
          <button
            onClick={() => updateOrderItem(planId, item.id, { beforeService: !item.beforeService })}
            title={item.beforeService ? 'Quitar "antes del servicio"' : 'Marcar como antes del servicio'}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs mr-1 transition-colors flex-shrink-0 ${
              item.beforeService
                ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                : 'text-gray-300 hover:text-indigo-400 hover:bg-indigo-50'
            }`}
          >
            <ChevronsLeft size={12} />
            {item.beforeService && <span className="font-medium">ANTES</span>}
          </button>
        )}

        {hovered && !isDragging && (
          <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
            <button onClick={onDuplicate} className="p-1 text-gray-300 hover:text-gray-500"><Copy size={12} /></button>
            <button onClick={onDelete}    className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
          </div>
        )}
      </div>
    )
  }

  // ── SONG / SPOKEN / MEDIA ────────────────────────────────────────────────────

  return (
    <div
      ref={setNodeRef} style={style}
      className={`flex items-start border-b border-gray-100 transition-colors ${isSortDragging ? 'opacity-40 bg-blue-50' : 'hover:bg-gray-50/70'} group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Drag handle */}
      <button {...attributes} {...listeners}
        className="w-7 pt-3 flex items-start justify-center text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <GripVertical size={13} />
      </button>

      {/* Time column */}
      <div className="w-[52px] flex-shrink-0 pt-3 text-right pr-3">
        {clockTime && startSeconds !== undefined && (
          <span className="text-xs text-gray-400 tabular-nums">{clockTime}</span>
        )}
      </div>

      {/* Duration column */}
      <div className="w-[52px] flex-shrink-0 pt-3 text-right pr-4">
        {editDuration ? (
          <input ref={durRef} value={durVal}
            onChange={e => setDurVal(e.target.value)}
            onBlur={saveDuration} onKeyDown={onDurKey}
            className="text-xs font-medium text-gray-700 border-b border-indigo-400 outline-none bg-transparent w-full text-right"
            placeholder="5:00" />
        ) : (
          <button onClick={() => setEditDuration(true)}
            className={`text-xs tabular-nums transition-colors hover:text-indigo-600 ${item.duration > 0 ? 'text-gray-500' : 'text-gray-300'}`}>
            {item.duration > 0 ? fmtDuration(item.duration) : '—'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 py-2.5 min-w-0">
        {/* Song picker */}
        {item.type === 'song' && (showSongPicker || !item.songId) ? (
          <div className="pr-3">
            <div className="relative mb-1">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={songRef} type="text" value={songSearch}
                onChange={e => setSongSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape' && item.songId) setShowSongPicker(false) }}
                placeholder="Buscar canción..."
                className="w-full pl-7 pr-7 py-1.5 text-sm border border-indigo-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white" />
              {item.songId && (
                <button onClick={() => setShowSongPicker(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto bg-white shadow-sm">
              {filteredSongs.map(s => (
                <button key={s.id} onClick={() => selectSong(s)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-50 text-left border-b border-gray-100 last:border-0">
                  <Music2 size={12} className="text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{s.title}</p>
                    <p className="text-xs text-gray-400">{s.artist}{s.bpm ? ` · ${s.bpm} BPM` : ''}</p>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {s.keys?.slice(0, 2).map(k => (
                      <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded">{k}</span>
                    ))}
                  </div>
                </button>
              ))}
              {filteredSongs.length === 0 && <p className="text-xs text-gray-400 text-center py-3">Sin resultados</p>}
            </div>
          </div>
        ) : (
          <>
            {/* Title + key */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Icon size={12} className={`${cfg.color} flex-shrink-0`} />

              {editTitle ? (
                <input ref={titleRef} value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={saveTitle} onKeyDown={onTitleKey}
                  className="text-sm font-medium text-gray-800 border-b border-indigo-400 outline-none bg-transparent flex-1 min-w-0" />
              ) : (
                <button
                  onClick={() => {
                    if (item.type === 'song') setShowSongPicker(true)
                    else { setTitleVal(item.title || ''); setEditTitle(true) }
                  }}
                  className="text-sm font-medium text-gray-800 hover:text-indigo-700 transition-colors text-left">
                  {item.title || <span className="text-gray-300 italic text-xs">Sin título</span>}
                </button>
              )}

              {/* Key badge */}
              {item.type === 'song' && item.songId && !showSongPicker && !editTitle && (
                showKeyPicker ? (
                  <div className="flex flex-wrap gap-0.5 mt-1 w-full">
                    {MUSICAL_KEYS.map(k => (
                      <button key={k} onClick={() => selectKey(k)}
                        className={`px-1.5 py-0.5 text-xs rounded border transition-colors ${item.key === k ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                        {k}
                      </button>
                    ))}
                    <button onClick={() => setShowKeyPicker(false)} className="text-xs text-gray-400 px-1">✕</button>
                  </div>
                ) : (
                  <button onClick={() => setShowKeyPicker(true)}
                    className={`text-xs px-1.5 py-0.5 rounded font-semibold transition-colors flex-shrink-0 ${
                      item.key
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        : 'text-gray-300 border border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-500'
                    }`}>
                    {item.key || '+'}
                  </button>
                )
              )}
            </div>

            {/* Spoken presets */}
            {item.type === 'spoken' && editTitle && (
              <div className="flex flex-wrap gap-1 mt-2 ml-4">
                {SPOKEN_PRESETS.map(p => (
                  <button key={p} onMouseDown={e => { e.preventDefault(); setTitleVal(p) }}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${titleVal === p ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Artist (from song library) */}
            {item.type === 'song' && song?.artist && !editTitle && (
              <p className="text-xs text-gray-400 mt-0.5 ml-[18px] truncate">{song.artist}</p>
            )}

            {/* Editable description (singers / who is speaking) */}
            {!editTitle && !showSongPicker && (
              editDescription ? (
                <input
                  ref={descRef}
                  value={descVal}
                  onChange={e => setDescVal(e.target.value)}
                  onBlur={saveDescription}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  { e.preventDefault(); saveDescription() }
                    if (e.key === 'Escape') { setDescVal(item.description || ''); setEditDescription(false) }
                  }}
                  placeholder={item.type === 'song' ? 'Ej: Juan & María...' : 'Descripción...'}
                  className="text-xs text-gray-500 border-b border-indigo-300 outline-none bg-transparent ml-[18px] mt-0.5 w-48"
                />
              ) : item.description ? (
                <button
                  onClick={() => { setDescVal(item.description || ''); setEditDescription(true) }}
                  className="block text-xs text-gray-400 mt-0.5 ml-[18px] hover:text-indigo-500 transition-colors text-left"
                >
                  {item.description}
                </button>
              ) : hovered ? (
                <button
                  onClick={() => { setDescVal(''); setEditDescription(true) }}
                  className="block text-xs text-gray-300 hover:text-gray-400 mt-0.5 ml-[18px] transition-colors"
                >
                  {item.type === 'song' ? '+ cantante' : '+ descripción'}
                </button>
              ) : null
            )}

            {/* Notes — multi-line */}
            {item.notes && !editTitle && (
              <p className="text-xs text-gray-500 mt-0.5 ml-4 whitespace-pre-line leading-relaxed">{item.notes}</p>
            )}
          </>
        )}

        {/* Attachments panel */}
        {showAttachments && (
          <div className="mt-2 border-t border-gray-100 pt-2 pr-3 ml-4">
            {attCount > 0 && (
              <div className="space-y-1 mb-2">
                {(item.attachments || []).map(att => (
                  <div key={att.id} className="flex items-center gap-1.5 group/att">
                    {att.type === 'file'
                      ? <FileText size={11} className="text-gray-400 flex-shrink-0" />
                      : <Link2   size={11} className="text-indigo-400 flex-shrink-0" />}
                    <span className="text-xs text-gray-600 truncate flex-1">{att.name}</span>
                    {att.url && att.type !== 'file' && (
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-indigo-500">
                        <ExternalLink size={10} />
                      </a>
                    )}
                    <button onClick={() => removeAttachment(planId, item.id, att.id)}
                      className="opacity-0 group-hover/att:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1">
              <input type="text" value={attUrl} onChange={e => setAttUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && attUrl.trim()) {
                    addAttachment(planId, item.id, { name: attName.trim() || attUrl.trim(), url: attUrl.trim(), type: 'link' })
                    setAttUrl(''); setAttName('')
                  }
                }}
                placeholder="Pegar URL…"
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              <input type="text" value={attName} onChange={e => setAttName(e.target.value)} placeholder="Nombre"
                className="w-20 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
              <button onClick={() => {
                if (attUrl.trim()) {
                  addAttachment(planId, item.id, { name: attName.trim() || attUrl.trim(), url: attUrl.trim(), type: 'link' })
                  setAttUrl(''); setAttName('')
                }
              }} className="text-xs text-indigo-500 hover:text-indigo-700 px-1.5 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors">
                + URL
              </button>
              <label className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                + Archivo
                <input type="file" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  if (file.size > 500 * 1024) { alert('Archivo muy grande (máx 500 KB). Usa un enlace URL.'); return }
                  const reader = new FileReader()
                  reader.onload = ev => addAttachment(planId, item.id, { name: file.name, url: ev.target.result, type: 'file' })
                  reader.readAsDataURL(file); e.target.value = ''
                }} />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Attachment badge (when panel is closed) */}
      {attCount > 0 && !showAttachments && (
        <button onClick={() => setShowAttachments(true)}
          className="self-center flex items-center gap-0.5 text-xs text-gray-400 hover:text-indigo-500 pr-1 pt-0.5 flex-shrink-0">
          <Paperclip size={10} />
          <span>{attCount}</span>
        </button>
      )}

      {/* Hover actions */}
      {hovered && !isDragging && !showSongPicker && (
        <div className="self-center flex items-center gap-0.5 pr-2 py-2 flex-shrink-0">
          <button onClick={() => setShowAttachments(v => !v)}
            className={`p-1.5 rounded transition-colors ${showAttachments ? 'text-indigo-500 bg-indigo-50' : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
            title="Adjuntos">
            <Paperclip size={12} />
          </button>
          <button onClick={onDuplicate} className="p-1.5 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <Copy size={12} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
