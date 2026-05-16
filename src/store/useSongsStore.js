import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { songs as seedSongs } from '../data/seed'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

const useSongsStore = create(
  persist(
    (set, get) => ({
      songs: seedSongs,

      addSong: (song) => set((s) => ({
        songs: [...s.songs, { ...song, id: genId(), keys: [], themes: [], createdAt: new Date().toISOString() }],
      })),
      updateSong: (id, updates) => set((s) => ({
        songs: s.songs.map((s2) => s2.id === id ? { ...s2, ...updates } : s2),
      })),
      deleteSong: (id) => set((s) => ({ songs: s.songs.filter((s2) => s2.id !== id) })),
      getSong: (id) => get().songs.find((s) => s.id === id),
    }),
    { name: 'comunidad-songs' }
  )
)

export default useSongsStore
