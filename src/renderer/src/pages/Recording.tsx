import React, { useEffect, useState, useRef, useMemo } from 'react'
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
import type { StepType } from '../../../shared/types'
import { STEP_TYPE_LABELS } from '../../../shared/constants'

const { Text } = Typography

const stepTypeColors: Record<string, string> = {
  click: '#1890ff',
  dblclick: '#1890ff',
  input: '#52c41a',
  navigate: '#722ed1',
  scroll: '#faad14',
  select: '#13c2c2',
  keypress: '#fa8c16',
  wait: '#8c8c8c',
  upload: '#2f54eb',
  download: '#a0d911',
}

const Recording: React.FC = () => {
  const navigate = useNavigate()
  const {
    isRecording, isPaused, stepCount, errorCount, networkErrorCount,
    recentSteps, startRecording, pauseRecording, resumeRecording, stopRecording
  } = useRecordingStore()
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
  }, [recentSteps.length])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStop = async () => {
    await stopRecording()
    navigate('/record/done')
  }

  const displaySteps = useMemo(() => {
    return recentSteps.slice(-30)
  }, [recentSteps])

  return (
    <div
      className="page-container"
      style={{ background: '#f0f2f5' }}
    >
      <div
        className="titlebar-drag"
        style={{
          background: '#fff',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 10,
          flexShrink: 0,
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
            步骤: {stepCount}
          </Tag>
          {errorCount > 0 && (
            <Tag color="error" style={{ fontSize: 14, padding: '4px 12px' }}>
              错误: {errorCount}
            </Tag>
          )}
          {networkErrorCount > 0 && (
            <Tag color="warning" style={{ fontSize: 14, padding: '4px 12px' }}>
              接口异常: {networkErrorCount}
            </Tag>
          )}
        </Space>

        <Space size={12} className="titlebar-no-drag">
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
          {stepCount === 0 && (
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

          {stepCount > recentSteps.length && (
            <div style={{ textAlign: 'center', color: '#999', marginBottom: 16, fontSize: 12 }}>
              显示最近 {recentSteps.length} 步（共 {stepCount} 步）
            </div>
          )}

          {displaySteps.map((step) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: 12,
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
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
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  marginRight: 12
                }}
              >
                {step.index}
              </div>
              <div
                style={{
                  flex: 1,
                  background: '#fff',
                  borderRadius: 8,
                  padding: '10px 14px',
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
                      {STEP_TYPE_LABELS[step.type] || step.type}
                    </Tag>
                    <Text ellipsis style={{ maxWidth: 300 }}>
                      {step.target?.text || step.target?.selector || ''}
                    </Text>
                    {step.value && (
                      <Text type="secondary" code style={{ fontSize: 12 }}>
                        {step.value.length > 50 ? step.value.slice(0, 50) + '...' : step.value}
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
                  </Space>
                </div>
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
