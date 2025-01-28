import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/common/tokens/token.services';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt') {
  constructor(
    private jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const refreshToken = request.body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh Token is missing');
    }
    const isTokenValid = await this.tokenService.checkRevokeToken(refreshToken);
    if (isTokenValid) {
      throw new UnauthorizedException('InvalidToken');
    }

    try {
      // Kiểm tra Refresh Token có hợp lệ không
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET_REFRESH,
      });
      request.user = payload; // Gắn payload vào request để sử dụng trong controllerr
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }
  }
}
