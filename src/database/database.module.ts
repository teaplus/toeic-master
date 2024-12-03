import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Đảm bảo ConfigModule được sử dụng toàn cầu
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', '3le7tow2'),
        database: configService.get<string>('DB_NAME', 'toeic-db'),
        autoLoadEntities: true, // Tự động load các entity
        synchronize: true, // Đồng bộ schema (KHÔNG nên dùng ở môi trường production)
      }),
    }),
  ],
})
export class DatabaseModule {}
