import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { UserCheck, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import usePlansStore from '../../store/usePlansStore'
import useTeamsStore from '../../store/useTeamsStore'

export default function PlanSignupPage() {
  const { id } = useParams()
  const { getPlan, setAssignment } = usePlansStore()
  const { teams } = useTeamsStore()
  const plan = getPlan(id)

  const [signingUpFor, setSigningUpFor] = useState(null) // { a, key }
  const [volunteerName, setVolunteerName] = useState('')
  const [submitted, setSubmitted] = useState([]) // confirmed position keys

  if (!plan) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Plan no encontrado.</p>
    </div>
  )

  const openAssignments = (plan.assignments || []).filter(a => a.status === 'open')

  const openByTeam = []
  for (const team of teams) {
    const items = openAssignments
      .filter(a => a.teamId === team.id)
      .map(a => {
        const pos  = team.positions?.find(p => p.id === a.positionId)
        const time = plan.times?.find(t => t.id === a.timeId)
        const key  = `${a.timeId}-${a.teamId}-${a.positionId}`
        return { a, pos, time, key }
      })
    if (items.length > 0) openByTeam.push({ team, items })
  }

  function handleSignup() {
    if (!volunteerName.trim() || !signingUpFor) return
    const { a, key } = signingUpFor
    setAssignment(plan.id, {
      timeId:        a.timeId,
      teamId:        a.teamId,
      positionId:    a.positionId,
      personId:      null,
      volunteerName: volunteerName.trim(),
      status:        'confirmed',
    })
    setSubmitted(prev => [...prev, key])
    setSigningUpFor(null)
    setVolunteerName('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-sm font-bold">CE</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
          {plan.dates?.length > 0 && (
            <p className="text-gray-500 mt-1">
              {plan.dates.map(d => format(parseISO(d), "d 'de' MMMM yyyy", { locale: es })).join(' & ')}
            </p>
          )}
          <p className="text-sm text-gray-400 mt-3">Inscríbete como voluntario para este servicio</p>
        </div>

        {openByTeam.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Sin posiciones abiertas</p>
            <p className="text-sm text-gray-400 mt-1">No hay posiciones disponibles en este momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {openByTeam.map(({ team, items }) => (
              <div key={team.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="text-sm font-semibold text-gray-800">{team.name}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(({ a, pos, time, key }) => {
                    const isSubmitted  = submitted.includes(key)
                    const isSigningUp  = signingUpFor?.key === key
                    return (
                      <div key={a.id} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{pos?.name || 'Posición'}</p>
                            {time && <p className="text-xs text-gray-400 mt-0.5">{time.name}</p>}
                          </div>
                          {isSubmitted ? (
                            <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg">
                              <UserCheck size={13} /> ¡Inscrito!
                            </span>
                          ) : (
                            <button
                              onClick={() => { setSigningUpFor({ a, key }); setVolunteerName('') }}
                              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0"
                            >
                              Quiero servir
                            </button>
                          )}
                        </div>

                        {isSigningUp && (
                          <div className="mt-3 flex gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={volunteerName}
                              onChange={e => setVolunteerName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSignup()
                                if (e.key === 'Escape') setSigningUpFor(null)
                              }}
                              placeholder="Tu nombre completo"
                              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              onClick={handleSignup}
                              disabled={!volunteerName.trim()}
                              className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => { setSigningUpFor(null); setVolunteerName('') }}
                              className="text-sm text-gray-400 hover:text-gray-600 px-2"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 mt-8">Comunidad Experiencia</p>
      </div>
    </div>
  )
}
