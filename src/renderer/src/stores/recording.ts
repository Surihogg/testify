import { create } from 'zustand'
import type { RecordingSession, RecordingConfig, Step } from '../../../shared/types'

interface RecordingStore {
  session: RecordingSession | null
  config: RecordingConfig | null
  isRecording: boolean
  isPaused: boolean
  steps: Step[]
  errorCount: number
  networkErrorCount: number
  setConfig: (config: RecordingConfig) => void
  startRecording: () => Promise<boolean>
  pauseRecording: () => Promise<void>
  resumeRecording: () => Promise<void>
  stopRecording: () => Promise<RecordingSession | null>
  addStep: (step: Step) => void
  incrementErrorCount: () => void
  incrementNetworkErrorCount: () => void
  reset: () => void
}

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  session: null,
  config: null,
  isRecording: false,
  isPaused: false,
  steps: [],
  errorCount: 0,
  networkErrorCount: 0,
  setConfig: (config) => set({ config }),
  startRecording: async () => {
    const { config } = get()
    if (!config) return false
    const result = await window.api.recording.start(config)
    if (result.success && result.data) {
      set({ session: result.data, isRecording: true, isPaused: false, steps: [], errorCount: 0, networkErrorCount: 0 })

      window.api.recording.onStep((step) => {
        get().addStep(step as Step)
      })
      window.api.recording.onError(() => {
        get().incrementErrorCount()
      })
      window.api.recording.onNetwork((log) => {
        if ((log as { failed?: boolean }).failed) {
          get().incrementNetworkErrorCount()
        }
      })

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
    const result = await window.api.recording.stop()
    set({ isRecording: false, isPaused: false, session: null })
    return result.success ? result.data || null : null
  },
  addStep: (step) => set((state) => ({ steps: [...state.steps, step] })),
  incrementErrorCount: () => set((state) => ({ errorCount: state.errorCount + 1 })),
  incrementNetworkErrorCount: () => set((state) => ({ networkErrorCount: state.networkErrorCount + 1 })),
  reset: () =>
    set({ session: null, config: null, isRecording: false, isPaused: false, steps: [], errorCount: 0, networkErrorCount: 0 }),
}))
