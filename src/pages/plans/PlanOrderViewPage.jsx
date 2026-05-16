import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Printer, Clock, Music2, MessageSquare, AlignLeft, Film, ChevronsLeft } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import useServiceTypesStore from '../../store/useServiceTypesStore'
import useSongsStore from '../../store/useSongsStore'
import { fmtDuration, fmtClockTime, buildStartTimes, buildSectionTotals } from '../../components/order/OrderBuilder'

function formatDates(dates) {
  if (!dates || dates.length === 0) return ''
  if (dates.length === 1) return format(parseISO(dates[0]), "d 'de' MMMM yyyy", { locale: es })
  const a = parseISO(dates[0])
  const b = parseISO(dates[dates.length - 1])
  return `${format(a, 'd')} & ${format(b, "d 'de' MMMM yyyy", { locale: es })}`
}

const isSec = (type) => type === 'header' || type === 'section'

const TYPE_CFG = {
  song:    { Icon: Music2,        color: 'text-indigo-400'  },
  spoken:  { Icon: MessageSquare, color: 'text-emerald-500' },
  media:   { Icon: Film,          color: 'text-orange-400'  },
  header:  { Icon: AlignLeft,     color: 'text-gray-400'    },
  section: { Icon: AlignLeft,     color: 'text-gray-400'    },
}

export default function PlanOrderViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPlan } = usePlansStore()
  const { getServiceType } = useServiceTypesStore()
  const { getSong } = useSongsStore()
  const plan = getPlan(id)

  const allTimes = (plan?.times || []).filter(t => !t.isRehearsal)
  const [selTime, setSelTime] = useState(null)

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-gray-500">
        Plan no encontrado.{' '}
        <button className="text-indigo-600 hover:underline ml-1" onClick={() => navigate('/eventos')}>
          Volver
        </button>
      </div>
    )
  }

  const st          = getServiceType(plan.serviceTypeId)
  const order       = [...(plan.order || [])].sort((a, b) => a.position - b.position)
  const startTimes  = buildStartTimes(order)
  const sectTotals  = buildSectionTotals(order)
  const total       = order.filter(i => !isSec(i.type)).reduce((s, i) => s + (i.duration || 0), 0)

  const currentTime = allTimes.find(t => t.id === selTime) || allTimes[0] || null
  let baseMinutes   = null
  if (currentTime?.datetime) {
    const d = new Date(currentTime.datetime)
    baseMinutes = d.getHours() * 60 + d.getMinutes()
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">

      {/* ── Top bar (hidden on print) ── */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => navigate(`/eventos/${id}`)}
          className="text-gray-400 hover:text-gray-700 flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={15} />
          Volver
        </button>

        <div className="flex-1" />

        {/* Service time selector */}
        {allTimes.length > 0 && (
          <div className="flex items-center gap-1">
            {allTimes.map(t => (
              <button
                key={t.id}
                onClick={() => setSelTime(t.id === selTime ? null : t.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  (selTime === t.id || (!selTime && t.id === allTimes[0]?.id))
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors"
        >
          <Printer size={14} />
          Imprimir
        </button>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto py-8 print:py-4 print:max-w-none">

        {/* Plan header */}
        <div className="px-6 mb-6 print:mb-4">
          <div className="flex items-center gap-2 mb-1">
            {st && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />}
            <span className="text-xs text-gray-400">{formatDates(plan.dates)}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 print:text-lg">{plan.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            {currentTime && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {currentTime.name}
              </span>
            )}
            <span>·</span>
            <span>{fmtDuration(total)} total</span>
            <span>·</span>
            <span>{order.filter(i => !isSec(i.type)).length} elementos</span>
          </div>
        </div>

        {/* ── Column headers ── */}
        <div className="flex items-center border-y border-gray-200 bg-gray-50 px-0 py-1.5">
          <div className="w-[52px] flex-shrink-0 text-right pr-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hora</span>
          </div>
          <div className="w-[52px] flex-shrink-0 text-right pr-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dur.</span>
          </div>
          <div className="flex-1 px-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Título</span>
          </div>
        </div>

        {/* ── Order rows ── */}
        {order.map((item) => {
          if (isSec(item.type)) {
            const sTotal = sectTotals[item.id]
            return (
              <div
                key={item.id}
                className="flex items-center bg-gray-50 border-b border-t border-gray-200 py-1.5"
              >
                <div className="w-[52px] flex-shrink-0" />
                <div className="w-[52px] flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2 min-w-0 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {item.title || 'SECCIÓN'}
                  </span>
                  {item.beforeService && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded flex-shrink-0">
                      <ChevronsLeft size={11} />
                      ANTES
                    </span>
                  )}
                </div>
                {sTotal > 0 && (
                  <span className="text-xs text-gray-400 tabular-nums pr-4">{fmtDuration(sTotal)}</span>
                )}
              </div>
            )
          }

          const cfg        = TYPE_CFG[item.type] || TYPE_CFG.spoken
          const Icon       = cfg.icon || cfg.Icon
          const song       = item.songId ? getSong(item.songId) : null
          const offsetSecs = startTimes[item.id] ?? 0
          const clock      = fmtClockTime(baseMinutes, offsetSecs)

          return (
            <div key={item.id} className="flex items-start border-b border-gray-100 print:break-inside-avoid">
              {/* Time */}
              <div className="w-[52px] flex-shrink-0 pt-2.5 text-right pr-3">
                {clock && (
                  <span className="text-xs text-gray-400 tabular-nums">{clock}</span>
                )}
              </div>

              {/* Duration */}
              <div className="w-[52px] flex-shrink-0 pt-2.5 text-right pr-4">
                <span className="text-xs text-gray-500 tabular-nums">
                  {item.duration > 0 ? fmtDuration(item.duration) : '—'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 py-2 min-w-0 px-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <cfg.Icon size={12} className={cfg.color} />
                  <span className="text-sm font-medium text-gray-800">{item.title}</span>
                  {item.type === 'song' && item.key && (
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">{item.key}</span>
                  )}
                </div>
                {item.type === 'song' && song?.artist && (
                  <p className="text-xs text-gray-400 mt-0.5 ml-[18px]">{song.artist}</p>
                )}
                {item.description && (
                  <p className="text-xs text-gray-400 mt-0.5 ml-[18px]">{item.description}</p>
                )}
                {item.notes && (
                  <p className="text-xs text-gray-500 mt-0.5 ml-[18px] whitespace-pre-line leading-relaxed">{item.notes}</p>
                )}
              </div>
            </div>
          )
        })}

        {/* Total row */}
        <div className="flex items-center border-t-2 border-gray-300 mt-1 pt-2 pb-8 print:pb-4">
          <div className="w-[52px] flex-shrink-0" />
          <div className="w-[52px] flex-shrink-0 text-right pr-4">
            <span className="text-sm font-bold text-gray-700 tabular-nums">{fmtDuration(total)}</span>
          </div>
          <div className="flex-1 px-1">
            <span className="text-xs text-gray-400">duración total</span>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block text-xs text-gray-400 text-center border-t border-gray-200 pt-3">
          Comunidad Experiencia — {plan.title} — {formatDates(plan.dates)}
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 1.2cm; size: A4; }
          body { font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
