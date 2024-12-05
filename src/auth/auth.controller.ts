import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './auth.guard';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('resend-verification')
  async reSendVerification(@Body() body: { email: string }) {
    return this.authService.reSendVerifyLink(body.email);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return { message: 'hello', user: req.tokens };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.tokens['refresh_token']);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')
  async newAccessToken(@Body() body: { refreshToken: string }, @Request() req) {
    await this.authService.revokeToken(body.refreshToken);
    return await this.authService.refreshToken(req.user);
  }
}
