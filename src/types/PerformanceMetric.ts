export interface PerformanceMetric {
  id?: number
  metricName: string
  metricValue: number
  timestamp?: string // LocalDateTime in Java maps to string in TS
  solutionId: number
}
