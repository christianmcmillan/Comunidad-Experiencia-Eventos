import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Calendar, Check, X } from 'lucide-react'
import usePlansStore from '../store/usePlansStore'
import useServiceTypesStore from '../store/useServiceTypesStore'
import useTeamsStore from '../store/useTeamsStore'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

const MY_ID = 'p-christian'

export default function MySchedulePage() {
  const navigate = useNavigate()
  const { plans, updateAssignmentStatus } = usePlansStore()
  const { serviceTypes } = useServiceTypesStore()
  const { teams } = useTeamsStore()

  const today = startOfDay(new Date())

  function getServiceType(id) {
    return serviceTypes.find((st) => st.id === id)
  }

  function getRoleLabel(plan, a) {
    const team = teams.find((t) => t.id === a.teamId)
    const pos  = team?.positions?.find((p) => p.id === a.positionId)
    const time = plan.times?.find((t) => t.id === a.timeId)
    return { teamName: team?.name, posName: pos?.name, timeName: time?.name }
  }

  // Pending invitations (invited, any date including past)
  const pendingPlans = plans
    .filter((p) => (p.assignments || []).some((a) => a.personId === MY_ID && a.status === 'invited'))
    .sort((a, b) => new Date(a.dates?.[0]) - new Date(b.dates?.[0]))

  // Confirmed upcoming/past (exclude declined and invited)
  const confirmedPlans = plans
    .filter((p) => (p.assignments || []).some((a) => a.personId === MY_ID && a.status === 'confirmed'))
    .sort((a, b) => new Date(a.dates?.[0]) - new Date(b.dates?.[0]))

  const upcoming = confirmedPlans.filter((p) => p.dates?.some((d) => !isAfter(today, parseISO(d))))
  const past     = confirmedPlans.filter((p) => p.dates?.every((d) => isAfter(today, parseISO(d))))

  const hasAnything = pendingPlans.length > 0 || confirmedPlans.length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Mi Horario</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tus próximas asignaciones en ComunidadMDE</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!hasAnything ? (
          <EmptyState
            icon={Calendar}
            title="Sin asignaciones"
            description="Cuando seas asignado a un plan o servicio, aparecerá aquí."
          />
        ) : (
          <div className="max-w-2xl space-y-6">

            {/* Pending invitations */}
            {pendingPlans.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                    Invitaciones pendientes
                  </p>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    {pendingPlans.reduce((n, p) => n + (p.assignments || []).filter(a => a.personId === MY_ID && a.status === 'invited').length, 0)}
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingPlans.map((plan) => {
                    const st = getServiceType(plan.serviceTypeId)
                    const invitedAssignments = (plan.assignments || []).filter(
                      (a) => a.personId === MY_ID && a.status === 'invited'
                    )
                    return (
                      <div
                        key={plan.id}
                        className="bg-white border-2 border-amber-200 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: st?.color || '#d1d5db' }} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{plan.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {plan.dates?.map((d) => format(parseISO(d), "d 'de' MMMM", { locale: es })).join(' & ')}
                                </p>
                              </div>
                              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                Invitado
                              </span>
                            </div>

                            {/* Role chips */}
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {invitedAssignments.map((a, i) => {
                                const r = getRoleLabel(plan, a)
                                return (
                                  <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                    {r.teamName} — {r.posName}
                                    {r.timeName && <span className="opacity-70"> ({r.timeName})</span>}
                                  </span>
                                )
                              })}
                            </div>

                            {/* Action buttons */}
                            <div className="mt-3 flex items-center gap-2">
                              {invitedAssignments.map((a) => (
                                <div key={a.id} className="flex gap-2">
                                  <button
                                    onClick={() => updateAssignmentStatus(plan.id, a.id, 'confirmed')}
                                    className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                                  >
                                    <Check size={12} /> Confirmar
                                  </button>
                                  <button
                                    onClick={() => updateAssignmentStatus(plan.id, a.id, 'declined')}
                                    className="flex items-center gap-1.5 text-xs border border-gray-300 hover:border-red-400 hover:text-red-600 text-gray-500 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                  >
                                    <X size={12} /> Declinar
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => navigate(`/eventos/${plan.id}`)}
                                className="text-xs text-gray-400 hover:text-indigo-600 ml-auto transition-colors"
                              >
                                Ver plan →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Confirmed upcoming */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximos confirmados</p>
                <div className="space-y-2">
                  {upcoming.map((plan) => (
                    <ScheduleCard key={plan.id} plan={plan} getServiceType={getServiceType} getRoleLabel={getRoleLabel} navigate={navigate} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Anteriores</p>
                <div className="space-y-2 opacity-60">
                  {past.slice(0, 5).map((plan) => (
                    <ScheduleCard key={plan.id} plan={plan} getServiceType={getServiceType} getRoleLabel={getRoleLabel} navigate={navigate} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

function ScheduleCard({ plan, getServiceType, getRoleLabel, navigate }) {
  const st    = getServiceType(plan.serviceTypeId)
  const roles = (plan.assignments || [])
    .filter((a) => a.personId === MY_ID && a.status === 'confirmed')
    .map((a) => getRoleLabel(plan, a))

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
      onClick={() => navigate(`/eventos/${plan.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: st?.color || '#d1d5db' }} />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{plan.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {plan.dates?.map((d) => format(parseISO(d), "d 'de' MMMM", { locale: es })).join(' & ')}
              </p>
            </div>
            <Badge color={plan.status === 'published' ? 'green' : 'gray'} size="xs">
              {plan.status === 'published' ? 'Publicado' : 'Borrador'}
            </Badge>
          </div>
          {roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roles.map((r, i) => (
                <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {r.teamName} — {r.posName}
                  {r.timeName && <span className="text-indigo-400"> ({r.timeName})</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
