import { create } from 'zustand'

interface UserPresenceState {
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'
  statusText: string | null
}

interface PresenceStore {
  presences: Record<string, UserPresenceState>
  setPresence: (userId: string, state: UserPresenceState) => void
  setBulk: (presences: Array<{ userId: string } & UserPresenceState>) => void
  getPresence: (userId: string) => UserPresenceState
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  presences: {},

  setPresence: (userId, state) =>
    set((s) => ({ presences: { ...s.presences, [userId]: state } })),

  setBulk: (list) =>
    set((s) => ({
      presences: list.reduce(
        (acc, { userId, ...state }) => ({ ...acc, [userId]: state }),
        s.presences
      ),
    })),

  getPresence: (userId) =>
    get().presences[userId] ?? { status: 'OFFLINE', statusText: null },
}))
