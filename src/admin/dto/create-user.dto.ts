import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserByAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsString()
  username?: string;
}
