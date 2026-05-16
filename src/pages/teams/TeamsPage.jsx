import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import useTeamsStore from '../../store/useTeamsStore'
import usePeopleStore from '../../store/usePeopleStore'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

const CATEGORY_COLORS = {
  'Técnico': 'indigo',
  'Comunicaciones': 'blue',
  'Servicio': 'green',
  'Generaciones': 'amber',
  'Crecimiento': 'teal',
  'Música': 'pink',
}

export default function TeamsPage() {
  const navigate = useNavigate()
  const { teams } = useTeamsStore()
  const { people } = usePeopleStore()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = ['all', ...new Set(teams.map((t) => t.category))]

  const filtered = teams.filter((t) => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = filtered.reduce((acc, team) => {
    const cat = team.category || 'Otros'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(team)
    return acc
  }, {})

  function getMemberCount(team) {
    return people.filter((p) => p.teamIds?.includes(team.id)).length
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900 mr-auto">Equipos</h1>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-44"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 px-6 py-2 bg-white border-b border-gray-200 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
              activeCategory === cat ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {Object.keys(grouped).length === 0 ? (
          <EmptyState icon={Users} title="Sin equipos" description="No se encontraron equipos." />
        ) : (
          <div className="space-y-6 max-w-4xl">
            {Object.entries(grouped).map(([category, categoryTeams]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge color={CATEGORY_COLORS[category] || 'gray'}>{category}</Badge>
                  <span className="text-xs text-gray-400">{categoryTeams.length} equipo{categoryTeams.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {categoryTeams.map((team) => {
                    const memberCount = getMemberCount(team)
                    return (
                      <div
                        key={team.id}
                        className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
                        onClick={() => navigate(`/equipos/${team.id}`)}
                      >
                        <div className="w-2 h-8 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: team.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{team.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {memberCount} miembro{memberCount !== 1 ? 's' : ''}
                            <span className="md:hidden"> · {team.positions?.length || 0} pos.</span>
                          </p>
                        </div>
                        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                          {team.positions?.slice(0, 4).map((pos) => (
                            <span key={pos.id} className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{pos.name}</span>
                          ))}
                          {(team.positions?.length || 0) > 4 && (
                            <span className="text-xs text-gray-400">+{team.positions.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
