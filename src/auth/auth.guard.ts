import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthGuard } from '@nestjs/passport';
import { TokenService } from 'src/common/tokens/token.services';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const refreshToken = request.headers['refreshtoken'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    // console.log('guard refreshtoken', refreshToken);

    if (token) {
      const decoded = this.tokenService.verifyToken(refreshToken);
      if (decoded) {
        request.tokens = { refresh_token: refreshToken, accessToken: token };
        return true;
      }
      return true;
    }
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
  }
}
