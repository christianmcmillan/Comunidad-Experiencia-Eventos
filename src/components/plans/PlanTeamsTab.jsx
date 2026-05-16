import { useState } from 'react'
import { Users, Plus, X, Check, AlertCircle, ChevronDown } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import useTeamsStore from '../../store/useTeamsStore'
import usePeopleStore from '../../store/usePeopleStore'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  declined: { label: 'Declinó', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  needed: { label: 'Necesario', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
}

export default function PlanTeamsTab({ planId }) {
  const { getPlan, setAssignment, removeAssignment } = usePlansStore()
  const { teams } = useTeamsStore()
  const { people } = usePeopleStore()
  const plan = getPlan(planId)
  const [selectedTimeId, setSelectedTimeId] = useState(plan?.times?.[0]?.id || 'all')
  const [assigningPos, setAssigningPos] = useState(null) // { positionId, teamId }
  const [personSearch, setPersonSearch] = useState('')

  if (!plan) return null

  const serviceTimes = (plan.times || []).filter((t) => !t.isRehearsal)
  const allTimes = plan.times || []

  const currentTimes = selectedTimeId === 'all' ? allTimes : allTimes.filter((t) => t.id === selectedTimeId)

  function getAssignment(timeId, teamId, positionId) {
    return (plan.assignments || []).filter(
      (a) => a.timeId === timeId && a.teamId === teamId && a.positionId === positionId
    )
  }

  function getPerson(personId) {
    return people.find((p) => p.id === personId)
  }

  function getTeamForPlan() {
    return teams.filter((t) =>
      t.serviceTypeIds?.includes(plan.serviceTypeId)
    )
  }

  function handleAssign(timeId, teamId, positionId, personId) {
    setAssignment(planId, { timeId, teamId, positionId, personId, status: 'confirmed' })
    setAssigningPos(null)
    setPersonSearch('')
  }

  function handleRemoveAssignment(assignmentId) {
    removeAssignment(planId, assignmentId)
  }

  const planTeams = getTeamForPlan()

  const filteredPeople = people.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(personSearch.toLowerCase())
  )

  const assignKey = assigningPos ? `${assigningPos.timeId}-${assigningPos.teamId}-${assigningPos.positionId}` : ''

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: time selector */}
      <div className="w-44 border-r border-gray-200 bg-gray-50 p-3 overflow-y-auto flex-shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Horarios</p>
        <button
          onClick={() => setSelectedTimeId('all')}
          className={`w-full text-left px-2 py-1.5 rounded text-xs mb-1 transition-colors ${
            selectedTimeId === 'all' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {allTimes.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTimeId(t.id)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs mb-0.5 transition-colors ${
              selectedTimeId === t.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.isRehearsal && <span className="text-gray-400">[E] </span>}
            {t.name}
          </button>
        ))}
      </div>

      {/* Right: Teams and positions */}
      <div className="flex-1 overflow-y-auto p-4">
        {planTeams.length === 0 ? (
          <EmptyState icon={Users} title="Sin equipos asignados" description="Los equipos vinculados al tipo de servicio aparecerán aquí." />
        ) : (
          <div className="space-y-4">
            {planTeams.map((team) => (
              <div key={team.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="text-sm font-semibold text-gray-800">{team.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{team.category}</span>
                </div>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 text-gray-500 font-medium">Posición</th>
                      {currentTimes.map((t) => (
                        <th key={t.id} className="text-left px-3 py-2 text-gray-500 font-medium">
                          {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.positions.map((pos) => (
                      <tr key={pos.id} className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-700 font-medium">{pos.name}</td>
                        {currentTimes.map((t) => {
                          const assignments = getAssignment(t.id, team.id, pos.id)
                          const key = `${t.id}-${team.id}-${pos.id}`
                          const isAssigning = assignKey === key
                          return (
                            <td key={t.id} className="px-3 py-2">
                              <div className="space-y-1">
                                {assignments.map((a) => {
                                  const person = a.personId ? getPerson(a.personId) : null
                                  const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.needed
                                  return (
                                    <div key={a.id} className="flex items-center gap-1.5 group">
                                      {person ? (
                                        <>
                                          <Avatar firstName={person.firstName} lastName={person.lastName} size="xs" />
                                          <span className="text-gray-700">{person.firstName} {person.lastName}</span>
                                          <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} title={sc.label} />
                                          <button
                                            onClick={() => handleRemoveAssignment(a.id)}
                                            className="ml-auto text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X size={11} />
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-amber-500 flex items-center gap-1">
                                          <AlertCircle size={11} /> Necesario
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}

                                {/* Assign button */}
                                {isAssigning ? (
                                  <div className="mt-1">
                                    <input
                                      autoFocus
                                      type="text"
                                      value={personSearch}
                                      onChange={(e) => setPersonSearch(e.target.value)}
                                      placeholder="Buscar persona..."
                                      className="w-full border border-indigo-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <div className="bg-white border border-gray-200 rounded shadow-md max-h-40 overflow-y-auto mt-0.5">
                                      {filteredPeople.slice(0, 10).map((p) => (
                                        <button
                                          key={p.id}
                                          onClick={() => handleAssign(t.id, team.id, pos.id, p.id)}
                                          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-indigo-50 text-left"
                                        >
                                          <Avatar firstName={p.firstName} lastName={p.lastName} size="xs" />
                                          <span className="text-xs text-gray-700">{p.firstName} {p.lastName}</span>
                                        </button>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => { setAssigningPos(null); setPersonSearch('') }}
                                      className="text-xs text-gray-400 mt-1"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setAssigningPos({ timeId: t.id, teamId: team.id, positionId: pos.id }); setPersonSearch('') }}
                                    className="flex items-center gap-1 text-gray-300 hover:text-indigo-500 transition-colors mt-0.5"
                                  >
                                    <Plus size={11} /> <span>Asignar</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
