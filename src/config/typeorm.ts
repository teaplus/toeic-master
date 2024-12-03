import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';

// Load biến môi trường từ file .env
dotenvConfig({ path: '.env' });

// Cấu hình TypeORM cho DataSource
export const typeOrmDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'database',
  entities: ['dist/**/*.entity{.js,.ts}'], // Chỉ file biên dịch
  migrations: ['dist/migrations/*{.js,.ts}'],
  synchronize: false, // Không tự đồng bộ schema
};

// Export cấu hình NestJS
export default registerAs('typeorm', () => ({
  ...typeOrmDataSourceOptions,
  autoLoadEntities: true, // Chỉ dùng trong NestJS, không áp dụng cho DataSourceOptions
}));

// Tạo DataSource cho CLI và các công cụ hỗ trợ
export const connectionSource = new DataSource(typeOrmDataSourceOptions);
