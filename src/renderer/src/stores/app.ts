import { create } from 'zustand'
import type { AppSettings } from '../../../shared/types'

interface AppStore {
  mode: 'welcome' | 'recording' | 'management'
  settings: AppSettings
  setMode: (mode: 'welcome' | 'recording' | 'management') => void
  updateSettings: (settings: Partial<AppSettings>) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  mode: 'welcome',
  settings: {
    defaultBrowser: 'chrome',
    defaultConnectionType: 'launch',
    defaultStorageType: 'local',
    defaultLocalPath: '',
    gitConfigs: [],
    lastMode: 'recording',
    language: 'zh-CN',
  },
  setMode: (mode) => set({ mode }),
  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),
  loadSettings: async () => {
    try {
      const result = await window.api.getSettings()
      if (result) {
        set({ settings: result, mode: result.lastMode || 'welcome' })
      }
    } catch {
      // use defaults
    }
  },
  saveSettings: async () => {
    await window.api.saveSettings(get().settings)
  },
}))
