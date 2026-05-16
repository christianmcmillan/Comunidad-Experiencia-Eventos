import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Search, Clock } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import useServiceTypesStore from '../../store/useServiceTypesStore'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

function formatDates(dates) {
  if (!dates || dates.length === 0) return ''
  if (dates.length === 1) {
    return format(parseISO(dates[0]), "d 'de' MMMM yyyy", { locale: es })
  }
  const a = parseISO(dates[0])
  const b = parseISO(dates[dates.length - 1])
  if (a.getMonth() === b.getMonth()) {
    return `${format(a, 'd')} & ${format(b, "d 'de' MMMM yyyy", { locale: es })}`
  }
  return `${format(a, "d MMM", { locale: es })} - ${format(b, "d MMM yyyy", { locale: es })}`
}

export default function PlansPage() {
  const navigate = useNavigate()
  const { plans } = usePlansStore()
  const { serviceTypes } = useServiceTypesStore()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const years = [...new Set(plans.flatMap((p) => (p.dates || []).map((d) => parseISO(d).getFullYear())))].sort((a, b) => b - a)

  const filtered = plans.filter((p) => {
    const matchType = activeTab === 'all' || p.serviceTypeId === activeTab
    const matchYear = !selectedYear || (p.dates || []).some((d) => parseISO(d).getFullYear() === selectedYear)
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
    return matchType && matchYear && matchSearch
  }).sort((a, b) => {
    const da = a.dates?.[0] ? new Date(a.dates[0]) : new Date(0)
    const db = b.dates?.[0] ? new Date(b.dates[0]) : new Date(0)
    return db - da
  })

  function getServiceType(id) {
    return serviceTypes.find((st) => st.id === id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Eventos</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar planes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
            />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button onClick={() => navigate('/eventos/nuevo')}>
            <Plus size={14} /> Nuevo Evento
          </Button>
        </div>
      </div>

      {/* Service type tabs */}
      <div className="flex items-center gap-1 px-6 py-2 bg-white border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'all' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Todos
        </button>
        {serviceTypes.map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveTab(st.id)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === st.id ? 'bg-gray-100 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
            {st.name}
          </button>
        ))}
      </div>

      {/* Plans list */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <EmptyState
            title="No hay planes"
            description="Crea un nuevo evento para comenzar a programar el servicio."
            action={<Button onClick={() => navigate('/eventos/nuevo')}><Plus size={14} /> Nuevo Evento</Button>}
          />
        ) : (
          <div className="space-y-2 max-w-3xl">
            {filtered.map((plan) => {
              const st = getServiceType(plan.serviceTypeId)
              const services = (plan.times || []).filter((t) => !t.isRehearsal)
              return (
                <div
                  key={plan.id}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
                  onClick={() => navigate(`/eventos/${plan.id}`)}
                >
                  {/* Color strip */}
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: st?.color || '#d1d5db' }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {plan.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDates(plan.dates)}</p>
                  </div>

                  {/* Service times */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {services.slice(0, 4).map((t) => (
                      <span key={t.id} className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {t.name}
                      </span>
                    ))}
                  </div>

                  {/* Status badge */}
                  <Badge color={plan.status === 'published' ? 'green' : 'gray'}>
                    {plan.status === 'published' ? 'Publicado' : 'Borrador'}
                  </Badge>

                  {/* Order item count */}
                  <span className="text-xs text-gray-400">{plan.order?.length || 0} elementos</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
