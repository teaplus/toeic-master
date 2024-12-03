import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'posgres',
  password: process.env.DB_PASSWORD || '3le7tow2',
  database: process.env.DB_DATABASE || 'toeic-db',
  entities: ['dist/**/*.entity{.ts,.js}'], // Thay đổi đường dẫn nếu cần
  synchronize: false, // Tắt synchronize để sử dụng migration
  migrations: ['dist/migrations/*.js'], // Thay đổi đường dẫn nếu cần
});
