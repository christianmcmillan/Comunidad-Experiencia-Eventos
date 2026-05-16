import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Music2 } from 'lucide-react'
import useSongsStore from '../../store/useSongsStore'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'

export default function SongsPage() {
  const navigate = useNavigate()
  const { songs, addSong } = useSongsStore()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ title: '', artist: '', bpm: '', keys: '' })

  const filtered = songs.filter((s) =>
    !search ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.artist?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title))

  function handleAdd() {
    if (!form.title.trim()) return
    addSong({
      ...form,
      bpm: form.bpm ? Number(form.bpm) : null,
      keys: form.keys ? form.keys.split(',').map((k) => k.trim()) : [],
      themes: [],
    })
    setAddOpen(false)
    setForm({ title: '', artist: '', bpm: '', keys: '' })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">
          Canciones <span className="text-sm text-gray-400 font-normal">({songs.length})</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar canciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
            />
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Agregar canción
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <EmptyState icon={Music2} title="Sin canciones" description="Agrega canciones al repertorio." />
        ) : (
          <div className="max-w-4xl">
            <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Título</th>
                  <th className="text-left px-4 py-3 font-medium">Artista</th>
                  <th className="text-left px-4 py-3 font-medium">BPM</th>
                  <th className="text-left px-4 py-3 font-medium">Tonalidades</th>
                  <th className="text-left px-4 py-3 font-medium">Último uso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((song) => (
                  <tr
                    key={song.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/canciones/${song.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Music2 size={13} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{song.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{song.artist}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{song.bpm || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(song.keys || []).slice(0, 4).map((k) => (
                          <span key={k} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{k}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{song.lastScheduled || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Agregar Canción">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Artista</label>
            <input type="text" value={form.artist} onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">BPM</label>
              <input type="number" value={form.bpm} onChange={(e) => setForm((f) => ({ ...f, bpm: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tonalidades <span className="text-gray-400">(ej: A, C, G)</span></label>
              <input type="text" value={form.keys} onChange={(e) => setForm((f) => ({ ...f, keys: e.target.value }))} placeholder="A, C, G"
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
