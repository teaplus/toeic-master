import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from 'src/common/tokens/token.services';
import { User } from 'src/users/user.entity';
// import { RefreshToken } from './refreshToken.entity';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { MailService } from 'src/common/mail/mail.service';
import { verifyEmailTemplate } from 'src/common/mail/templates/mail.template';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async createToken(payload: any, expiresIn: string) {
    return {
      token: this.jwtService.sign(payload, {
        expiresIn: expiresIn,
        secret: process.env.JWT_SECRET,
      }),
    };
  }

  createTokenPair(payload: any) {
    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: '3h',
      secret: process.env.JWT_SECRET || 'secret',
    });

    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: '3d',
      secret: process.env.JWT_SECRET || 'secret',
    });

    return {
      newAccessToken,
      newRefreshToken,
    };
  }

  async refreshToken(user: any) {
    const payload = { username: user.username, sub: user.id };
    const findUser = await this.usersService.findByUsername(user.username);
    const tokenpairs = this.createTokenPair(payload);
    const currentDate = new Date(); // Ngày giờ hiện tại
    const expires_at = new Date(currentDate); // Tạo bản sao ngày hiện tại

    expires_at.setDate(currentDate.getDate() + 3);
    await this.tokenService.saveToken({
      token: `${tokenpairs.newRefreshToken}`,
      user: findUser,
      expires_at: expires_at,
    });
    return tokenpairs;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_Token: string; user: User }> {
    const { email, password } = loginDto;
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.username, sub: user.id };
    // const refreshToken = await this.createToken(
    //   { username: user.username },
    //   '3d',
    // );

    const tokenpairs = this.createTokenPair(payload);

    const currentDate = new Date(); // Ngày giờ hiện tại
    const expires_at = new Date(currentDate); // Tạo bản sao ngày hiện tại

    expires_at.setDate(currentDate.getDate() + 3);
    await this.tokenService.saveToken({
      token: `${tokenpairs.newRefreshToken}`,
      user: user,
      expires_at: expires_at,
    });
    return {
      user: user,
      access_token: tokenpairs.newAccessToken,
      refresh_Token: tokenpairs.newRefreshToken,
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const user = await this.usersService.create(registerDto);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await this.tokenService.saveVerifyToken({
      verify_token: token,
      user: user,
      expires_at: expiresAt,
    });
    const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;
    const emailContent = verifyEmailTemplate(user.username, verificationLink);
    await this.mailService.sendEmail(
      user.email,
      'Email Verifycation',
      emailContent,
    );
    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async reSendVerifyLink(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('user not register');
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await this.tokenService.saveVerifyToken({
      verify_token: token,
      user: user,
      expires_at: expiresAt,
    });
    const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;
    const emailContent = verifyEmailTemplate(user.username, verificationLink);
    await this.mailService.sendEmail(
      user.email,
      'Email Verifycation',
      emailContent,
    );

    return 'Successfull';
  }
  async logout(token: string) {
    return this.tokenService.revokeToken(token);
  }

  async revokeToken(token: string) {
    return this.tokenService.revokeToken(token);
  }
}
