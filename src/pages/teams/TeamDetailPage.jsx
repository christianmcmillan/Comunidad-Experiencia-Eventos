import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2, Users } from 'lucide-react'
import useTeamsStore from '../../store/useTeamsStore'
import usePeopleStore from '../../store/usePeopleStore'
import useServiceTypesStore from '../../store/useServiceTypesStore'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

export default function TeamDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getTeam, updateTeam, addPosition, deletePosition } = useTeamsStore()
  const { people } = usePeopleStore()
  const { serviceTypes } = useServiceTypesStore()
  const team = getTeam(id)
  const [addingPos, setAddingPos] = useState(false)
  const [newPosName, setNewPosName] = useState('')
  const [newPosQty, setNewPosQty] = useState(1)

  if (!team) return (
    <div className="p-6 text-sm text-gray-500">
      Equipo no encontrado. <button className="text-indigo-600 hover:underline" onClick={() => navigate('/equipos')}>Volver</button>
    </div>
  )

  const members = people.filter((p) => p.teamIds?.includes(id))

  function handleAddPosition() {
    if (!newPosName.trim()) return
    addPosition(id, { name: newPosName.trim(), quantity: newPosQty })
    setNewPosName('')
    setNewPosQty(1)
    setAddingPos(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/equipos')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
          <h1 className="text-lg font-bold text-gray-900">{team.name}</h1>
          <Badge color="gray">{team.category}</Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {(team.serviceTypeIds || []).map((stId) => {
            const st = serviceTypes.find((s) => s.id === stId)
            return st ? (
              <span key={stId} className="text-xs text-gray-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                {st.name}
              </span>
            ) : null
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Positions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Posiciones</p>
              <Button size="sm" variant="ghost" onClick={() => setAddingPos(true)}>
                <Plus size={13} /> Agregar
              </Button>
            </div>

            {addingPos && (
              <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newPosName}
                  onChange={(e) => setNewPosName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPosition()}
                  placeholder="Nombre de la posición"
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newPosQty}
                  onChange={(e) => setNewPosQty(Number(e.target.value))}
                  className="w-16 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  title="Cantidad"
                />
                <Button size="sm" onClick={handleAddPosition}>OK</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingPos(false)}>✕</Button>
              </div>
            )}

            <div className="space-y-1">
              {(team.positions || []).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Sin posiciones. Agrega una arriba.</p>
              )}
              {(team.positions || []).map((pos) => (
                <div key={pos.id} className="flex items-center gap-2 py-2 px-2 rounded hover:bg-gray-50 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-700 flex-1">{pos.name}</span>
                  {pos.quantity > 1 && (
                    <span className="text-xs text-gray-400">×{pos.quantity}</span>
                  )}
                  <button
                    onClick={() => deletePosition(id, pos.id)}
                    className="text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Members */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Miembros ({members.length})</p>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No hay personas asignadas a este equipo.</p>
            ) : (
              <div className="space-y-2">
                {members.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/personas/${p.id}`)}
                  >
                    <Avatar firstName={p.firstName} lastName={p.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{p.firstName} {p.lastName}</p>
                    </div>
                    <span className="text-xs text-gray-400">{p.role === 'administrator' ? 'Admin' : p.role === 'editor' ? 'Editor' : 'Voluntario'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
