import React from 'react'
import { Tag, Badge } from 'antd'
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import type { Step, StepType } from '../../../shared/types'

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

interface StepTimelineProps {
  steps: Step[]
  currentStepIndex: number
  onStepClick: (index: number) => void
}

const StepTimeline: React.FC<StepTimelineProps> = ({ steps, currentStepIndex, onStepClick }) => {
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex
          const hasError = step.status === 'error'
          const hasWarning = step.status === 'warning'

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => onStepClick(index)}
                style={{
                  minWidth: 160,
                  maxWidth: 200,
                  padding: 12,
                  background: isActive ? '#f0f5ff' : '#fff',
                  border: isActive
                    ? '2px solid #667eea'
                    : hasError
                      ? '2px solid #ff4d4f'
                      : hasWarning
                        ? '2px solid #faad14'
                        : '1px solid #e8e8e8',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#999'
                    }}
                  >
                    #{index + 1}
                  </span>
                  {hasError && <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 14 }} />}
                  {hasWarning && !hasError && <WarningOutlined style={{ color: '#faad14', fontSize: 14 }} />}
                  {!hasError && !hasWarning && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />}
                </div>
                <Tag
                  color={stepTypeColors[step.type]}
                  style={{ fontSize: 11, marginBottom: 4 }}
                >
                  {stepTypeLabels[step.type]}
                </Tag>
                <div
                  style={{
                    fontSize: 12,
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {step.target}
                </div>
                {step.screenshot && (
                  <div
                    style={{
                      marginTop: 8,
                      height: 60,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      backgroundImage: `url(${step.screenshot})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'top left'
                    }}
                  />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#d9d9d9',
                    fontSize: 12
                  }}
                >
                  <ArrowRightOutlined />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default StepTimeline
