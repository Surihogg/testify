import { create } from 'zustand'
import type { TestCase, ReplayConfig, ReplayResult } from '../../../shared/types'

interface CasesStore {
  cases: TestCase[]
  currentCase: TestCase | null
  replayResult: ReplayResult | null
  isReplaying: boolean
  loading: boolean
  loadCases: () => Promise<void>
  selectCase: (id: string) => Promise<void>
  saveCase: (testCase: TestCase) => Promise<boolean>
  deleteCase: (id: string) => Promise<boolean>
  startReplay: (config: ReplayConfig) => Promise<void>
  stopReplay: () => Promise<void>
}

export const useCasesStore = create<CasesStore>((set, get) => ({
  cases: [],
  currentCase: null,
  replayResult: null,
  isReplaying: false,
  loading: false,
  loadCases: async () => {
    set({ loading: true })
    try {
      const result = await window.api.case.list()
      set({ cases: result.success ? result.data : [], loading: false })
    } catch {
      set({ cases: [], loading: false })
    }
  },
  selectCase: async (id) => {
    try {
      const result = await window.api.case.get(id)
      set({ currentCase: result.success ? result.data || null : null })
    } catch {
      set({ currentCase: null })
    }
  },
  saveCase: async (testCase) => {
    const result = await window.api.case.save(testCase)
    if (result.success) {
      await get().loadCases()
      return true
    }
    return false
  },
  deleteCase: async (id) => {
    const result = await window.api.case.delete(id)
    if (result.success) {
      set((state) => ({ cases: state.cases.filter((c) => c.id !== id), currentCase: null }))
      return true
    }
    return false
  },
  startReplay: async (config) => {
    set({ isReplaying: true, replayResult: null })

    window.api.replay.onComplete((result) => {
      set({ replayResult: result as ReplayResult, isReplaying: false })
    })

    const result = await window.api.replay.start(config)
    if (result.success && result.data) {
      set({ replayResult: result.data, isReplaying: false })
    } else {
      set({ isReplaying: false })
    }
  },
  stopReplay: async () => {
    await window.api.replay.stop()
    set({ isReplaying: false })
  },
}))
