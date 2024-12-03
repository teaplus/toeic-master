import { Controller, Get } from '@nestjs/common';

@Controller('cats2')
export class CatsController {
  @Get('data')
  findAll(): string {
    return 'This action returns all cats';
  }
}
