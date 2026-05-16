import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import usePlansStore from '../store/usePlansStore'
import useServiceTypesStore from '../store/useServiceTypesStore'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatTime(datetimeStr) {
  if (!datetimeStr) return ''
  const d = new Date(datetimeStr)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  return `${h > 12 ? h - 12 : h || 12}:${m} ${ampm}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { plans } = usePlansStore()
  const { serviceTypes } = useServiceTypesStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  // Get upcoming plans (sorted by first date)
  const upcoming = [...plans]
    .filter((p) => p.dates && p.dates.length > 0)
    .sort((a, b) => new Date(a.dates[0]) - new Date(b.dates[0]))
    .slice(0, 10)

  // Days that have plans
  const planDays = plans.flatMap((p) => (p.dates || []).map((d) => ({ date: d, plan: p })))

  function getServiceType(id) {
    return serviceTypes.find((st) => st.id === id)
  }

  function plansOnDay(day) {
    return planDays.filter((pd) => isSameDay(parseISO(pd.date), day))
  }

  return (
    <div className="flex h-full">
      {/* Left: Calendar */}
      <div className="flex-1 p-6 border-r border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-gray-100 text-gray-500">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-gray-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-gray-100 text-gray-500">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>Hoy</Button>
            <Button size="sm" onClick={() => navigate('/eventos/nuevo')}>
              <Plus size={14} /> Nuevo Evento
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
          {DAYS.map((d) => (
            <div key={d} className="bg-gray-50 text-center py-2 text-xs font-medium text-gray-500">
              {d}
            </div>
          ))}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-white min-h-20" />
          ))}
          {days.map((day) => {
            const dayPlans = plansOnDay(day)
            const today = isToday(day)
            return (
              <div
                key={day.toISOString()}
                className={`bg-white min-h-20 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${today ? 'ring-2 ring-inset ring-indigo-400' : ''}`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full mb-1 ${
                  today ? 'bg-indigo-600 text-white font-bold' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </span>
                <div className="space-y-0.5">
                  {dayPlans.slice(0, 2).map(({ plan }) => {
                    const st = getServiceType(plan.serviceTypeId)
                    return (
                      <div
                        key={plan.id}
                        className="text-xs px-1 py-0.5 rounded truncate cursor-pointer"
                        style={{ backgroundColor: st ? st.color + '22' : '#e5e7eb', color: st ? st.color : '#374151' }}
                        onClick={() => navigate(`/eventos/${plan.id}`)}
                      >
                        {st?.shortName || plan.title}
                      </div>
                    )
                  })}
                  {dayPlans.length > 2 && (
                    <div className="text-xs text-gray-400 px-1">+{dayPlans.length - 2} más</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4">
          {serviceTypes.map((st) => (
            <div key={st.id} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }} />
              {st.shortName}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Upcoming plans */}
      <div className="w-72 p-4 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximos Eventos</p>
        {upcoming.length === 0 && (
          <p className="text-xs text-gray-400">No hay planes próximos.</p>
        )}
        <div className="space-y-2">
          {upcoming.map((plan) => {
            const st = getServiceType(plan.serviceTypeId)
            const services = (plan.times || []).filter((t) => !t.isRehearsal)
            return (
              <div
                key={plan.id}
                className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
                onClick={() => navigate(`/planes/${plan.id}`)}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{plan.title}</p>
                  {st && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: st.color }}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {plan.dates?.map((d) => {
                    const dt = parseISO(d)
                    return format(dt, "d MMM", { locale: es })
                  }).join(' & ')}
                </p>
                {services.length > 0 && (
                  <div className="space-y-0.5">
                    {services.map((t) => (
                      <div key={t.id} className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={10} />
                        <span>{t.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
