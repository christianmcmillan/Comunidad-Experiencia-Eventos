import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { teams as seedTeams } from '../data/seed'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

const useTeamsStore = create(
  persist(
    (set, get) => ({
      teams: seedTeams,

      addTeam: (team) => set((s) => ({
        teams: [...s.teams, { ...team, id: genId(), positions: [], leaders: [], serviceTypeIds: [], createdAt: new Date().toISOString() }],
      })),
      updateTeam: (id, updates) => set((s) => ({
        teams: s.teams.map((t) => t.id === id ? { ...t, ...updates } : t),
      })),
      deleteTeam: (id) => set((s) => ({ teams: s.teams.filter((t) => t.id !== id) })),
      getTeam: (id) => get().teams.find((t) => t.id === id),

      addPosition: (teamId, position) => set((s) => ({
        teams: s.teams.map((t) => t.id === teamId
          ? { ...t, positions: [...t.positions, { ...position, id: genId() }] }
          : t),
      })),
      updatePosition: (teamId, posId, updates) => set((s) => ({
        teams: s.teams.map((t) => t.id === teamId
          ? { ...t, positions: t.positions.map((p) => p.id === posId ? { ...p, ...updates } : p) }
          : t),
      })),
      deletePosition: (teamId, posId) => set((s) => ({
        teams: s.teams.map((t) => t.id === teamId
          ? { ...t, positions: t.positions.filter((p) => p.id !== posId) }
          : t),
      })),
    }),
    { name: 'comunidad-teams' }
  )
)

export default useTeamsStore
