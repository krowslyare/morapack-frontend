import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { simulationService } from '../../api/simulationService'
import type {
  SimulationReportResponse,
  BottlenecksReportResponse,
  FailuresReportResponse,
  CollapseScenarioRequest,
  CollapseScenarioResponse,
} from '../../api/simulationService'
import { toast } from 'react-toastify'

const SystemReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'bottlenecks' | 'failures' | 'collapse'>(
    'overview'
  )

  // Report data
  const [systemReport, setSystemReport] = useState<SimulationReportResponse | null>(null)
  const [bottlenecksReport, setBottlenecksReport] = useState<BottlenecksReportResponse | null>(null)
  const [failuresReport, setFailuresReport] = useState<FailuresReportResponse | null>(null)
  const [collapseReport, setCollapseReport] = useState<CollapseScenarioResponse | null>(null)

  // Collapse scenario form
  const [collapseForm, setCollapseForm] = useState<CollapseScenarioRequest>({
    airportId: 1,
    collapseStartTime: new Date().toISOString().slice(0, 16), // datetime-local format
    collapseDurationHours: 6,
  })

  useEffect(() => {
    // Load initial reports
    loadSystemReport()
    loadBottlenecksReport()
    loadFailuresReport()
  }, [])

  const loadSystemReport = async () => {
    setLoading(true)
    try {
      const report = await simulationService.getSystemReport()
      setSystemReport(report)
    } catch (error) {
      console.error('Failed to load system report:', error)
      toast.error('Failed to load system report')
    } finally {
      setLoading(false)
    }
  }

  const loadBottlenecksReport = async () => {
    try {
      const report = await simulationService.getBottlenecksReport()
      setBottlenecksReport(report)
    } catch (error) {
      console.error('Failed to load bottlenecks report:', error)
    }
  }

  const loadFailuresReport = async () => {
    try {
      const report = await simulationService.getFailuresReport()
      setFailuresReport(report)
    } catch (error) {
      console.error('Failed to load failures report:', error)
    }
  }

  const simulateCollapse = async () => {
    setLoading(true)
    try {
      const report = await simulationService.simulateHubCollapse(collapseForm)
      setCollapseReport(report)
      toast.success('Collapse scenario simulated successfully')
    } catch (error) {
      console.error('Failed to simulate collapse:', error)
      toast.error('Failed to simulate collapse scenario')
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#4caf50'
    if (score >= 60) return '#ff9800'
    return '#f44336'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return '#f44336'
      case 'HIGH':
        return '#ff5722'
      case 'WARNING':
      case 'MEDIUM':
        return '#ff9800'
      default:
        return '#2196f3'
    }
  }

  return (
    <Container>
      <Header>
        <Title>🔍 System Analysis & Reports</Title>
        <RefreshButton onClick={() => {
          loadSystemReport()
          loadBottlenecksReport()
          loadFailuresReport()
        }}>
          🔄 Refresh All
        </RefreshButton>
      </Header>

      <TabContainer>
        <Tab
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </Tab>
        <Tab
          active={activeTab === 'bottlenecks'}
          onClick={() => setActiveTab('bottlenecks')}
        >
          ⚠️ Bottlenecks
        </Tab>
        <Tab
          active={activeTab === 'failures'}
          onClick={() => setActiveTab('failures')}
        >
          ❌ Failures
        </Tab>
        <Tab
          active={activeTab === 'collapse'}
          onClick={() => setActiveTab('collapse')}
        >
          💥 Collapse Simulation
        </Tab>
      </TabContainer>

      {loading && <LoadingOverlay>Loading...</LoadingOverlay>}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && systemReport && (
        <Content>
          <Section>
            <SectionTitle>System Health Score</SectionTitle>
            <HealthScoreContainer>
              <HealthScore color={getHealthColor(systemReport.systemHealth.overallScore)}>
                {systemReport.systemHealth.overallScore}/100
              </HealthScore>
              <HealthDetails>
                <HealthItem>
                  <span>Unassigned Score:</span>
                  <span>{systemReport.systemHealth.unassignedScore}</span>
                </HealthItem>
                <HealthItem>
                  <span>Warehouse Score:</span>
                  <span>{systemReport.systemHealth.warehouseScore}</span>
                </HealthItem>
                <HealthItem>
                  <span>Flight Utilization:</span>
                  <span>{systemReport.systemHealth.flightUtilizationScore}</span>
                </HealthItem>
                <HealthItem>
                  <span>Delivery Score:</span>
                  <span>{systemReport.systemHealth.deliveryScore}</span>
                </HealthItem>
                <HealthItem critical>
                  <span>Critical Issues:</span>
                  <span>{systemReport.systemHealth.criticalIssues}</span>
                </HealthItem>
              </HealthDetails>
            </HealthScoreContainer>
          </Section>

          <Section>
            <SectionTitle>Unassigned Orders</SectionTitle>
            <MetricsGrid>
              <MetricCard>
                <MetricValue>{systemReport.unassignedOrders.unassignedOrders}</MetricValue>
                <MetricLabel>Unassigned Orders</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{systemReport.unassignedOrders.unassignedProducts}</MetricValue>
                <MetricLabel>Unassigned Products</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{systemReport.unassignedOrders.unassignedPercentage}%</MetricValue>
                <MetricLabel>Unassigned Percentage</MetricLabel>
              </MetricCard>
            </MetricsGrid>
          </Section>

          <Section>
            <SectionTitle>Warehouse Saturation</SectionTitle>
            <MetricsGrid>
              <MetricCard>
                <MetricValue>{systemReport.warehouseSaturation.saturatedWarehouses}</MetricValue>
                <MetricLabel>Saturated Warehouses (≥80%)</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{systemReport.warehouseSaturation.totalWarehouses}</MetricValue>
                <MetricLabel>Total Warehouses</MetricLabel>
              </MetricCard>
            </MetricsGrid>
            {systemReport.warehouseSaturation.details.length > 0 && (
              <Table>
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Current</th>
                    <th>Max</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {systemReport.warehouseSaturation.details.map((w) => (
                    <tr key={w.warehouseId}>
                      <td>{w.city}</td>
                      <td>{w.currentCapacity}</td>
                      <td>{w.maxCapacity}</td>
                      <td>
                        <UtilizationBar
                          percent={w.utilizationPercent}
                          color={
                            w.utilizationPercent >= 95
                              ? '#f44336'
                              : w.utilizationPercent >= 80
                              ? '#ff9800'
                              : '#4caf50'
                          }
                        >
                          {w.utilizationPercent}%
                        </UtilizationBar>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Section>

          <Section>
            <SectionTitle>Flight Utilization</SectionTitle>
            <MetricsGrid>
              <MetricCard>
                <MetricValue>{systemReport.flightUtilization.underutilized}</MetricValue>
                <MetricLabel>Underutilized (&lt;30%)</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{systemReport.flightUtilization.wellUtilized}</MetricValue>
                <MetricLabel>Well Utilized (30-90%)</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{systemReport.flightUtilization.overUtilized}</MetricValue>
                <MetricLabel>Over Utilized (&gt;90%)</MetricLabel>
              </MetricCard>
            </MetricsGrid>
          </Section>

          <Section>
            <SectionTitle>Recommendations</SectionTitle>
            <RecommendationsList>
              {systemReport.recommendations.map((rec, idx) => (
                <RecommendationItem
                  key={idx}
                  severity={rec.startsWith('CRITICAL') ? 'critical' : rec.startsWith('HIGH') ? 'high' : 'medium'}
                >
                  {rec}
                </RecommendationItem>
              ))}
            </RecommendationsList>
          </Section>
        </Content>
      )}

      {/* BOTTLENECKS TAB */}
      {activeTab === 'bottlenecks' && bottlenecksReport && (
        <Content>
          <Section>
            <SectionTitle>
              Bottlenecks Found: {bottlenecksReport.bottlenecksFound}
            </SectionTitle>
            {bottlenecksReport.bottlenecks.length === 0 ? (
              <EmptyState>No bottlenecks detected ✅</EmptyState>
            ) : (
              <IssuesList>
                {bottlenecksReport.bottlenecks.map((b, idx) => (
                  <IssueCard key={idx} severity={b.severity}>
                    <IssueHeader>
                      <IssueType>{b.type.replace(/_/g, ' ')}</IssueType>
                      <IssueSeverity color={getSeverityColor(b.severity)}>
                        {b.severity}
                      </IssueSeverity>
                    </IssueHeader>
                    <IssueDescription>{b.description}</IssueDescription>
                    {b.location && <IssueLocation>📍 {b.location}</IssueLocation>}
                  </IssueCard>
                ))}
              </IssuesList>
            )}
          </Section>
        </Content>
      )}

      {/* FAILURES TAB */}
      {activeTab === 'failures' && failuresReport && (
        <Content>
          <Section>
            <SectionTitle>
              Failures Found: {failuresReport.failuresFound}
            </SectionTitle>
            {failuresReport.failures.length === 0 ? (
              <EmptyState>No failures detected ✅</EmptyState>
            ) : (
              <IssuesList>
                {failuresReport.failures.map((f, idx) => (
                  <IssueCard key={idx} severity={f.severity}>
                    <IssueHeader>
                      <IssueType>{f.type.replace(/_/g, ' ')}</IssueType>
                      <IssueSeverity color={getSeverityColor(f.severity)}>
                        {f.severity}
                      </IssueSeverity>
                    </IssueHeader>
                    <IssueDescription>{f.description}</IssueDescription>
                  </IssueCard>
                ))}
              </IssuesList>
            )}
          </Section>
        </Content>
      )}

      {/* COLLAPSE SIMULATION TAB */}
      {activeTab === 'collapse' && (
        <Content>
          <Section>
            <SectionTitle>Simulate Hub Collapse</SectionTitle>
            <Form>
              <FormGroup>
                <Label>Airport ID</Label>
                <Input
                  type="number"
                  value={collapseForm.airportId}
                  onChange={(e) =>
                    setCollapseForm({ ...collapseForm, airportId: parseInt(e.target.value) })
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>Collapse Start Time</Label>
                <Input
                  type="datetime-local"
                  value={collapseForm.collapseStartTime.slice(0, 16)}
                  onChange={(e) =>
                    setCollapseForm({ ...collapseForm, collapseStartTime: e.target.value })
                  }
                />
              </FormGroup>
              <FormGroup>
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  value={collapseForm.collapseDurationHours}
                  onChange={(e) =>
                    setCollapseForm({
                      ...collapseForm,
                      collapseDurationHours: parseInt(e.target.value),
                    })
                  }
                />
              </FormGroup>
              <SubmitButton onClick={simulateCollapse} disabled={loading}>
                🚨 Simulate Collapse
              </SubmitButton>
            </Form>
          </Section>

          {collapseReport && (
            <>
              <Section>
                <SectionTitle>Collapse Impact Analysis</SectionTitle>
                <CollapseHeader severity={collapseReport.severity}>
                  <CollapseSeverity>{collapseReport.severity}</CollapseSeverity>
                  <CollapseHub>
                    Hub: {collapseReport.collapsedHub.cityName} (ID: {collapseReport.collapsedHub.airportId})
                  </CollapseHub>
                </CollapseHeader>
              </Section>

              <Section>
                <SectionTitle>Affected Resources</SectionTitle>
                <MetricsGrid>
                  <MetricCard>
                    <MetricValue>{collapseReport.affectedFlights.count}</MetricValue>
                    <MetricLabel>Affected Flights</MetricLabel>
                  </MetricCard>
                  <MetricCard>
                    <MetricValue>{collapseReport.affectedProducts}</MetricValue>
                    <MetricLabel>Affected Products</MetricLabel>
                  </MetricCard>
                  <MetricCard>
                    <MetricValue>{collapseReport.affectedOrders}</MetricValue>
                    <MetricLabel>Affected Orders</MetricLabel>
                  </MetricCard>
                </MetricsGrid>
              </Section>

              <Section>
                <SectionTitle>Economic Impact</SectionTitle>
                <ImpactBox>
                  <ImpactAmount>
                    ${collapseReport.estimatedImpact.amount.toLocaleString()} {collapseReport.estimatedImpact.currency}
                  </ImpactAmount>
                  <ImpactDescription>{collapseReport.estimatedImpact.description}</ImpactDescription>
                </ImpactBox>
              </Section>

              <Section>
                <SectionTitle>Alternative Hubs</SectionTitle>
                {collapseReport.alternativeHubs.length === 0 ? (
                  <EmptyState>No alternative hubs available ⚠️</EmptyState>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <th>City</th>
                        <th>Airport ID</th>
                        <th>Available Capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collapseReport.alternativeHubs.map((hub) => (
                        <tr key={hub.airportId}>
                          <td>{hub.cityName}</td>
                          <td>{hub.airportId}</td>
                          <td>{hub.availableCapacity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Section>

              <Section>
                <SectionTitle>Recommendation</SectionTitle>
                <RecommendationBox severity={collapseReport.severity}>
                  {collapseReport.recommendation}
                </RecommendationBox>
              </Section>
            </>
          )}
        </Content>
      )}
    </Container>
  )
}

export default SystemReportPage

// ===== Styled Components =====

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`

const RefreshButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;

  &:hover {
    background: #1976d2;
  }
`

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #ddd;
`

const Tab = styled.button<{ active: boolean }>`
  padding: 1rem 1.5rem;
  background: ${(props) => (props.active ? 'white' : 'transparent')};
  border: none;
  border-bottom: 3px solid ${(props) => (props.active ? '#2196f3' : 'transparent')};
  cursor: pointer;
  font-size: 1rem;
  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};
  color: ${(props) => (props.active ? '#2196f3' : '#666')};
  transition: all 0.3s;

  &:hover {
    background: #f0f0f0;
  }
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const Section = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 1.5rem 0;
`

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  z-index: 1000;
`

const HealthScoreContainer = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`

const HealthScore = styled.div<{ color: string }>`
  font-size: 4rem;
  font-weight: bold;
  color: ${(props) => props.color};
`

const HealthDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`

const HealthItem = styled.div<{ critical?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: ${(props) => (props.critical ? '#ffebee' : '#f5f5f5')};
  border-radius: 4px;
  font-weight: ${(props) => (props.critical ? 'bold' : 'normal')};
  color: ${(props) => (props.critical ? '#d32f2f' : '#333')};
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`

const MetricCard = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
`

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #2196f3;
  margin-bottom: 0.5rem;
`

const MetricLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background: #f5f5f5;
    font-weight: bold;
    color: #333;
  }

  tr:hover {
    background: #fafafa;
  }
`

const UtilizationBar = styled.div<{ percent: number; color: string }>`
  background: ${(props) => props.color};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  width: ${(props) => props.percent}%;
  min-width: 50px;
`

const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const RecommendationItem = styled.div<{ severity: 'critical' | 'high' | 'medium' }>`
  padding: 1rem;
  border-left: 4px solid
    ${(props) =>
      props.severity === 'critical' ? '#f44336' : props.severity === 'high' ? '#ff9800' : '#2196f3'};
  background: ${(props) =>
    props.severity === 'critical' ? '#ffebee' : props.severity === 'high' ? '#fff3e0' : '#e3f2fd'};
  border-radius: 4px;
  color: #333;
`

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const IssueCard = styled.div<{ severity: string }>`
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid ${(props) => getSeverityColor(props.severity)};
  background: #fafafa;
`

const IssueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`

const IssueType = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  color: #333;
  text-transform: capitalize;
`

const IssueSeverity = styled.div<{ color: string }>`
  padding: 0.25rem 0.75rem;
  background: ${(props) => props.color};
  color: white;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.85rem;
`

const IssueDescription = styled.div`
  color: #666;
  line-height: 1.5;
`

const IssueLocation = styled.div`
  margin-top: 0.5rem;
  color: #2196f3;
  font-weight: bold;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 1.2rem;
`

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  font-weight: bold;
  color: #333;
`

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`

const SubmitButton = styled.button`
  padding: 1rem 2rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background 0.3s;

  &:hover {
    background: #d32f2f;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`

const CollapseHeader = styled.div<{ severity: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: ${(props) =>
    props.severity === 'CRITICAL' ? '#ffebee' : props.severity === 'HIGH' ? '#fff3e0' : '#e3f2fd'};
  border-radius: 8px;
  border: 2px solid ${(props) => getSeverityColor(props.severity)};
`

const CollapseSeverity = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #f44336;
`

const CollapseHub = styled.div`
  font-size: 1.2rem;
  color: #333;
`

const ImpactBox = styled.div`
  padding: 1.5rem;
  background: #fff3e0;
  border: 2px solid #ff9800;
  border-radius: 8px;
  text-align: center;
`

const ImpactAmount = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #ff9800;
  margin-bottom: 0.5rem;
`

const ImpactDescription = styled.div`
  color: #666;
`

const RecommendationBox = styled.div<{ severity: string }>`
  padding: 1.5rem;
  background: ${(props) =>
    props.severity === 'CRITICAL' ? '#ffebee' : props.severity === 'HIGH' ? '#fff3e0' : '#e3f2fd'};
  border-left: 4px solid ${(props) => getSeverityColor(props.severity)};
  border-radius: 4px;
  color: #333;
  line-height: 1.6;
  font-size: 1.1rem;
`

function getSeverityColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return '#f44336'
    case 'HIGH':
      return '#ff5722'
    case 'WARNING':
    case 'MEDIUM':
      return '#ff9800'
    default:
      return '#2196f3'
  }
}

