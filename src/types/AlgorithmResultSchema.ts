import { ProductRouteSchema } from './ProductRouteSchema';

export interface AlgorithmResultSchema {
  success: boolean;
  message: string;
  algorithmType?: string;
  executionStartTime?: string; // LocalDateTime in Java maps to string in TS
  executionEndTime?: string; // LocalDateTime in Java maps to string in TS
  executionTimeSeconds?: number;

  // Solution metrics
  totalOrders?: number;
  assignedOrders?: number;
  unassignedOrders?: number;
  totalProducts?: number;
  score?: number;

  // The main result: map of products to their flight routes
  productRoutes?: ProductRouteSchema[];

  // Raw solution for debugging (optional)
  rawSolution?: { [key: string]: any };
}
