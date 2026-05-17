import { Coffee } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import useTeamsStore from '../../store/useTeamsStore'
import usePeopleStore from '../../store/usePeopleStore'
import Avatar from '../ui/Avatar'
import EmptyState from '../ui/EmptyState'

function getBlocks(times) {
  // Group non-rehearsal times by calendar day
  const blocks = {}
  times.filter(t => !t.isRehearsal).forEach(t => {
    const day = new Date(t.datetime).getDay() // 0=Sun, 6=Sat
    const key = day === 6 ? 'sat' : day === 0 ? 'sun' : 'event'
    const label = day === 6 ? '☕ Sábado' : day === 0 ? '☕ Domingo' : '☕ Refrigerio'
    if (!blocks[key]) blocks[key] = { key, label, timeIds: [], timeNames: [] }
    blocks[key].timeIds.push(t.id)
    blocks[key].timeNames.push(t.name)
  })
  return Object.values(blocks)
}

export default function RefrigerioTab({ planId }) {
  const { getPlan, toggleRefrigerio } = usePlansStore()
  const { teams } = useTeamsStore()
  const { people } = usePeopleStore()
  const plan = getPlan(planId)

  if (!plan) return null

  const blocks = getBlocks(plan.times || [])

  // Build a lookup: personId → position label
  const positionLookup = {}
  ;(plan.assignments || []).forEach((a) => {
    if (!a.personId || a.status === 'declined') return
    const team = teams.find(t => t.id === a.teamId)
    const pos = team?.positions?.find(p => p.id === a.positionId)
    if (pos && !positionLookup[a.personId]) {
      positionLookup[a.personId] = `${team?.name} · ${pos.name}`
    }
  })

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {blocks.map((block) => {
          // Collect unique personIds for this block (non-declined assignments)
          const personIds = [
            ...new Set(
              (plan.assignments || [])
                .filter(a => block.timeIds.includes(a.timeId) && a.status !== 'declined' && a.personId)
                .map(a => a.personId)
            ),
          ]

          const received = plan.refrigerio?.[block.key] || []
          const count = received.length

          return (
            <div key={block.key} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{block.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{block.timeNames.join(' + ')}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    personIds.length > 0 && count === personIds.length
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count} / {personIds.length} recibieron
                </span>
              </div>

              {/* People list */}
              {personIds.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  No hay voluntarios asignados para este bloque
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {personIds.map((pid) => {
                    const person = people.find(p => p.id === pid)
                    if (!person) return null
                    const didReceive = received.includes(pid)
                    return (
                      <li
                        key={pid}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          didReceive ? 'bg-green-50/60' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleRefrigerio(planId, block.key, pid)}
                          className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                            didReceive
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {didReceive && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        <Avatar firstName={person.firstName} lastName={person.lastName} size="sm" />

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${didReceive ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {person.firstName} {person.lastName}
                          </p>
                          {positionLookup[pid] && (
                            <p className="text-xs text-gray-400 truncate">{positionLookup[pid]}</p>
                          )}
                        </div>

                        {didReceive && (
                          <span className="text-xs font-medium text-green-600 flex-shrink-0">✓ Recibió</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}

        {blocks.length === 0 && (
          <EmptyState icon={Coffee} title="Sin reuniones" description="Este plan no tiene reuniones configuradas." />
        )}
      </div>
    </div>
  )
}
