// src/common/interceptors/response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class ResponseInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        // Lấy mã trạng thái từ response (mặc định 200)
        const statusCode = response.statusCode || 200;

        // Định dạng lại response
        return new ResponseDto(statusCode, data, 'Request successful');
      }),
    );
  }
}
