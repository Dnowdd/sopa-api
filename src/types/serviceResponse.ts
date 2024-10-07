export interface ServiceResponse<T> {
  success: boolean;
  message?: string;
  status: number;
  response?: T;
}
