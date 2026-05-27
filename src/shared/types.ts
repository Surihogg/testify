export type BrowserType = 'chrome' | 'edge' | 'chromium' | 'firefox' | 'webkit'
export type ConnectionType = 'launch' | 'persistent' | 'cdp'
export type StorageType = 'local' | 'git'
export type StepType = 'click' | 'dblclick' | 'input' | 'navigate' | 'scroll' | 'select' | 'hover' | 'keypress' | 'wait' | 'upload' | 'download'
export type StepStatus = 'normal' | 'warning' | 'error'
export type CaseStatus = 'draft' | 'active' | 'deprecated'
export type AssertionType = 'elementExists' | 'elementVisible' | 'elementText' | 'statusCode' | 'responseBody' | 'noConsoleErrors' | 'noNetworkErrors' | 'custom'
export type ReplayType = 'functional' | 'visual'

export interface BrowserInfo {
  channel: string
  name: string
  version: string
  available: boolean
}

export interface SelectorInfo {
  css: string
  xpath: string
  text: string
  role: string
}

export interface StepTarget {
  selector: string
  xpath: string
  text: string
  role: string
  rect: { x: number; y: number; width: number; height: number }
}

export interface NetworkLog {
  id: string
  url: string
  method: string
  status: number
  requestHeaders: Record<string, string>
  requestBody?: string
  responseHeaders: Record<string, string>
  responseBody?: string
  error?: string
  timestamp: number
  duration: number
  failed: boolean
}

export interface ConsoleLog {
  id: string
  level: 'log' | 'warn' | 'error' | 'info'
  text: string
  timestamp: number
}

export interface ErrorLog {
  id: string
  message: string
  stack: string
  source: string
  line: number
  column: number
  timestamp: number
}

export interface Step {
  id: string
  index: number
  type: StepType
  target: StepTarget
  value?: string
  url?: string
  screenshot?: string
  timestamp: number
  duration: number
  status: StepStatus
  networkLogs: NetworkLog[]
  consoleLogs: ConsoleLog[]
  errors: ErrorLog[]
  domSnapshot?: string
}

export interface Assertion {
  id: string
  stepIndex: number
  type: AssertionType
  config: AssertionConfig
  result?: AssertionResult
}

export interface AssertionConfig {
  selector?: string
  expectedText?: string
  textMatch?: 'exact' | 'contains' | 'regex'
  expectedStatus?: number
  urlPattern?: string
  customExpression?: string
}

export interface AssertionResult {
  passed: boolean
  actual: string
  expected: string
  message: string
  timestamp: string
}

export interface RecordingConfig {
  browser: BrowserType
  connectionType: ConnectionType
  cdpUrl?: string
  userProfile?: string
  startUrl: string
  storageType: StorageType
  localPath?: string
  gitUrl?: string
  gitBranch?: string
  gitLocalPath?: string
}

export interface RecordingSession {
  id: string
  config: RecordingConfig
  status: 'idle' | 'recording' | 'paused' | 'stopped'
  startTime: number
  endTime?: number
  steps: Step[]
  networkLogs: NetworkLog[]
  consoleLogs: ConsoleLog[]
  errors: ErrorLog[]
  tracePath?: string
  videoPath?: string
}

export interface TestCase {
  id: string
  name: string
  description: string
  tags: string[]
  status: CaseStatus
  steps: Step[]
  assertions: Assertion[]
  group?: string
  createdAt: string
  updatedAt: string
  tracePath?: string
  videoPath?: string
  metadata: {
    browser: { name: string; version: string; channel: string }
    url: string
    viewport: { width: number; height: number }
    recordingDuration: number
    userProfile: string
  }
}

export interface ReplayConfig {
  testCaseId: string
  type: ReplayType
  speed: number
  browser?: BrowserType
  headless?: boolean
}

export interface ReplayResult {
  testCaseId: string
  success: boolean
  totalSteps: number
  passedSteps: number
  failedSteps: number
  duration: number
  assertionResults: AssertionResult[]
  error?: string
}

export interface GitConfig {
  id: string
  name: string
  url: string
  branch: string
  username?: string
  token?: string
  localPath: string
}

export interface AppSettings {
  defaultBrowser: BrowserType
  defaultConnectionType: ConnectionType
  defaultStorageType: StorageType
  defaultLocalPath: string
  gitConfigs: GitConfig[]
  lastMode: 'welcome' | 'recording' | 'management'
  language: string
}
