import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import useServiceTypesStore from '../../store/useServiceTypesStore'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import OrderBuilder from '../../components/order/OrderBuilder'
import PlanTeamsTab from '../../components/plans/PlanTeamsTab'
import PlanNotesTab from '../../components/plans/PlanNotesTab'

function formatDates(dates) {
  if (!dates || dates.length === 0) return ''
  if (dates.length === 1) return format(parseISO(dates[0]), "d 'de' MMMM yyyy", { locale: es })
  const a = parseISO(dates[0])
  const b = parseISO(dates[dates.length - 1])
  return `${format(a, 'd')} & ${format(b, "d 'de' MMMM yyyy", { locale: es })}`
}

const TABS = [
  { key: 'orden',    label: 'Orden'    },
  { key: 'equipo',   label: 'Equipo'   },
  { key: 'notas',    label: 'Notas'    },
  { key: 'archivos', label: 'Archivos' },
]

export default function PlanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPlan, updatePlan } = usePlansStore()
  const { getServiceType } = useServiceTypesStore()
  const plan = getPlan(id)
  const [activeTab, setActiveTab]       = useState('orden')
  const [headerCollapsed, setCollapsed] = useState(false)

  if (!plan) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Plan no encontrado.{' '}
        <button className="text-indigo-600 hover:underline" onClick={() => navigate('/eventos')}>
          Volver a Eventos
        </button>
      </div>
    )
  }

  const st         = getServiceType(plan.serviceTypeId)
  const rehearsals = (plan.times || []).filter(t => t.isRehearsal)
  const services   = (plan.times || []).filter(t => !t.isRehearsal)
  const collapsed  = headerCollapsed && activeTab === 'orden'

  return (
    <div className="flex flex-col h-full">

      {/* ── Collapsed mini-header ── */}
      {collapsed ? (
        <div className="bg-white border-b border-gray-200 px-3 flex items-center gap-2 h-10 flex-shrink-0">
          <button onClick={() => navigate('/eventos')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={16} />
          </button>
          {st && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />}
          <span className="text-sm font-semibold text-gray-800 truncate flex-1 min-w-0">{plan.title}</span>

          {/* Tabs inline — scrollable */}
          <div className="flex items-center gap-0.5 overflow-x-auto flex-shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <ChevronDown size={15} />
          </button>
        </div>

      ) : (
        /* ── Full header ── */
        <div className="bg-white border-b border-gray-200 flex-shrink-0">
          {/* Top row: back + title + publish */}
          <div className="px-3 md:px-6 pt-3 md:pt-4 pb-2 flex items-start gap-2">
            <button onClick={() => navigate('/eventos')} className="text-gray-400 hover:text-gray-600 mt-0.5 flex-shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {st && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />}
                <span className="text-xs text-gray-500 truncate">{st?.name}</span>
              </div>
              <h1 className="text-base md:text-lg font-bold text-gray-900 leading-tight">{plan.title}</h1>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">{formatDates(plan.dates)}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge color={plan.status === 'published' ? 'green' : 'gray'} size="xs">
                {plan.status === 'published' ? 'Publicado' : 'Borrador'}
              </Badge>
              <Button
                variant="secondary" size="sm"
                onClick={() => updatePlan(id, { status: plan.status === 'published' ? 'draft' : 'published' })}
              >
                {plan.status === 'published' ? 'Despublicar' : 'Publicar'}
              </Button>
            </div>
          </div>

          {/* Service times — horizontally scrollable */}
          {(rehearsals.length > 0 || services.length > 0) && (
            <div className="px-3 md:px-6 pb-2 flex items-center gap-3 overflow-x-auto">
              {rehearsals.length > 0 && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-gray-400 uppercase tracking-wide whitespace-nowrap">Ensayos:</span>
                  {rehearsals.map(t => (
                    <span key={t.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap">
                      <Clock size={10} />
                      {t.name}{t.datetime ? ` — ${format(new Date(t.datetime), 'HH:mm')}` : ''}
                    </span>
                  ))}
                </div>
              )}
              {services.length > 0 && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-gray-400 uppercase tracking-wide whitespace-nowrap">Servicios:</span>
                  {services.map(t => (
                    <span key={t.id} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full whitespace-nowrap">
                      <Clock size={10} />
                      {t.name}{t.datetime ? ` — ${format(new Date(t.datetime), 'HH:mm')}` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabs row — scrollable */}
          <div className="flex items-center justify-between border-t border-gray-100">
            <div className="flex items-center overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-700 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'orden' && (
              <button
                onClick={() => setCollapsed(true)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-3 py-2.5 flex-shrink-0 transition-colors"
                title="Compactar encabezado"
              >
                <ChevronUp size={14} />
                <span className="hidden sm:inline">Compactar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'orden'    && <OrderBuilder planId={id} />}
        {activeTab === 'equipo'   && <PlanTeamsTab planId={id} />}
        {activeTab === 'notas'    && <PlanNotesTab planId={id} />}
        {activeTab === 'archivos' && <FilesTab />}
      </div>
    </div>
  )
}

function FilesTab() {
  return (
    <div className="p-6 text-center text-sm text-gray-400">
      <p>No hay archivos para este plan.</p>
      <p className="text-xs mt-1">Función de subida de archivos próximamente.</p>
    </div>
  )
}
