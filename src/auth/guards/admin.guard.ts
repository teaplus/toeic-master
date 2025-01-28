import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/common/tokens/token.services';

@Injectable()
export class RoleAdminCheck extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const isAdmin = await this.tokenService.checkAdmin(veriryToken.username);
      // console.log(isAdmin);
      if (!isAdmin) {
        // console.log('not perm');

        throw new ForbiddenException('You do not have permission');
      }
      return Promise.resolve(true);
    }
    return Promise.resolve(true);
  }
}
