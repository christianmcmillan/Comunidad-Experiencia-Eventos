import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Music2, TrendingUp, List } from 'lucide-react'
import useSongsStore from '../../store/useSongsStore'
import usePlansStore from '../../store/usePlansStore'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'

export default function SongsPage() {
  const navigate  = useNavigate()
  const { songs, addSong } = useSongsStore()
  const { plans } = usePlansStore()

  const [search,    setSearch]    = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [view,      setView]      = useState('all')   // 'all' | 'top'
  const [addOpen,   setAddOpen]   = useState(false)
  const [form,      setForm]      = useState({ title: '', artist: '', bpm: '', keys: '', ccli: '' })

  // Compute usage count per song
  const usageMap = useMemo(() => {
    const map = {}
    for (const plan of plans) {
      for (const item of (plan.order || [])) {
        if (item.songId) map[item.songId] = (map[item.songId] || 0) + 1
      }
    }
    return map
  }, [plans])

  // All unique tags across songs
  const allTags = useMemo(() => {
    const set = new Set()
    songs.forEach(s => (s.themes || []).forEach(t => set.add(t)))
    return [...set].sort()
  }, [songs])

  const filtered = useMemo(() => {
    let list = songs.filter(s => {
      const matchSearch = !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.artist?.toLowerCase().includes(search.toLowerCase())
      const matchTag = !activeTag || (s.themes || []).includes(activeTag)
      return matchSearch && matchTag
    })
    if (view === 'top') {
      list = list.filter(s => usageMap[s.id] > 0)
      list.sort((a, b) => (usageMap[b.id] || 0) - (usageMap[a.id] || 0))
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title))
    }
    return list
  }, [songs, search, activeTag, view, usageMap])

  function handleAdd() {
    if (!form.title.trim()) return
    addSong({
      ...form,
      bpm: form.bpm ? Number(form.bpm) : null,
      keys: form.keys ? form.keys.split(',').map(k => k.trim()).filter(Boolean) : [],
      themes: [],
    })
    setAddOpen(false)
    setForm({ title: '', artist: '', bpm: '', keys: '', ccli: '' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900 mr-auto">
          Canciones <span className="text-sm text-gray-400 font-normal">({songs.length})</span>
        </h1>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => setView('all')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
              view === 'all' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={12} /> Todas
          </button>
          <button
            onClick={() => setView('top')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
              view === 'top' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp size={12} /> Top
          </button>
        </div>

        <div className="relative flex-1 min-w-[120px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
          />
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="flex-shrink-0">
          <Plus size={14} /> Agregar
        </Button>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="px-6 py-2 bg-white border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-gray-400 flex-shrink-0">Filtrar:</span>
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 transition-colors ${
              !activeTag ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            Todas
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`text-xs px-2.5 py-1 rounded-full border flex-shrink-0 transition-colors ${
                activeTag === tag ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Song list */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <EmptyState icon={Music2} title="Sin canciones" description="Agrega canciones al repertorio." />
        ) : (
          <>
          {/* Mobile card list */}
          <div className="md:hidden bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 mb-4">
            {filtered.map((song, idx) => (
              <div
                key={song.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/canciones/${song.id}`)}
              >
                {view === 'top' && (
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}</span>
                )}
                <Music2 size={14} className="text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{song.title}</p>
                  {song.artist && <p className="text-xs text-gray-400 truncate">{song.artist}</p>}
                </div>
                {song.bpm && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">{song.bpm} BPM</span>
                )}
                {view === 'top' && (
                  <span className="text-xs font-semibold text-indigo-600 flex-shrink-0">{usageMap[song.id] || 0}x</span>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block max-w-4xl">
            <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Título</th>
                  <th className="text-left px-4 py-3 font-medium">Artista</th>
                  <th className="text-left px-4 py-3 font-medium">BPM</th>
                  <th className="text-left px-4 py-3 font-medium">Tonalidades</th>
                  <th className="text-left px-4 py-3 font-medium">Etiquetas</th>
                  {view === 'top' && <th className="text-left px-4 py-3 font-medium">Usos</th>}
                  <th className="text-left px-4 py-3 font-medium">Último uso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((song, idx) => (
                  <tr
                    key={song.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/canciones/${song.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {view === 'top' && (
                          <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}</span>
                        )}
                        <Music2 size={13} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{song.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{song.artist}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{song.bpm || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(song.keys || []).slice(0, 3).map(k => (
                          <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{k}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(song.themes || []).slice(0, 2).map(t => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </td>
                    {view === 'top' && (
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-indigo-600">{usageMap[song.id] || 0}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-gray-400">{song.lastScheduled || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Agregar Canción">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Artista</label>
            <input type="text" value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">BPM</label>
              <input type="number" value={form.bpm} onChange={e => setForm(f => ({ ...f, bpm: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tonalidades</label>
              <input type="text" value={form.keys} onChange={e => setForm(f => ({ ...f, keys: e.target.value }))} placeholder="A, G, C"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CCLI #</label>
              <input type="text" value={form.ccli} onChange={e => setForm(f => ({ ...f, ccli: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Agregar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
