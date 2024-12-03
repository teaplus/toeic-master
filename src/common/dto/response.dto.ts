// src/common/dto/response.dto.ts
export class ResponseDto<T> {
  success: boolean;
  statusCode: number;
  data: T | null;
  message: string;
  errorCode?: string; // Thêm trường mã lỗi
  errors?: any; // Lỗi chi tiết (nếu có)
  timestamp: string;

  constructor(
    statusCode: number,
    data: T | null,
    message: string,
    success = true,
    errorCode?: string,
    errors?: any,
  ) {
    this.statusCode = statusCode;
    this.success = success;
    this.data = data;
    this.message = message;
    this.errorCode = errorCode;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }
}
