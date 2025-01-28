import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/common/tokens/token.services';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('MissingToken');
    }
    if (token) {
      const veriryToken = this.tokenService.verifyToken(token);
      if (veriryToken === 'TokenExpiredError') {
        throw new UnauthorizedException('TokenExpiredError');
      }
      if (veriryToken === 'InvalidToken') {
        throw new UnauthorizedException('InvalidToken');
      }
      // console.log('token', veriryToken);
    }
    return true;
  }
}
