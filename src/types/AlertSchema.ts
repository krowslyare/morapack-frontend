export interface AlertSchema {
  id?: number;
  description: string;
  status: string;
  generationDate?: string; // LocalDateTime in Java maps to string in TS
  orderId: number;
  orderName: string;
}
