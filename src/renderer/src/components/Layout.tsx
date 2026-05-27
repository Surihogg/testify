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
  const { setMode, updateSettings, saveSettings } = useAppStore()

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
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          height: 56,
          lineHeight: '56px'
        }}
      >
        <Space size={16} align="center">
          <Text strong style={{ fontSize: 18, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Testify
          </Text>
          <Tag color="purple">管理模式</Tag>
        </Space>
        <Button
          icon={<SwapOutlined />}
          onClick={handleSwitchMode}
          size="small"
        >
          切换模式
        </Button>
      </Header>
      <Layout>
        <Sider
          width={200}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0'
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
        <Content style={{ background: '#fff', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default LayoutComponent
