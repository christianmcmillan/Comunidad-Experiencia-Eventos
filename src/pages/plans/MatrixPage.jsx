import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, addWeeks, isAfter, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Grid3X3 } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import usePeopleStore from '../../store/usePeopleStore'
import useTeamsStore from '../../store/useTeamsStore'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'

const STATUS_DOT = {
  invited:   { dot: 'bg-gray-400',  label: 'Invitado'    },
  confirmed: { dot: 'bg-green-500', label: 'Confirmado'  },
  declined:  { dot: 'bg-red-500',   label: 'Declinó'     },
  open:      { dot: 'bg-blue-400',  label: 'Abierto'     },
}

export default function MatrixPage() {
  const navigate = useNavigate()
  const { plans } = usePlansStore()
  const { people } = usePeopleStore()
  const { teams } = useTeamsStore()

  const [selectedTeamId, setSelectedTeamId] = useState('all')
  const today  = startOfDay(new Date())
  const cutoff = addWeeks(today, 8)

  const upcomingPlans = useMemo(() =>
    plans
      .filter(p => p.dates?.some(d => {
        const date = parseISO(d)
        return !isBefore(date, today) && !isAfter(date, cutoff)
      }))
      .sort((a, b) => new Date(a.dates?.[0]) - new Date(b.dates?.[0]))
  , [plans])

  const displayPeople = useMemo(() => {
    if (selectedTeamId === 'all') return people
    return people.filter(p => p.teamIds?.includes(selectedTeamId))
  }, [people, selectedTeamId])

  // Map: planId → { personId → status[] }
  const assignmentMap = useMemo(() => {
    const map = {}
    for (const plan of upcomingPlans) {
      map[plan.id] = {}
      for (const a of (plan.assignments || [])) {
        if (!a.personId) continue
        if (!map[plan.id][a.personId]) map[plan.id][a.personId] = []
        map[plan.id][a.personId].push(a.status)
      }
    }
    return map
  }, [upcomingPlans])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4 flex-wrap">
        <h1 className="text-lg font-semibold text-gray-900">Matriz de Programación</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Equipo:</span>
          <select
            value={selectedTeamId}
            onChange={e => setSelectedTeamId(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todos los equipos</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {Object.entries(STATUS_DOT).filter(([k]) => k !== 'open').map(([k, cfg]) => (
            <div key={k} className="flex items-center gap-1 text-xs text-gray-400">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {upcomingPlans.length === 0 || displayPeople.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Grid3X3}
              title="Sin datos"
              description={upcomingPlans.length === 0
                ? 'No hay planes en las próximas 8 semanas.'
                : 'No hay personas en este equipo.'
              }
            />
          </div>
        ) : (
          <table className="text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky top-0 left-0 z-30 bg-gray-50 px-4 py-3 text-left text-gray-500 font-medium w-44 border-b border-r border-gray-200">
                  Persona
                </th>
                {upcomingPlans.map(p => (
                  <th
                    key={p.id}
                    className="sticky top-0 z-20 bg-gray-50 px-3 py-3 text-center text-gray-500 font-medium min-w-[100px] border-b border-gray-200"
                  >
                    <button
                      onClick={() => navigate(`/eventos/${p.id}`)}
                      className="hover:text-indigo-600 transition-colors text-center"
                    >
                      <p className="font-semibold text-gray-700 truncate max-w-[88px]">{p.title}</p>
                      <p className="text-gray-400 font-normal">
                        {p.dates?.[0] ? format(parseISO(p.dates[0]), 'd MMM', { locale: es }) : '—'}
                      </p>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayPeople.map(person => {
                const totalAssigned = upcomingPlans.filter(p =>
                  (assignmentMap[p.id]?.[person.id] || []).some(s => s !== 'declined')
                ).length
                return (
                  <tr key={person.id} className="hover:bg-indigo-50/30 border-b border-gray-100 group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-indigo-50/30 px-4 py-2 border-r border-gray-100">
                      <button
                        onClick={() => navigate(`/personas/${person.id}`)}
                        className="flex items-center gap-2 text-left hover:text-indigo-600 transition-colors w-full"
                      >
                        <Avatar firstName={person.firstName} lastName={person.lastName} size="xs" />
                        <span className="text-gray-700 truncate max-w-[100px]">
                          {person.firstName} {person.lastName}
                        </span>
                        {totalAssigned > 0 && (
                          <span className="text-indigo-400 font-medium ml-auto flex-shrink-0">{totalAssigned}</span>
                        )}
                      </button>
                    </td>
                    {upcomingPlans.map(plan => {
                      const statuses = assignmentMap[plan.id]?.[person.id] || []
                      const hasConflict = statuses.filter(s => s !== 'declined').length > 1
                      return (
                        <td key={plan.id} className="px-3 py-2 text-center">
                          {statuses.length === 0 ? (
                            <span className="text-gray-200 text-base">·</span>
                          ) : (
                            <div className="flex items-center justify-center gap-0.5">
                              {statuses.map((s, i) => (
                                <div
                                  key={i}
                                  className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s]?.dot || 'bg-gray-300'}`}
                                  title={STATUS_DOT[s]?.label || s}
                                />
                              ))}
                              {hasConflict && (
                                <span className="text-amber-500 font-bold ml-0.5" title="Conflicto: asignado múltiples veces">!</span>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
