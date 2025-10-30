export interface AlgorithmRequest {
  algorithmType?: string // "ALNS" or "TABU"
  maxIterations?: number
  maxNoImprovement?: number
  neighborhoodSize?: number
  tabuListSize?: number
  tabuTenure?: number
  useDatabase?: boolean // true = use database data, false = use file data
}
