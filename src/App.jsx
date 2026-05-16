import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import PlansPage from './pages/plans/PlansPage'
import PlanDetailPage from './pages/plans/PlanDetailPage'
import NewPlanPage from './pages/plans/NewPlanPage'
import TeamsPage from './pages/teams/TeamsPage'
import TeamDetailPage from './pages/teams/TeamDetailPage'
import PeoplePage from './pages/people/PeoplePage'
import PersonDetailPage from './pages/people/PersonDetailPage'
import SongsPage from './pages/songs/SongsPage'
import SongDetailPage from './pages/songs/SongDetailPage'
import MediaPage from './pages/media/MediaPage'
import MySchedulePage from './pages/MySchedulePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          {/* Eventos (formerly planes) */}
          <Route path="eventos" element={<PlansPage />} />
          <Route path="eventos/nuevo" element={<NewPlanPage />} />
          <Route path="eventos/:id/*" element={<PlanDetailPage />} />
          {/* Legacy redirect */}
          <Route path="planes" element={<Navigate to="/eventos" replace />} />
          <Route path="planes/:id" element={<Navigate to="/eventos" replace />} />
          <Route path="equipos" element={<TeamsPage />} />
          <Route path="equipos/:id" element={<TeamDetailPage />} />
          <Route path="personas" element={<PeoplePage />} />
          <Route path="personas/:id" element={<PersonDetailPage />} />
          <Route path="canciones" element={<SongsPage />} />
          <Route path="canciones/:id" element={<SongDetailPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="mi-agenda" element={<MySchedulePage />} />
          <Route path="mi-horario" element={<Navigate to="/mi-agenda" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
