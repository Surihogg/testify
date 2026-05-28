import { create } from 'zustand'
import type { RecordingSession, RecordingConfig, Step } from '../../../shared/types'

interface LightweightStep {
  id: string
  index: number
  type: string
  target: { selector: string; text: string }
  value?: string
  timestamp: number
  status: string
}

interface RecordingStore {
  session: RecordingSession | null
  config: RecordingConfig | null
  isRecording: boolean
  isPaused: boolean
  stepCount: number
  errorCount: number
  networkErrorCount: number
  recentSteps: LightweightStep[]
  setConfig: (config: RecordingConfig) => void
  startRecording: () => Promise<boolean>
  pauseRecording: () => Promise<void>
  resumeRecording: () => Promise<void>
  stopRecording: () => Promise<RecordingSession | null>
  reset: () => void
  cleanupListeners: (() => void) | null
}

const MAX_RECENT_STEPS = 50

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  session: null,
  config: null,
  isRecording: false,
  isPaused: false,
  stepCount: 0,
  errorCount: 0,
  networkErrorCount: 0,
  recentSteps: [],
  cleanupListeners: null,

  setConfig: (config) => set({ config }),

  startRecording: async () => {
    const { config, cleanupListeners } = get()
    if (!config) return false

    if (cleanupListeners) {
      cleanupListeners()
    }

    const result = await window.api.recording.start(config)
    if (result.success && result.data) {
      set({
        session: result.data,
        isRecording: true,
        isPaused: false,
        stepCount: 0,
        errorCount: 0,
        networkErrorCount: 0,
        recentSteps: [],
      })

      const unsubStep = window.api.recording.onStep((step) => {
        const s = step as LightweightStep
        set((state) => {
          const recentSteps = state.recentSteps.length >= MAX_RECENT_STEPS
            ? [...state.recentSteps.slice(-MAX_RECENT_STEPS + 1), s]
            : [...state.recentSteps, s]
          return { stepCount: state.stepCount + 1, recentSteps }
        })
      })

      const unsubError = window.api.recording.onError(() => {
        set((state) => ({ errorCount: state.errorCount + 1 }))
      })

      const unsubNetwork = window.api.recording.onNetwork((log) => {
        if ((log as { failed?: boolean }).failed) {
          set((state) => ({ networkErrorCount: state.networkErrorCount + 1 }))
        }
      })

      const cleanup = () => {
        unsubStep()
        unsubError()
        unsubNetwork()
      }

      set({ cleanupListeners: cleanup })
      return true
    }
    return false
  },

  pauseRecording: async () => {
    await window.api.recording.pause()
    set({ isPaused: true })
  },

  resumeRecording: async () => {
    await window.api.recording.resume()
    set({ isPaused: false })
  },

  stopRecording: async () => {
    const { cleanupListeners } = get()
    if (cleanupListeners) {
      cleanupListeners()
      set({ cleanupListeners: null })
    }

    const result = await window.api.recording.stop()
    const sessionData = result.success ? result.data || null : null
    set({ isRecording: false, isPaused: false, session: sessionData })
    return sessionData
  },

  reset: () => {
    const { cleanupListeners } = get()
    if (cleanupListeners) {
      cleanupListeners()
    }
    set({
      session: null,
      config: null,
      isRecording: false,
      isPaused: false,
      stepCount: 0,
      errorCount: 0,
      networkErrorCount: 0,
      recentSteps: [],
      cleanupListeners: null,
    })
  },
}))
