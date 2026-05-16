import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, CalendarOff, Plus, Trash2 } from 'lucide-react'
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import usePeopleStore from '../../store/usePeopleStore'
import useTeamsStore from '../../store/useTeamsStore'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'

const ROLE_COLORS  = { administrator: 'indigo', editor: 'blue', scheduled_viewer: 'green', viewer: 'gray' }
const ROLE_LABELS  = { administrator: 'Administrador', editor: 'Editor', scheduled_viewer: 'Voluntario', viewer: 'Visitante' }

export default function PersonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPerson, addBlockout, removeBlockout } = usePeopleStore()
  const { teams } = useTeamsStore()
  const person = getPerson(id)

  const [addingBlockout, setAddingBlockout] = useState(false)
  const [blockoutForm, setBlockoutForm] = useState({ startDate: '', endDate: '', note: '' })

  if (!person) return (
    <div className="p-6 text-sm text-gray-500">
      Persona no encontrada.{' '}
      <button className="text-indigo-600 hover:underline" onClick={() => navigate('/personas')}>Volver</button>
    </div>
  )

  const personTeams   = teams.filter(t => person.teamIds?.includes(t.id))
  const blockoutDates = person.blockoutDates || []

  function handleAddBlockout() {
    if (!blockoutForm.startDate) return
    addBlockout(id, {
      startDate: blockoutForm.startDate,
      endDate:   blockoutForm.endDate || blockoutForm.startDate,
      note:      blockoutForm.note,
    })
    setBlockoutForm({ startDate: '', endDate: '', note: '' })
    setAddingBlockout(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/personas')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </button>
          <Avatar firstName={person.firstName} lastName={person.lastName} size="lg" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{person.firstName} {person.lastName}</h1>
            <Badge color={ROLE_COLORS[person.role] || 'gray'}>{ROLE_LABELS[person.role] || person.role}</Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-2xl">

          {/* Contact */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Información de Contacto</p>
            {person.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" /> {person.email}
              </div>
            )}
            {person.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" /> {person.phone}
              </div>
            )}
            {!person.email && !person.phone && (
              <p className="text-xs text-gray-400">Sin información de contacto.</p>
            )}
          </div>

          {/* Teams */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Equipos ({personTeams.length})</p>
            {personTeams.length === 0 ? (
              <p className="text-xs text-gray-400">No pertenece a ningún equipo.</p>
            ) : (
              <div className="space-y-2">
                {personTeams.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors"
                    onClick={() => navigate(`/equipos/${t.id}`)}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-gray-700">{t.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{t.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blockout dates — full width */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarOff size={15} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">Fechas No Disponibles</p>
                {blockoutDates.length > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{blockoutDates.length}</span>
                )}
              </div>
              <button
                onClick={() => setAddingBlockout(v => !v)}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                <Plus size={13} /> Agregar
              </button>
            </div>

            {/* Add form */}
            {addingBlockout && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Desde</label>
                    <input
                      type="date"
                      value={blockoutForm.startDate}
                      onChange={e => setBlockoutForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Hasta <span className="text-gray-400">(opcional)</span></label>
                    <input
                      type="date"
                      value={blockoutForm.endDate}
                      min={blockoutForm.startDate}
                      onChange={e => setBlockoutForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={blockoutForm.note}
                  onChange={e => setBlockoutForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Motivo (opcional)"
                  className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setAddingBlockout(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancelar</button>
                  <button onClick={handleAddBlockout} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700">Guardar</button>
                </div>
              </div>
            )}

            {/* Blockout list */}
            {blockoutDates.length === 0 ? (
              <p className="text-xs text-gray-400">Sin fechas bloqueadas. Esta persona está disponible para todos los servicios.</p>
            ) : (
              <div className="space-y-1">
                {blockoutDates.map(b => {
                  const same = b.startDate === b.endDate || !b.endDate
                  const label = same
                    ? format(parseISO(b.startDate), "d 'de' MMMM yyyy", { locale: es })
                    : `${format(parseISO(b.startDate), "d MMM", { locale: es })} – ${format(parseISO(b.endDate), "d 'de' MMMM yyyy", { locale: es })}`
                  return (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 group">
                      <div>
                        <span className="text-sm text-gray-700">{label}</span>
                        {b.note && <span className="text-xs text-gray-400 ml-2">— {b.note}</span>}
                      </div>
                      <button
                        onClick={() => removeBlockout(id, b.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
