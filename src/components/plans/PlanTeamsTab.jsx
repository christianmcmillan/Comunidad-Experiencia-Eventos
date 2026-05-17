import { useState } from 'react'
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { Users, Plus, X, CalendarOff, UserCheck, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import usePlansStore from '../../store/usePlansStore'
import useTeamsStore from '../../store/useTeamsStore'
import usePeopleStore from '../../store/usePeopleStore'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'

// invited=gray, confirmed=green, declined=red, open=blue
const STATUS_CFG = {
  invited:   { label: 'Invitado',    dot: 'bg-gray-400',   text: 'text-gray-500'   },
  confirmed: { label: 'Confirmado',  dot: 'bg-green-500',  text: 'text-green-700'  },
  declined:  { label: 'Declinó',     dot: 'bg-red-500',    text: 'text-red-600'    },
  open:      { label: 'Abierto',     dot: 'bg-blue-400',   text: 'text-blue-600'   },
  needed:    { label: 'Necesario',   dot: 'bg-amber-400',  text: 'text-amber-600'  },
}

function hasBlockout(person, planDates) {
  if (!person?.blockoutDates?.length || !planDates?.length) return false
  return planDates.some(dateStr => {
    const d = parseISO(dateStr)
    return person.blockoutDates.some(b => {
      const start = startOfDay(parseISO(b.startDate))
      const end   = endOfDay(parseISO(b.endDate || b.startDate))
      return isWithinInterval(d, { start, end })
    })
  })
}

export default function PlanTeamsTab({ planId }) {
  const navigate = useNavigate()
  const { getPlan, setAssignment, removeAssignment, updateAssignmentStatus } = usePlansStore()
  const { teams } = useTeamsStore()
  const { people } = usePeopleStore()
  const plan = getPlan(planId)

  const [selectedTimeId, setSelectedTimeId] = useState(plan?.times?.[0]?.id || 'all')
  const [assigningPos,   setAssigningPos]   = useState(null)
  const [assignScope,    setAssignScope]    = useState('single')
  const [personSearch,   setPersonSearch]   = useState('')

  if (!plan) return null

  const allTimes          = plan.times || []
  const currentTimes      = selectedTimeId === 'all' ? allTimes : allTimes.filter(t => t.id === selectedTimeId)
  const planTeams         = teams.filter(t => t.serviceTypeIds?.includes(plan.serviceTypeId))
  const nonRehearsalTimes = allTimes.filter(t => !t.isRehearsal)
  const satTimes          = nonRehearsalTimes.filter(t => new Date(t.datetime).getDay() === 6)
  const sunTimes          = nonRehearsalTimes.filter(t => new Date(t.datetime).getDay() === 0)

  const scopeOptions = [
    { id: 'single',   label: 'Esta reunión' },
    ...(satTimes.length >= 2 ? [{ id: 'saturday', label: `Sábado ×${satTimes.length}` }] : []),
    ...(sunTimes.length >= 2 ? [{ id: 'sunday',   label: `Domingo ×${sunTimes.length}` }] : []),
    ...(nonRehearsalTimes.length >= 3 ? [{ id: 'all', label: `Las ${nonRehearsalTimes.length} reuniones` }] : []),
  ]

  function getTargetTimeIds(clickedTimeId) {
    if (assignScope === 'saturday') return satTimes.map(t => t.id)
    if (assignScope === 'sunday')   return sunTimes.map(t => t.id)
    if (assignScope === 'all')      return nonRehearsalTimes.map(t => t.id)
    return [clickedTimeId]
  }

  function closeAssigning() {
    setAssigningPos(null)
    setAssignScope('single')
    setPersonSearch('')
  }

  function getAssignments(timeId, teamId, positionId) {
    return (plan.assignments || []).filter(
      a => a.timeId === timeId && a.teamId === teamId && a.positionId === positionId
    )
  }

  function handleAssign(timeId, teamId, positionId, personId) {
    getTargetTimeIds(timeId).forEach(tid =>
      setAssignment(planId, { timeId: tid, teamId, positionId, personId, status: 'invited' })
    )
    closeAssigning()
  }

  function handleOpenSignup(timeId, teamId, positionId) {
    setAssignment(planId, { timeId, teamId, positionId, personId: null, status: 'open' })
  }

  const assignKey    = assigningPos ? `${assigningPos.timeId}-${assigningPos.teamId}-${assigningPos.positionId}` : ''
  const filteredPpl  = people.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(personSearch.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top time selector bar ── */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 bg-white px-4 py-2 flex-shrink-0 overflow-x-auto">
        <button
          onClick={() => setSelectedTimeId('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            selectedTimeId === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {allTimes.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTimeId(t.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedTimeId === t.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.isRehearsal && <span className="opacity-60">[E] </span>}
            {t.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 flex-shrink-0 pl-4 border-l border-gray-100">
          {Object.entries(STATUS_CFG).filter(([k]) => k !== 'needed').map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* Teams grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {planTeams.length === 0 ? (
          <EmptyState icon={Users} title="Sin equipos" description="Los equipos vinculados al tipo de servicio aparecerán aquí." />
        ) : (
          <div className="space-y-4">
            {planTeams.map(team => (
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
                      {currentTimes.map(t => (
                        <th key={t.id} className="text-left px-3 py-2 text-gray-500 font-medium">{t.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.positions.map(pos => (
                      <tr key={pos.id} className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-700 font-medium">{pos.name}</td>
                        {currentTimes.map(t => {
                          const assignments = getAssignments(t.id, team.id, pos.id)
                          const key = `${t.id}-${team.id}-${pos.id}`
                          const isAssigning = assignKey === key
                          return (
                            <td key={t.id} className="px-3 py-2 align-top">
                              <div className="space-y-1 min-w-[120px]">
                                {assignments.map(a => {
                                  const person = a.personId ? people.find(p => p.id === a.personId) : null
                                  const cfg    = STATUS_CFG[a.status] || STATUS_CFG.needed
                                  const blocked = person ? hasBlockout(person, plan.dates) : false

                                  if (a.status === 'open') {
                                    return (
                                      <div key={a.id} className="flex items-center gap-1 group">
                                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        <span className={`${cfg.text} font-medium`}>Abierto inscripción</span>
                                        <button
                                          onClick={() => navigate(`/eventos/${planId}/inscripcion`)}
                                          className="opacity-0 group-hover:opacity-100 text-blue-300 hover:text-blue-500 ml-1"
                                          title="Abrir página de inscripción"
                                        >
                                          <ExternalLink size={10} />
                                        </button>
                                        <button onClick={() => removeAssignment(planId, a.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400">
                                          <X size={10} />
                                        </button>
                                      </div>
                                    )
                                  }

                                  return (
                                    <div key={a.id} className="flex items-center gap-1.5 group">
                                      {person && <Avatar firstName={person.firstName} lastName={person.lastName} size="xs" />}
                                      <span className="text-gray-700 truncate max-w-[100px]">
                                        {person
                                          ? `${person.firstName} ${person.lastName}`
                                          : a.volunteerName
                                            ? <span className="text-gray-600 italic">{a.volunteerName}</span>
                                            : '—'
                                        }
                                      </span>
                                      {/* Blockout warning */}
                                      {blocked && (
                                        <CalendarOff size={10} className="text-amber-500 flex-shrink-0" title="Tiene fecha bloqueada" />
                                      )}
                                      {/* Status dot + cycle */}
                                      <button
                                        onClick={() => {
                                          const next = { invited: 'confirmed', confirmed: 'declined', declined: 'invited' }
                                          updateAssignmentStatus(planId, a.id, next[a.status] || 'invited')
                                        }}
                                        title={`Estado: ${cfg.label} — click para cambiar`}
                                        className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0 hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-all`}
                                      />
                                      <button onClick={() => removeAssignment(planId, a.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-400 transition-all">
                                        <X size={10} />
                                      </button>
                                    </div>
                                  )
                                })}

                                {/* Actions */}
                                {isAssigning ? (
                                  <div className="mt-1">
                                    {/* Scope chips — only show when plan has multiple service times */}
                                    {scopeOptions.length > 1 && (
                                      <div className="flex gap-1 flex-wrap mb-1.5">
                                        {scopeOptions.map(opt => (
                                          <button
                                            key={opt.id}
                                            onClick={() => setAssignScope(opt.id)}
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                              assignScope === opt.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    <input
                                      autoFocus
                                      type="text"
                                      value={personSearch}
                                      onChange={e => setPersonSearch(e.target.value)}
                                      placeholder="Buscar..."
                                      className="w-full border border-indigo-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <div className="bg-white border border-gray-200 rounded shadow-md max-h-40 overflow-y-auto mt-0.5 z-10 relative">
                                      {filteredPpl.slice(0, 10).map(p => {
                                        const blocked = hasBlockout(p, plan.dates)
                                        return (
                                          <button
                                            key={p.id}
                                            onClick={() => handleAssign(t.id, team.id, pos.id, p.id)}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-indigo-50 text-left"
                                          >
                                            <Avatar firstName={p.firstName} lastName={p.lastName} size="xs" />
                                            <span className="text-xs text-gray-700">{p.firstName} {p.lastName}</span>
                                            {blocked && <CalendarOff size={10} className="text-amber-500 ml-auto" title="Fecha bloqueada" />}
                                          </button>
                                        )
                                      })}
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                      <button onClick={closeAssigning} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                                      <button
                                        onClick={() => handleOpenSignup(t.id, team.id, pos.id)}
                                        className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                                      >
                                        <UserCheck size={10} /> Abrir inscripción
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setAssigningPos({ timeId: t.id, teamId: team.id, positionId: pos.id }); setPersonSearch('') }}
                                    className="flex items-center gap-1 text-gray-300 hover:text-indigo-500 transition-colors mt-0.5"
                                  >
                                    <Plus size={11} /> Asignar
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
