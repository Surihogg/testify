import React from 'react'
import { Layout, Menu, Button, Typography, Space, Tag } from 'antd'
import {
  FolderOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../stores/app'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const LayoutComponent: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setMode } = useAppStore()

  const selectedKey = location.pathname.startsWith('/manage/case')
    ? '/manage'
    : location.pathname

  const handleSwitchMode = () => {
    setMode('welcome')
    navigate('/')
  }

  const menuItems = [
    {
      key: '/manage',
      icon: <FolderOutlined />,
      label: '用例库'
    },
    {
      key: '/manage/replay',
      icon: <PlayCircleOutlined />,
      label: '回放中心'
    },
    {
      key: '/manage/settings',
      icon: <SettingOutlined />,
      label: '设置'
    }
  ]

  return (
    <Layout style={{ height: '100%', overflow: 'hidden' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          height: 56,
          lineHeight: '56px',
          flexShrink: 0,
          WebkitAppRegion: 'drag',
          WebkitUserSelect: 'none',
        } as React.CSSProperties}
      >
        <Space size={16} align="center">
          <Text strong style={{ fontSize: 18, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Testify
          </Text>
          <Tag color="purple">管理模式</Tag>
        </Space>
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Button
            icon={<SwapOutlined />}
            onClick={handleSwitchMode}
            size="small"
          >
            切换模式
          </Button>
        </div>
      </Header>
      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        <Sider
          width={200}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
            flexShrink: 0,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0, marginTop: 8 }}
          />
        </Sider>
        <Content style={{ background: '#f5f5f5', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default LayoutComponent
