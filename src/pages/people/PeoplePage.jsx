import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, UserCircle } from 'lucide-react'
import usePeopleStore from '../../store/usePeopleStore'
import useTeamsStore from '../../store/useTeamsStore'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'

const ROLE_COLORS = {
  administrator: 'indigo',
  editor: 'blue',
  scheduled_viewer: 'green',
  viewer: 'gray',
}

const ROLE_LABELS = {
  administrator: 'Administrador',
  editor: 'Editor',
  scheduled_viewer: 'Voluntario',
  viewer: 'Visitante',
}

export default function PeoplePage() {
  const navigate = useNavigate()
  const { people, addPerson } = usePeopleStore()
  const { teams } = useTeamsStore()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'scheduled_viewer' })

  const filtered = people.filter((p) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase()
    return !search || name.includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  })

  function handleAdd() {
    if (!form.firstName.trim()) return
    addPerson(form)
    setAddOpen(false)
    setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'scheduled_viewer' })
  }

  function getTeamNames(teamIds = []) {
    return teamIds.map((tid) => teams.find((t) => t.id === tid)?.name).filter(Boolean)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900 mr-auto">Personas <span className="text-sm text-gray-400 font-normal">({people.length})</span></h1>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar personas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-44"
          />
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} /> + Agregar<span className="hidden sm:inline"> persona</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <EmptyState icon={UserCircle} title="Sin personas" description="Agrega personas al equipo." />
        ) : (
          <>
          {/* Mobile list */}
          <div className="md:hidden bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 mb-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/personas/${p.id}`)}
              >
                <Avatar firstName={p.firstName} lastName={p.lastName} size="sm" />
                <span className="flex-1 text-sm font-medium text-gray-800 min-w-0 truncate">{p.firstName} {p.lastName}</span>
                <Badge color={ROLE_COLORS[p.role] || 'gray'} size="xs">
                  {ROLE_LABELS[p.role] || p.role}
                </Badge>
              </div>
            ))}
          </div>

          <div className="hidden md:block max-w-4xl">
            <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Equipos</th>
                  <th className="text-left px-4 py-3 font-medium">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const teamNames = getTeamNames(p.teamIds)
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/personas/${p.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar firstName={p.firstName} lastName={p.lastName} size="sm" />
                          <span className="text-sm font-medium text-gray-800">{p.firstName} {p.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {teamNames.slice(0, 2).map((name) => (
                            <span key={name} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{name}</span>
                          ))}
                          {teamNames.length > 2 && <span className="text-xs text-gray-400">+{teamNames.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={ROLE_COLORS[p.role] || 'gray'} size="xs">
                          {ROLE_LABELS[p.role] || p.role}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Add person modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Agregar Persona">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Apellido</label>
              <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
            <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
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
