import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useLiveStore = create(
  persist(
    (set) => ({
      isLive: false,
      videoId: '',
      setLive: (isLive, videoId) => set({ isLive, videoId }),
      reset: () => set({ isLive: false, videoId: '' }),
    }),
    { name: 'comunidad-live' }
  )
)

export default useLiveStore
