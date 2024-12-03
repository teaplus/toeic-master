// src/common/pipes/transform.pipe.ts
import {
  //   ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class TransformPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Validation failed');
    }
    return value.trim(); // Transform dữ liệu
  }
}
