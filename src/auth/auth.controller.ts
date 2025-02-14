import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Query,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { OAuth2Client } from 'google-auth-library';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private googleClient: OAuth2Client,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('oauth-google')
  async authenWithGoogleAccount(@Body('token') token: string) {
    try {
      // Xác minh token từ Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }
      // console.log('payload', payload);
      const user = {
        email: payload.email,
        fullName: payload.name,
        avatar: payload.picture,
      };

      return this.authService.oAuthGoogle(user);
    } catch (error) {
      console.error('Google authentication error:', error);
      throw new UnauthorizedException('google login fail');
    }
  }

  @Post('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification/:email')
  async reSendVerification(@Param('email') email: string) {
    return this.authService.reSendVerifyLink(email);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // @UseGuards(AccessTokenGuard, RoleAdminCheck)
  // @Get('profile')
  // async getProfile(@Request() req) {
  //   return { message: 'hello', user: req.tokens };
  // }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  async logout(@Request() req) {
    const token = req.headers['authorization']?.split(' ')[1];
    return this.authService.logout(token);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')
  async newAccessToken(@Body() body: { refreshToken: string }, @Request() req) {
    await this.authService.revokeToken(body.refreshToken);
    return await this.authService.refreshToken(req.user);
  }

  @UseGuards(AccessTokenGuard)
  @Post('change-password')
  async changePassword(
    @Body() body: { email: string; oldPassword: string; newPassword: string },
  ) {
    return await this.authService.changePassword(
      body.email,
      body.oldPassword,
      body.newPassword,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return await this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { token: string; email: string; newPass: string },
  ) {
    return await this.authService.verifyNewPassword(
      body.token,
      body.email,
      body.newPass,
    );
  }
}
