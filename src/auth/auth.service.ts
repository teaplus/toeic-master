import {
  BadRequestException,
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
import {
  forgotPasswordTemplateWithCode,
  verifyEmailTemplate,
} from 'src/common/mail/templates/mail.template';
import * as bcrypt from 'bcrypt';

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
    const expired_at = new Date(currentDate); // Tạo bản sao ngày hiện tại
    expired_at.setDate(currentDate.getDate() + 3);
    await this.tokenService.saveToken({
      token: `${tokenpairs.newRefreshToken}`,
      user: findUser,
      type: 'refreshToken',
      expired_at: expired_at,
    });
    return tokenpairs;
  }

  async oAuthGoogle(
    user: Partial<User>,
  ): Promise<{ access_token: string; refresh_Token: string; user: User }> {
    const isUser = await this.usersService.findByEmail(user.email);
    if (!isUser) {
      user.is_activated = true;
      const createUser = await this.usersService.create(user);
      if (!createUser) {
        throw new UnauthorizedException('UnknowError');
      }
      const payload = { username: createUser.username, sub: createUser.id };
      const tokenpairs = this.createTokenPair(payload);

      const currentDate = new Date(); // Ngày giờ hiện tại
      const expired_at = new Date(currentDate); // Tạo bản sao ngày hiện tại

      expired_at.setDate(currentDate.getDate() + 3);
      await this.tokenService.saveToken({
        token: `${tokenpairs.newRefreshToken}`,
        user: createUser,
        expired_at: expired_at,
      });
      return {
        user: createUser,
        access_token: tokenpairs.newAccessToken,
        refresh_Token: tokenpairs.newRefreshToken,
      };
    }
    const payload = { username: isUser.username, sub: isUser.id };
    const tokenpairs = this.createTokenPair(payload);

    const currentDate = new Date(); // Ngày giờ hiện tại
    const expired_at = new Date(currentDate); // Tạo bản sao ngày hiện tại

    expired_at.setDate(currentDate.getDate() + 3);
    await this.tokenService.saveToken({
      token: `${tokenpairs.newRefreshToken}`,
      user: isUser,
      expired_at: expired_at,
    });
    return {
      user: isUser,
      access_token: tokenpairs.newAccessToken,
      refresh_Token: tokenpairs.newRefreshToken,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_Token: string; user: User }> {
    const { username, password } = loginDto;
    const user = await this.usersService.validateUsername(username, password);
    if (!user) {
      throw new NotFoundException('User or password wrong');
    }
    const payload = { username: user.username, sub: user.id };
    // const refreshToken = await this.createToken(
    //   { username: user.username },
    //   '3d',
    // );

    const tokenpairs = this.createTokenPair(payload);

    const currentDate = new Date(); // Ngày giờ hiện tại
    const expired_at = new Date(currentDate); // Tạo bản sao ngày hiện tại

    expired_at.setDate(currentDate.getDate() + 3);
    await this.tokenService.saveToken({
      token: `${tokenpairs.newRefreshToken}`,
      user: user,
      type: 'refreshToken',
      expired_at: expired_at,
    });
    return {
      user: user,
      access_token: tokenpairs.newAccessToken,
      refresh_Token: tokenpairs.newRefreshToken,
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const isUserEmailExist = await this.usersService.findByEmail(
      registerDto.email,
    );
    const isUserNameExist = await this.usersService.findByUsername(
      registerDto.username,
    );
    if (isUserEmailExist || isUserNameExist) {
      throw new BadRequestException('username or email has exist');
    }
    const user = await this.usersService.create(registerDto);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await this.tokenService.saveToken({
      token: token,
      user: user,
      type: 'verificationToken',
      expired_at: expiresAt,
    });
    const frontendUrl = process.env.FRONTEND_URL;
    const verificationLink = `${frontendUrl}/verification/${token}`;
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
  async verifyEmail(token: string) {
    const verificationToken = await this.tokenService.findToken(
      token,
      'verificationToken',
    );
    if (!verificationToken || verificationToken.expired_at < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    verificationToken.is_used = true;
    // console.log(verificationToken);
    await this.tokenService.saveVerifyToken(verificationToken);
    const user = verificationToken.user;
    user.is_activated = true;
    await this.usersService.updateUser(user);
    return { message: 'Email verified successfully!' };
  }

  async reSendVerifyLink(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.is_activated == true) {
      throw new NotFoundException('user not register or account has verify');
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await this.tokenService.saveVerifyToken({
      token: token,
      user: user,
      type: 'verificationToken',
      expired_at: expiresAt,
    });
    const frontendUrl = process.env.FRONTEND_URL;
    const verificationLink = `${frontendUrl}/verification/${token}`;
    const emailContent = verifyEmailTemplate(user.username, verificationLink);
    await this.mailService.sendEmail(
      user.email,
      'Email Verifycation',
      emailContent,
    );

    return 'Successfull';
  }

  async changePassword(email: string, oldPassword: string, newPass: string) {
    const user = await this.usersService.validateUser(email, oldPassword);
    if (!user) {
      throw new UnauthorizedException('Wrong PassWord');
    }
    const hashedPassword = await bcrypt.hash(newPass, 10);
    user.password = hashedPassword;
    await this.usersService.updateUser(user);
    return {
      message: 'password change successfully',
    };
  }

  async logout(token: string) {
    return this.tokenService.revokeToken(token);
  }

  async revokeToken(token: string) {
    return this.tokenService.revokeToken(token);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Username has not registered');
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await this.tokenService.saveVerifyToken({
      token: token,
      user: user,
      type: 'verificationToken',
      expired_at: expiresAt,
    });
    const frontendUrl = process.env.FRONTEND_URL;
    const verificationLink = `${frontendUrl}/reset-password/${user.email}/${token}`;

    const emailContent = forgotPasswordTemplateWithCode(
      user.username,
      verificationLink,
    );
    await this.mailService.sendEmail(
      user.email,
      'reset password',
      emailContent,
    );

    return 'Password reset email has been sent';
  }

  async verifyNewPassword(token: string, email: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    const istoken = await this.tokenService.findVerifyToken(token);

    if (!user) {
      throw new NotFoundException('Invalid user');
    }
    if (!istoken) {
      throw new UnauthorizedException('invalid token');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersService.updateUser(user);
    await this.tokenService.revokeToken(token);
    return {
      message: 'password change successfully',
    };
  }
}
