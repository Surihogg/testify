import React from 'react'
import { Tabs, Table, Tag, Typography } from 'antd'
import {
  CodeOutlined,
  BugOutlined,
  CloseCircleOutlined,
  CameraOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import type { Step } from '../../../shared/types'

const { Text } = Typography

interface ContextPanelProps {
  step: Step | null
}

const ContextPanel: React.FC<ContextPanelProps> = ({ step }) => {
  if (!step) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Text type="secondary">请选择一个步骤查看上下文详情</Text>
      </div>
    )
  }

  const networkColumns = [
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => <Tag>{method}</Tag>
    },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status >= 400 ? 'error' : status >= 300 ? 'warning' : 'success'}>
          {status}
        </Tag>
      )
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (d: number) => `${d}ms`
    }
  ]

  const consoleLevelIcons: Record<string, React.ReactNode> = {
    log: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
    warn: <WarningOutlined style={{ color: '#faad14' }} />,
    error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    info: <InfoCircleOutlined style={{ color: '#52c41a' }} />
  }

  return (
    <Tabs
      defaultActiveKey="network"
      items={[
        {
          key: 'network',
          label: '网络请求',
          icon: <CodeOutlined />,
          children: (
            <Table
              columns={networkColumns}
              dataSource={step.networkRequests}
              rowKey="id"
              size="small"
              pagination={false}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: 8 }}>
                    <Text strong>请求头</Text>
                    <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                      {JSON.stringify(record.requestHeaders, null, 2)}
                    </pre>
                    {record.responseHeaders && (
                      <>
                        <Text strong style={{ marginTop: 8, display: 'block' }}>响应头</Text>
                        <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                          {JSON.stringify(record.responseHeaders, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                )
              }}
            />
          )
        },
        {
          key: 'console',
          label: '控制台',
          icon: <BugOutlined />,
          children: step.consoleMessages.length > 0 ? (
            <div>
              {step.consoleMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '6px 12px',
                    borderBottom: '1px solid #f5f5f5',
                    background: msg.level === 'error' ? '#fff2f0' : msg.level === 'warn' ? '#fffbe6' : '#fff'
                  }}
                >
                  <span style={{ marginRight: 8, marginTop: 2 }}>
                    {consoleLevelIcons[msg.level]}
                  </span>
                  <Text style={{ flex: 1 }}>{msg.text}</Text>
                  <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN')}
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary">该步骤无控制台输出</Text>
          )
        },
        {
          key: 'errors',
          label: '错误',
          icon: <CloseCircleOutlined />,
          children: step.errors.length > 0 ? (
            <div>
              {step.errors.map((err) => (
                <div
                  key={err.id}
                  style={{
                    padding: 10,
                    background: '#fff2f0',
                    borderRadius: 6,
                    marginBottom: 8,
                    border: '1px solid #ffccc7'
                  }}
                >
                  <Text type="danger" strong>{err.message}</Text>
                  {err.stack && (
                    <pre style={{ fontSize: 12, marginTop: 6, background: '#fff', padding: 8, borderRadius: 4, maxHeight: 120, overflow: 'auto' }}>
                      {err.stack}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary">该步骤无错误</Text>
          )
        },
        {
          key: 'dom',
          label: 'DOM 快照',
          icon: <CameraOutlined />,
          children: step.domSnapshot ? (
            <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 12, borderRadius: 6, maxHeight: 300, overflow: 'auto' }}>
              {step.domSnapshot}
            </pre>
          ) : (
            <Text type="secondary">该步骤无 DOM 快照</Text>
          )
        }
      ]}
    />
  )
}

export default ContextPanel
