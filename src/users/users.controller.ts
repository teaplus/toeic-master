import {
  // BadRequestException,
  Controller,
  ForbiddenException,
  Get,
} from '@nestjs/common';
import { ERROR_CODES } from 'src/common/constants/error-codes';

@Controller('cats')
export class UsersController {
  @Get()
  getCustomError() {
    const error = ERROR_CODES.CUSTOM_ERROR('This is a custom error');
    throw new ForbiddenException(error.message);
  }
}
