import type {
  AppSettings,
  RecordingConfig,
  RecordingSession,
  TestCase,
  ReplayConfig,
  ReplayResult,
  Step,
  NetworkLog,
  ConsoleLog,
  ErrorLog,
  BrowserInfo,
  AssertionResult,
} from '../../shared/types'

export interface TestifyAPI {
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<{ success: boolean }>

  recording: {
    start: (config: RecordingConfig) => Promise<{ success: boolean; data?: RecordingSession; error?: string }>
    pause: () => Promise<{ success: boolean }>
    resume: () => Promise<{ success: boolean }>
    stop: () => Promise<{ success: boolean; data?: RecordingSession; error?: string }>
    getSession: () => Promise<RecordingSession | null>
    onStep: (callback: (step: Step) => void) => () => void
    onNetwork: (callback: (log: NetworkLog) => void) => () => void
    onConsole: (callback: (log: ConsoleLog) => void) => () => void
    onError: (callback: (error: ErrorLog) => void) => () => void
  }

  case: {
    list: () => Promise<{ success: boolean; data: TestCase[] }>
    get: (id: string) => Promise<{ success: boolean; data: TestCase | null }>
    save: (testCase: TestCase) => Promise<{ success: boolean; data?: string; error?: string }>
    delete: (id: string) => Promise<{ success: boolean }>
    update: (testCase: TestCase) => Promise<{ success: boolean; data?: string; error?: string }>
    exportCase: (id: string, exportPath: string) => Promise<{ success: boolean }>
    importCase: (importPath: string) => Promise<{ success: boolean }>
  }

  replay: {
    start: (config: ReplayConfig) => Promise<{ success: boolean; data?: ReplayResult; error?: string }>
    stop: () => Promise<{ success: boolean }>
    getStatus: () => Promise<{ isReplaying: boolean }>
    onStep: (callback: (data: { stepId: string; status: string; error?: string }) => void) => () => void
    onAssertion: (callback: (result: AssertionResult) => void) => () => void
    onComplete: (callback: (result: ReplayResult) => void) => () => void
  }

  browser: {
    list: () => Promise<{ success: boolean; data: BrowserInfo[] }>
    checkCdp: (url: string) => Promise<{ success: boolean; data: boolean }>
  }

  git: {
    clone: (url: string, localPath: string, options?: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
    pull: (localPath: string) => Promise<{ success: boolean; error?: string }>
    push: (localPath: string) => Promise<{ success: boolean; error?: string }>
    status: (localPath: string) => Promise<{ success: boolean; data?: { staged: string[]; unstaged: string[]; untracked: string[] }; error?: string }>
    commit: (localPath: string, message: string) => Promise<{ success: boolean; data?: string; error?: string }>
    remotes: (localPath: string) => Promise<{ success: boolean; data?: { remote: string; url: string }[]; error?: string }>
  }

  dialog: {
    openFolder: () => Promise<{ success: boolean; data: string | null }>
  }
}

declare global {
  interface Window {
    api: TestifyAPI
    electron: import('@electron-toolkit/preload').ElectronAPI
  }
}

export {}
