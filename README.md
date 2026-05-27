# Testify — 用户操作录制与用例管理平台

## 项目简介

Testify 是一款桌面应用，用于录制用户在浏览器中的操作，自动捕获网络请求、控制台输出、错误信息等上下文，并支持用例的管理、回放和断言校验。软件面向两类用户：

- **业务人员**：通过极简的录制界面，一键录制操作流程，无需了解技术细节
- **IT 人员**：通过专业的管理界面，管理用例、编辑断言、回放验证、Git 协作

## 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 桌面框架 | Electron | 33+ | 内置 Node.js，可直接运行 Playwright |
| 前端框架 | React + TypeScript | 18 / 5.6+ | 生态成熟，类型安全 |
| UI 组件库 | Ant Design | 5.x | 企业级 UI，中文生态好 |
| 录制/回放 | Playwright | 1.49+ | CDP、网络拦截、Trace、截图、视频 |
| 状态管理 | Zustand | 5.x | 轻量，适合 Electron IPC 场景 |
| Git 操作 | isomorphic-git | 1.27+ | 纯 JS 实现，无需系统安装 git |
| 构建工具 | electron-vite + Vite | 2.3+ | 开发快，HMR 支持 |
| 打包 | electron-builder | 25+ | macOS / Windows / Linux 多平台 |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- macOS / Windows / Linux

### 安装与运行

```bash
# 克隆项目
git clone <repo-url>
cd testify

# 安装依赖（国内环境建议设置 Electron 镜像）
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 打包（macOS）
npm run build:mac
```

### NPM Scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（HMR） |
| `npm run build` | 构建主进程 + 预加载 + 渲染进程 |
| `npm run preview` | 预览构建产物 |
| `npm run build:mac` | 构建 + 打包 macOS 应用 |
| `npm run build:win` | 构建 + 打包 Windows 应用 |
| `npm run build:linux` | 构建 + 打包 Linux 应用 |

## 项目结构

```
testify/
├── package.json
├── electron.vite.config.ts          # electron-vite 构建配置
├── electron-builder.yml             # 打包配置
├── tsconfig.json                    # TypeScript 根配置
├── tsconfig.node.json               # Node 端 TS 配置
├── tsconfig.web.json                # 渲染进程 TS 配置
│
└── src/
    ├── shared/                      # 共享代码（主进程 + 渲染进程）
    │   ├── types.ts                 # 统一数据模型定义
    │   ├── ipc-channels.ts          # IPC 通道名称常量
    │   └── constants.ts             # 应用常量与中文标签映射
    │
    ├── main/                        # Electron 主进程
    │   ├── index.ts                 # 入口：创建窗口、注册 IPC
    │   ├── ipc/
    │   │   └── index.ts             # IPC 处理器注册中心
    │   └── services/
    │       ├── playwright.ts        # Playwright 浏览器管理服务
    │       ├── recording.ts         # 录制引擎
    │       ├── replay.ts            # 回放引擎
    │       ├── storage.ts           # 本地文件存储服务
    │       └── git.ts               # Git 服务
    │
    ├── preload/
    │   └── index.ts                 # 预加载脚本（contextBridge API）
    │
    └── renderer/                    # 渲染进程（React）
        ├── index.html
        ├── tsconfig.json
        └── src/
            ├── main.tsx             # React 入口
            ├── App.tsx              # 根组件 + 路由
            ├── global.d.ts          # window.api 类型声明
            ├── stores/              # Zustand 状态管理
            │   ├── app.ts           # 应用设置
            │   ├── recording.ts     # 录制状态
            │   └── cases.ts         # 用例管理状态
            ├── pages/               # 页面组件
            │   ├── Welcome.tsx      # 角色选择页
            │   ├── RecordSetup.tsx  # 录制配置页
            │   ├── Recording.tsx    # 录制进行中页
            │   ├── RecordDone.tsx   # 录制完成页
            │   ├── CaseLibrary.tsx  # 用例库页
            │   └── CaseDetail.tsx   # 用例详情页
            ├── components/          # 通用组件
            │   ├── Layout.tsx       # 管理模式布局
            │   ├── StepTimeline.tsx # 步骤时间线
            │   ├── ContextPanel.tsx # 上下文详情面板
            │   └── AssertionEditor.tsx # 断言编辑器
            └── assets/
                └── global.css       # 全局样式
```

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Playwright    │  │ Recording    │  │ Replay       │      │
│  │ Service       │  │ Engine       │  │ Engine       │      │
│  │               │  │              │  │              │      │
│  │ - launch      │  │ - 事件捕获   │  │ - 功能回放   │      │
│  │ - persistent  │  │ - 网络捕获   │  │ - 视觉回放   │      │
│  │ - connect CDP │  │ - 控制台捕获 │  │ - 断言校验   │      │
│  │ - list/detect │  │ - 错误捕获   │  │              │      │
│  └──────┬────────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│  ┌──────┴──────────────────┴──────────────────┴───────┐      │
│  │                  IPC Bridge                        │      │
│  └──────────────────────┬────────────────────────────┘      │
│                         │                                    │
│  ┌──────────────────────┴────────────────────────────┐      │
│  │              Storage & Git Service                 │      │
│  │  - 本地文件系统    - Git clone/push/pull           │      │
│  └───────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
          │                              │
    ┌─────┴──────┐               ┌───────┴────────┐
    │  Renderer   │               │  User's        │
    │  Process    │               │  Browser       │
    │  (Electron) │   Playwright  │  (Chrome/Edge) │
    │             │◄─────────────►│                │
    │  ┌────────┐ │   CDP 连接    │  ┌───────────┐ │
    │  │录制模式│ │               │  │ 注入脚本   │ │
    │  │管理模式│ │               │  │ (事件捕获) │ │
    │  └────────┘ │               │  └───────────┘ │
    └─────────────┘               └────────────────┘
```

### 双模式 UX

应用启动时，用户选择角色进入不同的 UX 模式：

| 模式 | 目标用户 | 界面特点 | 功能范围 |
|------|----------|----------|----------|
| 录制模式 | 业务人员 | 极简，仅配置浏览器和存储位置 | 配置 → 录制 → 暂停/停止 → 保存 |
| 管理模式 | IT 人员 | 专业，完整的用例管理功能 | 用例库、详情、断言、回放、Git |

### 路由结构

| 路径 | 页面 | 模式 |
|------|------|------|
| `/` | Welcome | 通用 |
| `/record/setup` | RecordSetup | 录制 |
| `/record/recording` | Recording | 录制 |
| `/record/done` | RecordDone | 录制 |
| `/manage` | CaseLibrary | 管理 |
| `/manage/case/:id` | CaseDetail | 管理 |

## 核心功能详解

### 1. 浏览器连接

支持三种方式连接用户浏览器：

| 连接方式 | API | 说明 |
|----------|-----|------|
| 启动新浏览器 | `chromium.launch({ channel })` | Playwright 启动用户系统安装的 Chrome/Edge |
| 持久化上下文 | `chromium.launchPersistentContext(userProfile)` | 保留登录态、cookies、localStorage |
| CDP 连接 | `chromium.connectOverCDP(cdpUrl)` | 连接已运行的浏览器（需先 `--remote-debugging-port` 启动） |

支持的浏览器：Chrome、Edge、Chromium、Firefox、WebKit

### 2. 录制引擎

#### 用户操作捕获

通过 `page.addInitScript()` 注入自包含脚本到用户浏览器页面，捕获以下事件：

| 事件类型 | DOM 事件 | 捕获信息 |
|----------|----------|----------|
| click | `click` | 目标元素选择器、XPath、文本、位置 |
| dblclick | `dblclick` | 同上 |
| input | `input` | 目标元素 + 输入值 |
| select | `change` (SELECT) | 目标元素 + 选中值 |
| hover | `mouseover` | 目标元素 |
| keypress | `keydown` (Enter/Tab/Escape) | 目标元素 + 按键值 |
| scroll | `scroll` | 滚动位置 (scrollX, scrollY) |
| navigate | `popstate` | 目标 URL |

注入脚本通过 `console.log('__TESTIFY_EVENT__' + JSON)` 将事件数据传递给主进程，主进程通过 `page.on('console')` 接收并处理。

#### 选择器生成策略

注入脚本为每个操作元素生成两种定位器：

1. **CSS 选择器**：优先使用 `#id`，否则从元素向上遍历 DOM 树生成 `tag:nth-of-type(n) > ...` 路径
2. **XPath**：优先使用 `//*[@id="..."]`，否则生成 `/html/body/tag[n]/...` 路径

#### 上下文自动捕获

Playwright 原生事件监听，用户无感知：

| 上下文类型 | 监听方式 | 捕获内容 |
|------------|----------|----------|
| 网络请求 | `page.on('request')` / `page.on('response')` | URL、方法、状态码、请求/响应头、请求/响应体、耗时、失败信息 |
| 控制台 | `page.on('console')` | 级别 (log/warn/error/info)、文本 |
| 页面错误 | `page.on('pageerror')` | 错误消息、堆栈 |
| 请求失败 | `page.on('requestfailed')` | 失败原因 |

#### Trace 录制

录制开始时自动启动 Playwright Trace：

```typescript
await context.tracing.start({ screenshots: true, snapshots: true, sources: true })
```

录制停止时保存 Trace 文件，用于视觉回放：

```typescript
await context.tracing.stop({ path: tracePath })
```

Trace 文件包含：Timeline、DOM Snapshots、Network、Screenshots、Console

#### 步骤状态判定

每个步骤根据上下文自动判定状态：

| 状态 | 条件 | 显示 |
|------|------|------|
| `normal` | 无异常 | 默认 |
| `warning` | 存在失败的网络请求 (status >= 400) | 黄色警告 |
| `error` | 存在页面错误 | 红色错误 |

### 3. 回放引擎

#### 功能回放

使用 Playwright 逐步执行录制的操作：

| 步骤类型 | 执行方式 |
|----------|----------|
| navigate | `page.goto(url)` |
| click | `page.locator(selector).click()` |
| dblclick | `page.locator(selector).dblclick()` |
| input | `page.locator(selector).fill(value)` |
| select | `page.locator(selector).selectOption(value)` |
| hover | `page.locator(selector).hover()` |
| keypress | `page.keyboard.press(key)` |
| scroll | `page.evaluate(() => window.scrollTo(x, y))` |
| wait | `page.waitForTimeout(ms)` |

支持速度调节（0.5x / 1x / 2x），通过步间延迟实现。

#### 视觉回放

调用 `playwright show-trace` 命令打开 Playwright Trace Viewer，展示完整的操作时间线、DOM 快照和网络请求。

#### 断言校验

回放完成后自动执行断言，支持 7 种断言类型：

| 断言类型 | 校验逻辑 | 配置字段 |
|----------|----------|----------|
| `elementExists` | `locator.count() > 0` | selector |
| `elementVisible` | `locator.isVisible()` | selector |
| `elementText` | 文本匹配（精确/包含/正则） | selector, expectedText, textMatch |
| `statusCode` | 网络请求状态码匹配 | expectedStatus, urlPattern |
| `responseBody` | 响应体匹配 | urlPattern, customExpression |
| `noConsoleErrors` | 无控制台错误 | — |
| `noNetworkErrors` | 无网络请求失败 | — |
| `custom` | 自定义表达式 | customExpression |

### 4. 本地存储

#### 存储结构

```
{basePath}/
└── cases/
    └── {group}/
        └── {caseName}/
            ├── case.json          # 用例元数据 + 步骤定义
            ├── screenshots/       # 步骤截图
            │   ├── step-001.png
            │   └── step-002.png
            ├── trace.zip          # Playwright Trace（视觉回放）
            └── video.webm         # 录屏（可选）
```

#### 存储流程

1. 截图从 base64 data URI 解码保存为 PNG 文件
2. Trace 和视频文件从临时目录复制到用例目录
3. `case.json` 中存储相对路径，加载时还原为绝对路径
4. 加载用例时，截图重新编码为 base64 data URI 供前端显示

### 5. Git 同步

使用 isomorphic-git 实现，无需系统安装 git：

| 操作 | 方法 | 说明 |
|------|------|------|
| clone | `git.clone()` | 浅克隆 (depth=1)，支持指定分支 |
| pull | `git.pull()` | 拉取最新变更 |
| push | `git.push()` | 推送本地提交 |
| commit | `git.add() + git.commit()` | 暂存全部文件并提交 |
| status | `git.statusMatrix()` | 返回 staged/unstaged/untracked 文件列表 |
| remotes | `git.listRemotes()` | 列出远程仓库信息 |

认证方式：通过 `onAuth` 回调提供 username + token，支持 GitHub/GitLab Personal Access Token。

## 数据模型

### 核心类型关系

```
AppSettings
  ├── defaultBrowser: BrowserType
  ├── defaultConnectionType: ConnectionType
  ├── defaultStorageType: StorageType
  ├── defaultLocalPath: string
  ├── gitConfigs: GitConfig[]
  └── lastMode: 'welcome' | 'recording' | 'management'

RecordingConfig
  ├── browser: BrowserType
  ├── connectionType: ConnectionType
  ├── cdpUrl?: string
  ├── userProfile?: string
  ├── startUrl: string
  ├── storageType: StorageType
  └── gitUrl? / gitBranch? / gitLocalPath?

RecordingSession
  ├── id, config, status, startTime, endTime
  ├── steps: Step[]
  ├── networkLogs: NetworkLog[]
  ├── consoleLogs: ConsoleLog[]
  ├── errors: ErrorLog[]
  └── tracePath? / videoPath?

TestCase
  ├── id, name, description, tags, status
  ├── steps: Step[]
  ├── assertions: Assertion[]
  ├── group?, createdAt, updatedAt
  ├── tracePath? / videoPath?
  └── metadata: { browser, url, viewport, recordingDuration, userProfile }

Step
  ├── id, index, type: StepType
  ├── target: StepTarget (selector, xpath, text, role, rect)
  ├── value?, url?, screenshot?
  ├── timestamp, duration, status: StepStatus
  ├── networkLogs: NetworkLog[]
  ├── consoleLogs: ConsoleLog[]
  ├── errors: ErrorLog[]
  └── domSnapshot?

Assertion
  ├── id, stepIndex
  ├── type: AssertionType
  ├── config: AssertionConfig
  └── result?: AssertionResult

ReplayConfig
  ├── testCaseId
  ├── type: ReplayType ('functional' | 'visual')
  ├── speed: number
  ├── browser?: BrowserType
  └── headless?: boolean

ReplayResult
  ├── testCaseId, success
  ├── totalSteps, passedSteps, failedSteps
  ├── duration
  ├── assertionResults: AssertionResult[]
  └── error?
```

### 枚举类型

| 类型 | 值 | 中文标签 |
|------|-----|----------|
| BrowserType | `chrome` `edge` `chromium` `firefox` `webkit` | Chrome / Edge / Chromium / Firefox / WebKit |
| ConnectionType | `launch` `persistent` `cdp` | 启动新浏览器 / 持久化上下文 / CDP 连接 |
| StorageType | `local` `git` | 本地 / Git 仓库 |
| StepType | `click` `dblclick` `input` `navigate` `scroll` `select` `hover` `keypress` `wait` `upload` `download` | 点击/双击/输入/导航/滚动/选择/悬停/按键/等待/上传/下载 |
| StepStatus | `normal` `warning` `error` | 正常 / 警告 / 错误 |
| CaseStatus | `draft` `active` `deprecated` | 草稿 / 活跃 / 已弃用 |
| AssertionType | `elementExists` `elementVisible` `elementText` `statusCode` `responseBody` `noConsoleErrors` `noNetworkErrors` `custom` | 元素存在/元素可见/元素文本/状态码/响应体/无控制台错误/无网络错误/自定义 |
| ReplayType | `functional` `visual` | 功能回放 / 视觉回放 |

## IPC 通信协议

### 通道列表

| 通道 | 方向 | 参数 | 返回值 |
|------|------|------|--------|
| `app:getSettings` | R→M→R | — | `AppSettings` |
| `app:saveSettings` | R→M→R | `AppSettings` | `{ success }` |
| `recording:start` | R→M→R | `RecordingConfig` | `{ success, data?: RecordingSession, error? }` |
| `recording:pause` | R→M→R | — | `{ success }` |
| `recording:resume` | R→M→R | — | `{ success }` |
| `recording:stop` | R→M→R | — | `{ success, data?: RecordingSession, error? }` |
| `recording:getSession` | R→M→R | — | `RecordingSession \| null` |
| `recording:onStep` | M→R | `Step` | — |
| `recording:onNetwork` | M→R | `NetworkLog` | — |
| `recording:onConsole` | M→R | `ConsoleLog` | — |
| `recording:onError` | M→R | `ErrorLog` | — |
| `case:list` | R→M→R | — | `{ success, data: TestCase[] }` |
| `case:get` | R→M→R | `id: string` | `{ success, data?: TestCase }` |
| `case:save` | R→M→R | `TestCase` | `{ success, data?: string }` |
| `case:delete` | R→M→R | `id: string` | `{ success }` |
| `case:update` | R→M→R | `TestCase` | `{ success, data?: string }` |
| `case:export` | R→M→R | `id, exportPath` | `{ success }` |
| `case:import` | R→M→R | `importPath` | `{ success }` |
| `replay:start` | R→M→R | `ReplayConfig` | `{ success, data?: ReplayResult, error? }` |
| `replay:stop` | R→M→R | — | `{ success }` |
| `replay:getStatus` | R→M→R | — | `{ isReplaying }` |
| `replay:onStep` | M→R | `{ stepId, status, error? }` | — |
| `replay:onAssertion` | M→R | `AssertionResult` | — |
| `replay:onComplete` | M→R | `ReplayResult` | — |
| `browser:list` | R→M→R | — | `{ success, data: BrowserInfo[] }` |
| `browser:checkCdp` | R→M→R | `url: string` | `{ success, data: boolean }` |
| `git:clone` | R→M→R | `url, localPath, options?` | `{ success, error? }` |
| `git:pull` | R→M→R | `localPath` | `{ success, error? }` |
| `git:push` | R→M→R | `localPath` | `{ success, error? }` |
| `git:status` | R→M→R | `localPath` | `{ success, data? }` |
| `git:commit` | R→M→R | `localPath, message` | `{ success, data? }` |
| `git:remotes` | R→M→R | `localPath` | `{ success, data? }` |
| `dialog:openFolder` | R→M→R | — | `{ success, data?: string }` |

> 方向说明：R→M→R = 渲染进程请求主进程并等待响应；M→R = 主进程主动推送给渲染进程

### 返回值约定

所有 IPC 调用统一返回 `{ success: boolean, data?: T, error?: string }` 格式。

## 状态管理

使用 Zustand 管理渲染进程状态，三个独立 Store：

### AppStore (`stores/app.ts`)

管理应用模式和设置：

| 字段 | 类型 | 说明 |
|------|------|------|
| mode | `'welcome' \| 'recording' \| 'management'` | 当前模式 |
| settings | `AppSettings` | 应用设置 |

### RecordingStore (`stores/recording.ts`)

管理录制状态：

| 字段 | 类型 | 说明 |
|------|------|------|
| session | `RecordingSession \| null` | 当前录制会话 |
| config | `RecordingConfig \| null` | 录制配置 |
| isRecording | `boolean` | 是否正在录制 |
| isPaused | `boolean` | 是否暂停 |
| steps | `Step[]` | 已录制的步骤 |
| errorCount | `number` | 错误计数 |
| networkErrorCount | `number` | 网络错误计数 |

### CasesStore (`stores/cases.ts`)

管理用例和回放状态：

| 字段 | 类型 | 说明 |
|------|------|------|
| cases | `TestCase[]` | 用例列表 |
| currentCase | `TestCase \| null` | 当前查看的用例 |
| replayResult | `ReplayResult \| null` | 回放结果 |
| isReplaying | `boolean` | 是否正在回放 |
| loading | `boolean` | 是否加载中 |

## 开发路线图

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | Electron 骨架 + 启动页 + 双模式路由 | ✅ 已完成 |
| Phase 2 | Playwright 集成 + 录制引擎 | ✅ 已完成 |
| Phase 3 | 用例保存 + 本地存储 | ✅ 已完成 |
| Phase 4 | 管理模式 UI（用例库、详情、标签、筛选） | ✅ 已完成 |
| Phase 5 | 功能回放 + 视觉回放 + 断言校验 | ✅ 已完成 |
| Phase 6 | Git 同步（clone/push/pull/冲突处理） | ✅ 基础完成 |
| Phase 7 | 体验打磨（智能命名、异常高亮、引导流程、快捷键） | 🔲 待开发 |
| Phase 8 | 高级功能（批量回放、报告导出、CI 集成） | 🔲 待开发 |

## 已知限制与待改进

1. **选择器稳定性**：当前选择器基于 DOM 结构生成，前端改版可能导致回放失败。未来可引入 AI 视觉定位作为备选
2. **断言运行时校验**：`noConsoleErrors` 和 `noNetworkErrors` 断言目前返回固定值，需要在回放时实时收集控制台和网络错误
3. **Git 冲突处理**：当前 Git 同步不支持冲突检测和解决，需要手动处理
4. **iframe 支持**：注入脚本目前不支持 iframe 内的操作捕获
5. **文件上传/下载**：upload 和 download 步骤类型已定义但录制捕获逻辑待完善
