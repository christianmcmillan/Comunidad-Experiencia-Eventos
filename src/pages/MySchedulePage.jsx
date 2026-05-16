import { format, parseISO, isAfter, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Clock, Calendar } from 'lucide-react'
import usePlansStore from '../store/usePlansStore'
import useServiceTypesStore from '../store/useServiceTypesStore'
import useTeamsStore from '../store/useTeamsStore'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

// Simulated current user ID
const MY_ID = 'p-christian'

export default function MySchedulePage() {
  const navigate = useNavigate()
  const { plans } = usePlansStore()
  const { serviceTypes } = useServiceTypesStore()
  const { teams } = useTeamsStore()

  const today = startOfDay(new Date())

  // Find plans where current user is assigned
  const mySchedule = plans
    .filter((p) =>
      (p.assignments || []).some((a) => a.personId === MY_ID && a.status !== 'declined')
    )
    .sort((a, b) => new Date(a.dates?.[0]) - new Date(b.dates?.[0]))

  function getServiceType(id) {
    return serviceTypes.find((st) => st.id === id)
  }

  function getMyRoles(plan) {
    return (plan.assignments || [])
      .filter((a) => a.personId === MY_ID && a.status !== 'declined')
      .map((a) => {
        const team = teams.find((t) => t.id === a.teamId)
        const pos = team?.positions?.find((p) => p.id === a.positionId)
        return { teamName: team?.name, posName: pos?.name, timeName: plan.times?.find((t) => t.id === a.timeId)?.name }
      })
  }

  const upcoming = mySchedule.filter((p) => p.dates?.some((d) => !isAfter(today, parseISO(d))) )
  const past = mySchedule.filter((p) => p.dates?.every((d) => isAfter(today, parseISO(d))))

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Mi Horario</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tus próximas asignaciones en ComunidadMDE</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {mySchedule.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Sin asignaciones"
            description="Cuando seas asignado a un plan o servicio, aparecerá aquí."
          />
        ) : (
          <div className="max-w-2xl space-y-6">
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximos</p>
                <div className="space-y-2">
                  {upcoming.map((plan) => <ScheduleCard key={plan.id} plan={plan} getServiceType={getServiceType} getMyRoles={getMyRoles} navigate={navigate} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Anteriores</p>
                <div className="space-y-2 opacity-60">
                  {past.slice(0, 5).map((plan) => <ScheduleCard key={plan.id} plan={plan} getServiceType={getServiceType} getMyRoles={getMyRoles} navigate={navigate} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ScheduleCard({ plan, getServiceType, getMyRoles, navigate }) {
  const st = getServiceType(plan.serviceTypeId)
  const roles = getMyRoles(plan)

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
      onClick={() => navigate(`/eventos/${plan.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="w-1 h-full min-h-10 rounded-full flex-shrink-0" style={{ backgroundColor: st?.color || '#d1d5db' }} />
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
