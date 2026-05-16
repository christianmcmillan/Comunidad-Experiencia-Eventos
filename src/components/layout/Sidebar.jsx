import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Music2, Film, UserCircle, Clock, Grid3X3 } from 'lucide-react'

const navItems = [
  { to: '/mi-agenda',   icon: Clock,          label: 'Mi Agenda'   },
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Eventos'     },
  { to: '/canciones',   icon: Music2,          label: 'Canciones'   },
  { to: '/media',       icon: Film,            label: 'Media'       },
  { to: '/personas',    icon: UserCircle,      label: 'Personas'    },
  { to: '/equipos',     icon: Users,           label: 'Equipos'     },
  { to: '/matriz',      icon: Grid3X3,         label: 'Matriz'      },
]

export default function Sidebar({ onNav }) {
  const navigate = useNavigate()

  function handleNav(to) {
    navigate(to)
    onNav?.()
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div
        className="px-4 py-4 border-b border-gray-200 cursor-pointer select-none"
        onClick={() => handleNav('/dashboard')}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold tracking-tight">CE</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">Comunidad</p>
            <p className="text-xs font-semibold text-indigo-500 leading-tight">Experiencia</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => onNav?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Current user */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 text-xs font-bold">CM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">Christian McMillan</p>
            <p className="text-xs text-gray-400 truncate">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
