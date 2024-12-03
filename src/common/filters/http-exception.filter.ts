// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto/response.dto';
import { ERROR_CODES } from '../constants/error-codes';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorCode: string;
    let message: string;
    let errors: any = null;

    // Kiểm tra loại lỗi và gán mã lỗi tương ứng
    switch (true) {
      case exception instanceof BadRequestException:
        ({ code: errorCode, message } = ERROR_CODES.BAD_REQUEST);
        errors = (exceptionResponse as any)?.message || null;
        break;
      case exception instanceof UnauthorizedException:
        ({ code: errorCode, message } = ERROR_CODES.UNAUTHORIZED);
        break;
      case exception instanceof ForbiddenException:
        ({ code: errorCode, message } = ERROR_CODES.FORBIDDEN);
        break;
      case exception instanceof NotFoundException:
        ({ code: errorCode, message } = ERROR_CODES.NOT_FOUND);
        break;
      case exception instanceof ConflictException:
        ({ code: errorCode, message } = ERROR_CODES.CONFLICT);
        break;
      default:
        ({ code: errorCode, message } = ERROR_CODES.INTERNAL_SERVER_ERROR);
        break;
    }

    // Trả về cấu trúc lỗi chuẩn hóa
    response
      .status(status)
      .json(new ResponseDto(status, null, message, false, errorCode, errors));
  }
}
