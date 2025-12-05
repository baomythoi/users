export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: Error;
  data?: T;
  code?: string; // Optional field for error identification
}

export interface FuncResponse<T> {
  statusCode: number;
  success: boolean;
  code?: string;
  correlationId?: string;
  message?: string;
  data?: T;
  error?: Error;
}