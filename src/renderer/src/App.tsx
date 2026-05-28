import React, { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { useAppStore } from './stores/app'
import Welcome from './pages/Welcome'
import RecordSetup from './pages/RecordSetup'
import Recording from './pages/Recording'
import RecordDone from './pages/RecordDone'
import CaseLibrary from './pages/CaseLibrary'
import CaseDetail from './pages/CaseDetail'
import ReplayCenter from './pages/ReplayCenter'
import Settings from './pages/Settings'
import Layout from './components/Layout'

const App: React.FC = () => {
  const { loadSettings } = useAppStore()

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <ConfigProvider locale={zhCN}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/record/setup" element={<RecordSetup />} />
          <Route path="/record/recording" element={<Recording />} />
          <Route path="/record/done" element={<RecordDone />} />
          <Route path="/manage" element={<Layout />}>
            <Route index element={<CaseLibrary />} />
            <Route path="case/:id" element={<CaseDetail />} />
            <Route path="replay" element={<ReplayCenter />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </ConfigProvider>
  )
}

export default App
