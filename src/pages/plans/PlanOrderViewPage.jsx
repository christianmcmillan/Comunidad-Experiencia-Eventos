import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Printer, Clock, Music2, MessageSquare, AlignLeft, Film } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import useServiceTypesStore from '../../store/useServiceTypesStore'
import useSongsStore from '../../store/useSongsStore'
import { fmtDuration, fmtClockTime } from '../../components/order/OrderBuilder'

function formatDates(dates) {
  if (!dates || dates.length === 0) return ''
  if (dates.length === 1) return format(parseISO(dates[0]), "d 'de' MMMM yyyy", { locale: es })
  const a = parseISO(dates[0])
  const b = parseISO(dates[dates.length - 1])
  return `${format(a, 'd')} & ${format(b, "d 'de' MMMM yyyy", { locale: es })}`
}

function buildStartTimes(order) {
  const map = {}
  let running = 0
  for (const item of order) {
    if (item.type !== 'header') {
      map[item.id] = running
      running += item.duration || 0
    }
  }
  return map
}

function buildSectionTotals(order) {
  const map = {}
  let currentHeaderId = null
  let running = 0
  for (const item of order) {
    if (item.type === 'header') {
      if (currentHeaderId) map[currentHeaderId] = running
      currentHeaderId = item.id
      running = 0
    } else {
      running += item.duration || 0
    }
  }
  if (currentHeaderId) map[currentHeaderId] = running
  return map
}

const TYPE_ICON = {
  song:   { Icon: Music2,        color: 'text-indigo-400'  },
  spoken: { Icon: MessageSquare, color: 'text-emerald-500' },
  media:  { Icon: Film,          color: 'text-orange-400'  },
}

export default function PlanOrderViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPlan } = usePlansStore()
  const { getServiceType } = useServiceTypesStore()
  const { getSong } = useSongsStore()
  const plan = getPlan(id)

  const allTimes    = (plan?.times || []).filter(t => !t.isRehearsal)
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

  const st         = getServiceType(plan.serviceTypeId)
  const order      = [...(plan.order || [])].sort((a, b) => a.position - b.position)
  const startTimes = buildStartTimes(order)
  const sectTotals = buildSectionTotals(order)
  const total      = order.filter(i => i.type !== 'header').reduce((s, i) => s + (i.duration || 0), 0)

  const currentTime  = allTimes.find(t => t.id === selTime) || allTimes[0] || null
  let baseMinutes    = null
  if (currentTime?.datetime) {
    const d = new Date(currentTime.datetime)
    baseMinutes = d.getHours() * 60 + d.getMinutes()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top bar (hidden on print) ── */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate(`/eventos/${id}`)}
          className="text-gray-400 hover:text-gray-700 flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>

        <div className="flex-1" />

        {/* Service time selector */}
        {allTimes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Reloj:</span>
            <div className="flex gap-1">
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
      <div className="max-w-3xl mx-auto px-8 py-8 print:py-4 print:px-6">

        {/* Plan header */}
        <div className="mb-8 print:mb-5">
          <div className="flex items-center gap-2 mb-1">
            {st && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />}
            <span className="text-xs text-gray-400 uppercase tracking-wide">{st?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 print:text-xl">{plan.title}</h1>
          <p className="text-gray-500 mt-0.5">{formatDates(plan.dates)}</p>

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            {currentTime && (
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {currentTime.name}
                {currentTime.datetime && ` — ${format(new Date(currentTime.datetime), 'HH:mm')}`}
              </span>
            )}
            <span className="text-gray-300">|</span>
            <span>{fmtDuration(total)} total</span>
            <span className="text-gray-300">|</span>
            <span>{order.filter(i => i.type !== 'header').length} elementos</span>
          </div>
        </div>

        {/* ── Order list ── */}
        <div className="space-y-0">
          {order.map((item) => {
            if (item.type === 'header') {
              const sTotal = sectTotals[item.id]
              return (
                <div key={item.id} className="mt-8 mb-3 print:mt-5 print:mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 px-2">
                      {item.title}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                    {sTotal > 0 && (
                      <span className="text-xs text-gray-300 tabular-nums w-10 text-right">{fmtDuration(sTotal)}</span>
                    )}
                  </div>
                </div>
              )
            }

            const { Icon, color } = TYPE_ICON[item.type] || TYPE_ICON.spoken
            const song       = item.songId ? getSong(item.songId) : null
            const offsetSecs = startTimes[item.id] || 0
            const clock      = fmtClockTime(baseMinutes, offsetSecs)

            return (
              <div
                key={item.id}
                className="flex items-start gap-4 py-2.5 border-b border-gray-50 last:border-0 group print:py-2"
              >
                {/* Clock time */}
                <div className="w-16 flex-shrink-0 text-right">
                  {clock ? (
                    <span className="text-xs font-medium text-indigo-500 tabular-nums">{clock}</span>
                  ) : (
                    <span className="text-xs text-gray-300 tabular-nums">
                      {offsetSecs > 0 ? `+${fmtDuration(offsetSecs)}` : '0:00'}
                    </span>
                  )}
                </div>

                {/* Type icon */}
                <div className="pt-0.5 flex-shrink-0">
                  <Icon size={14} className={color} />
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                    {item.type === 'song' && song && (
                      <span className="text-xs text-gray-400">{song.artist}</span>
                    )}
                  </div>

                  {/* Song key + BPM */}
                  {item.type === 'song' && (item.key || song?.bpm) && (
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.key && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{item.key}</span>
                      )}
                      {song?.bpm && (
                        <span className="text-xs text-gray-400">{song.bpm} BPM</span>
                      )}
                    </div>
                  )}

                  {/* Description / notes */}
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-amber-600 italic mt-0.5">"{item.notes}"</p>
                  )}
                </div>

                {/* Duration */}
                <div className="flex-shrink-0 text-right">
                  <span className="text-sm tabular-nums text-gray-500">{fmtDuration(item.duration)}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-400">Duración total</span>
          <span className="text-lg font-bold text-gray-900 tabular-nums">{fmtDuration(total)}</span>
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 text-xs text-gray-400 text-center">
          Comunidad Experiencia — {plan.title} — {formatDates(plan.dates)}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { font-size: 11pt; }
        }
      `}</style>
    </div>
  )
}
