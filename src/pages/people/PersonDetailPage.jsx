import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import usePeopleStore from '../../store/usePeopleStore'
import useTeamsStore from '../../store/useTeamsStore'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'

const ROLE_COLORS = { administrator: 'indigo', editor: 'blue', scheduled_viewer: 'green', viewer: 'gray' }
const ROLE_LABELS = { administrator: 'Administrador', editor: 'Editor', scheduled_viewer: 'Voluntario', viewer: 'Visitante' }

export default function PersonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPerson } = usePeopleStore()
  const { teams } = useTeamsStore()
  const person = getPerson(id)

  if (!person) return (
    <div className="p-6 text-sm text-gray-500">
      Persona no encontrada. <button className="text-indigo-600 hover:underline" onClick={() => navigate('/personas')}>Volver</button>
    </div>
  )

  const personTeams = teams.filter((t) => person.teamIds?.includes(t.id))

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
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700 mb-3">Información de Contacto</p>
            {person.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" />
                {person.email}
              </div>
            )}
            {person.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" />
                {person.phone}
              </div>
            )}
            {!person.email && !person.phone && (
              <p className="text-xs text-gray-400">Sin información de contacto.</p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Equipos ({personTeams.length})</p>
            {personTeams.length === 0 ? (
              <p className="text-xs text-gray-400">No pertenece a ningún equipo.</p>
            ) : (
              <div className="space-y-2">
                {personTeams.map((t) => (
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
        </div>
      </div>
    </div>
  )
}
