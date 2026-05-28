import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, Select, Radio, message, Typography, Card, Statistic, Row, Col, Progress } from 'antd'
import { PlayCircleOutlined, StopOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useCasesStore } from '../stores/cases'
import { useNavigate } from 'react-router-dom'
import type { TestCase, ReplayType } from '../../../shared/types'
import { CASE_STATUS_LABELS, CASE_STATUS_COLORS } from '../../../shared/constants'

const { Title } = Typography

const ReplayCenter: React.FC = () => {
  const navigate = useNavigate()
  const { cases, loadCases, startReplay, stopReplay, isReplaying, replayResult } = useCasesStore()
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [replayType, setReplayType] = useState<ReplayType>('functional')
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    loadCases()
  }, [])

  const activeCases = cases.filter((c) => c.status === 'active')

  const handleStartReplay = async () => {
    if (!selectedCaseId) {
      message.warning('请选择要回放的用例')
      return
    }
    await startReplay({
      testCaseId: selectedCaseId,
      type: replayType,
      speed,
      browser: 'chrome',
    })
  }

  const columns = [
    {
      title: '用例名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '步骤数',
      dataIndex: 'steps',
      key: 'steps',
      render: (steps: unknown[]) => steps?.length || 0,
    },
    {
      title: '断言数',
      dataIndex: 'assertions',
      key: 'assertions',
      render: (assertions: unknown[]) => assertions?.length || 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={CASE_STATUS_COLORS[status] || 'default'}>
          {CASE_STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: TestCase) => (
        <Space>
          <Button
            size="small"
            type={selectedCaseId === record.id ? 'primary' : 'default'}
            onClick={() => setSelectedCaseId(record.id)}
          >
            选择
          </Button>
          <Button size="small" onClick={() => navigate(`/manage/case/${record.id}`)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>回放中心</Title>
      </div>
      <div className="page-body">

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={8}>
            <div style={{ marginBottom: 8, color: '#666' }}>回放用例</div>
            <Select
              style={{ width: '100%' }}
              placeholder="选择要回放的用例"
              value={selectedCaseId}
              onChange={setSelectedCaseId}
              options={activeCases.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>回放模式</div>
            <Radio.Group value={replayType} onChange={(e) => setReplayType(e.target.value)}>
              <Radio value="functional">功能回放</Radio>
              <Radio value="visual">视觉回放</Radio>
            </Radio.Group>
          </Col>
          <Col span={4}>
            <div style={{ marginBottom: 8, color: '#666' }}>速度</div>
            <Select value={speed} onChange={setSpeed} style={{ width: '100%' }}>
              <Select.Option value={0.5}>0.5x</Select.Option>
              <Select.Option value={1}>1x</Select.Option>
              <Select.Option value={2}>2x</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>&nbsp;</div>
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartReplay}
                loading={isReplaying}
                disabled={!selectedCaseId || isReplaying}
              >
                开始回放
              </Button>
              <Button
                icon={<StopOutlined />}
                onClick={stopReplay}
                disabled={!isReplaying}
              >
                停止
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {replayResult && (
        <Card style={{ marginBottom: 24 }}>
          <Title level={5}>回放结果</Title>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="结果"
                value={replayResult.success ? '通过' : '失败'}
                valueStyle={{ color: replayResult.success ? '#3f8600' : '#cf1322' }}
                prefix={replayResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic title="总步骤" value={replayResult.totalSteps} />
            </Col>
            <Col span={6}>
              <Statistic title="通过步骤" value={replayResult.passedSteps} valueStyle={{ color: '#3f8600' }} />
            </Col>
            <Col span={6}>
              <Statistic title="失败步骤" value={replayResult.failedSteps} valueStyle={{ color: '#cf1322' }} />
            </Col>
          </Row>
          {replayResult.totalSteps > 0 && (
            <Progress
              percent={Math.round((replayResult.passedSteps / replayResult.totalSteps) * 100)}
              status={replayResult.success ? 'success' : 'exception'}
              style={{ marginTop: 16 }}
            />
          )}
          {replayResult.assertionResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>断言结果：</div>
              {replayResult.assertionResults.map((ar, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <Tag color={ar.passed ? 'green' : 'red'}>
                    {ar.passed ? '通过' : '失败'}
                  </Tag>
                  <span>{ar.message}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card>
        <Title level={5}>活跃用例</Title>
        <Table
          columns={columns}
          dataSource={activeCases}
          rowKey="id"
          size="small"
          pagination={false}
          style={{ marginTop: 16 }}
        />
      </Card>
      </div>
    </div>
  )
}

export default ReplayCenter
