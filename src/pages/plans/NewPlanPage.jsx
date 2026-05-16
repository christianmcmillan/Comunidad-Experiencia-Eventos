import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import usePlansStore from '../../store/usePlansStore'
import useServiceTypesStore from '../../store/useServiceTypesStore'
import Button from '../../components/ui/Button'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function NewPlanPage() {
  const navigate = useNavigate()
  const { addPlan } = usePlansStore()
  const { serviceTypes } = useServiceTypesStore()

  const [serviceTypeId, setServiceTypeId] = useState(serviceTypes[0]?.id || '')
  const [dates, setDates] = useState([format(new Date(), 'yyyy-MM-dd')])
  const [times, setTimes] = useState([
    { id: genId(), name: 'Ensayo', datetime: '', isRehearsal: true },
    { id: genId(), name: 'Servicio', datetime: '', isRehearsal: false },
  ])

  const selectedSt = serviceTypes.find((st) => st.id === serviceTypeId)

  function handleServiceTypeChange(id) {
    setServiceTypeId(id)
    const st = serviceTypes.find((s) => s.id === id)
    if (st?.defaultTimes) {
      const baseDate = dates[0] || format(new Date(), 'yyyy-MM-dd')
      const newTimes = st.defaultTimes.map((t) => ({
        id: genId(),
        name: t.label,
        datetime: '',
        isRehearsal: false,
      }))
      setTimes(newTimes)
    }
  }

  function addDate() {
    setDates((prev) => [...prev, ''])
  }

  function updateDate(idx, val) {
    setDates((prev) => prev.map((d, i) => i === idx ? val : d))
  }

  function removeDate(idx) {
    setDates((prev) => prev.filter((_, i) => i !== idx))
  }

  function addTime() {
    setTimes((prev) => [...prev, { id: genId(), name: '', datetime: '', isRehearsal: false }])
  }

  function updateTime(id, field, val) {
    setTimes((prev) => prev.map((t) => t.id === id ? { ...t, [field]: val } : t))
  }

  function removeTime(id) {
    setTimes((prev) => prev.filter((t) => t.id !== id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const title = selectedSt?.name || 'Nuevo Plan'
    const plan = {
      serviceTypeId,
      title,
      dates: dates.filter(Boolean),
      times: times.filter((t) => t.name),
      order: [],
      assignments: [],
      notes: [],
      status: 'draft',
    }
    addPlan(plan)
    // Navigate to plans list
    navigate('/eventos')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/eventos')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Nuevo Evento</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service type */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Tipo de Servicio</h2>
          <div className="grid grid-cols-3 gap-3">
            {serviceTypes.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleServiceTypeChange(st.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  serviceTypeId === st.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: st.color }} />
                <p className="text-sm font-medium text-gray-900">{st.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{st.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Fechas del Plan</h2>
            <Button type="button" variant="ghost" size="sm" onClick={addDate}>
              <Plus size={13} /> Agregar fecha
            </Button>
          </div>
          {dates.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="date"
                value={d}
                onChange={(e) => updateDate(idx, e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required={idx === 0}
              />
              {dates.length > 1 && (
                <button type="button" onClick={() => removeDate(idx)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Service Times */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Horarios</h2>
            <Button type="button" variant="ghost" size="sm" onClick={addTime}>
              <Plus size={13} /> Agregar horario
            </Button>
          </div>
          {times.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <input
                type="text"
                value={t.name}
                onChange={(e) => updateTime(t.id, 'name', e.target.value)}
                placeholder="Nombre (ej: Sáb 5pm)"
                className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="datetime-local"
                value={t.datetime}
                onChange={(e) => updateTime(t.id, 'datetime', e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={t.isRehearsal}
                  onChange={(e) => updateTime(t.id, 'isRehearsal', e.target.checked)}
                  className="rounded"
                />
                Ensayo
              </label>
              {times.length > 1 && (
                <button type="button" onClick={() => removeTime(t.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/eventos')}>Cancelar</Button>
          <Button type="submit">Crear Evento</Button>
        </div>
      </form>
    </div>
  )
}
