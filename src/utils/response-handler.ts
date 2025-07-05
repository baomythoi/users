import { ApiResponse, FuncResponse } from '@interfaces/response';

export default class ResponseHandler<T> {
  private success: boolean;
  private message?: string;
  private error?: Error;
  private data?: T;
  private code?: string;

  constructor(data: FuncResponse<T>) {
    this.success = data.success;
    this.message = data.message;
    this.data = data.data;
    this.error = data.error;
    this.code = data.code;
  }

  public get(): ApiResponse<T> {
    return {
      code: this.code,
      success: this.success,
      message: this.message,
      data: this.data,
      error: this.error
    };
  }
}