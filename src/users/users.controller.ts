import {
  BadRequestException,
  Body,
  // BadRequestException,
  Controller,
  Get,
  // Request,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { UsersService } from './users.service';
import { ProfileDTO } from './dto/profile.dto';
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @UseGuards(AccessTokenGuard)
  @Get('profile')
  async getProfile(@Body() body: { username: string }): Promise<ProfileDTO> {
    const profile = await this.usersService.findByUsername(body.username);
    if (!profile) {
      throw new BadRequestException('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...newProfile } = profile;
    return newProfile;
  }
}
