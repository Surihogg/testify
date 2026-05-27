import React, { useEffect, useState, useRef } from 'react'
import { Button, Badge, Tag, Space, Typography } from 'antd'
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useRecordingStore } from '../stores/recording'
import type { Step, StepType } from '../../../shared/types'

const { Text } = Typography

const stepTypeLabels: Record<StepType, string> = {
  click: '点击',
  dblclick: '双击',
  input: '输入',
  navigate: '导航',
  scroll: '滚动',
  select: '选择',
  hover: '悬停',
  keypress: '按键',
  wait: '等待',
  assert: '断言',
  screenshot: '截图'
}

const stepTypeColors: Record<StepType, string> = {
  click: '#1890ff',
  dblclick: '#1890ff',
  input: '#52c41a',
  navigate: '#722ed1',
  scroll: '#faad14',
  select: '#13c2c2',
  hover: '#eb2f96',
  keypress: '#fa8c16',
  wait: '#8c8c8c',
  assert: '#2f54eb',
  screenshot: '#a0d911'
}

const Recording: React.FC = () => {
  const navigate = useNavigate()
  const { isRecording, isPaused, steps, startRecording, pauseRecording, resumeRecording, stopRecording } =
    useRecordingStore()
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording, isPaused])

  useEffect(() => {
    if (!isRecording) {
      startRecording()
    }
  }, [])

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps])

  const errorCount = steps.filter((s) => s.status === 'error' || s.status === 'warning').length

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStop = async () => {
    await stopRecording()
    navigate('/record/done')
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f0f2f5'
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 10
        }}
      >
        <Space size={24} align="center">
          <Badge status={isPaused ? 'warning' : 'processing'} />
          <Text strong style={{ fontSize: 16 }}>
            {isPaused ? '已暂停' : '录制中'}
          </Text>
          <Text style={{ fontSize: 24, fontFamily: 'monospace', color: '#667eea' }}>
            {formatTime(elapsed)}
          </Text>
        </Space>

        <Space size={16} align="center">
          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
            步骤: {steps.length}
          </Tag>
          {errorCount > 0 && (
            <Tag color="warning" style={{ fontSize: 14, padding: '4px 12px' }}>
              异常: {errorCount}
            </Tag>
          )}
        </Space>

        <Space size={12}>
          {isPaused ? (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={resumeRecording}
              style={{ borderRadius: 6 }}
            >
              继续
            </Button>
          ) : (
            <Button
              icon={<PauseCircleOutlined />}
              onClick={pauseRecording}
              style={{ borderRadius: 6 }}
            >
              暂停
            </Button>
          )}
          <Button
            danger
            icon={<StopOutlined />}
            onClick={handleStop}
            style={{ borderRadius: 6 }}
          >
            停止录制
          </Button>
        </Space>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px'
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {steps.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 0',
                color: '#999'
              }}
            >
              <LoadingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <div style={{ fontSize: 16 }}>等待操作录制...</div>
            </div>
          )}

          {steps.map((step, index) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: 16,
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background:
                    step.status === 'error'
                      ? '#ff4d4f'
                      : step.status === 'warning'
                        ? '#faad14'
                        : stepTypeColors[step.type] || '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                  marginRight: 16
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  background: '#fff',
                  borderRadius: 8,
                  padding: '12px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  borderLeft:
                    step.status === 'error'
                      ? '3px solid #ff4d4f'
                      : step.status === 'warning'
                        ? '3px solid #faad14'
                        : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space size={8} align="center">
                    <Tag
                      color={stepTypeColors[step.type]}
                      style={{ margin: 0 }}
                    >
                      {stepTypeLabels[step.type]}
                    </Tag>
                    <Text>{step.target}</Text>
                    {step.value && (
                      <Text type="secondary" code>
                        {step.value}
                      </Text>
                    )}
                  </Space>
                  <Space size={8} align="center">
                    {step.status === 'error' && (
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    {step.status === 'warning' && (
                      <WarningOutlined style={{ color: '#faad14' }} />
                    )}
                    {step.status === 'normal' && (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(step.timestamp).toLocaleTimeString('zh-CN')}
                    </Text>
                  </Space>
                </div>
                {step.errors.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {step.errors.map((err) => (
                      <Text key={err.id} type="danger" style={{ fontSize: 12, display: 'block' }}>
                        {err.message}
                      </Text>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={stepsEndRef} />
        </div>
      </div>
    </div>
  )
}

export default Recording
