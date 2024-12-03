// src/example/example.controller.ts
import {
  Controller,
  Get,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

@Controller('example')
export class ExampleController {
  @Get('unauthorized')
  getUnauthorized() {
    throw new UnauthorizedException();
  }

  @Get('forbidden')
  getForbidden() {
    throw new ForbiddenException();
  }

  @Get('not-found')
  getNotFound() {
    throw new NotFoundException();
  }

  @Get('conflict')
  getConflict() {
    throw new ConflictException();
  }
}
