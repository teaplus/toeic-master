import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTokenTable1733913916731 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tokens',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment', // Tự động tăng
          },
          {
            name: 'user_id',
            type: 'integer',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['refreshToken', 'verificationToken'],
            default: `'refreshToken'`,
          },
          {
            name: 'token',
            type: 'varchar',
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'device_info',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'expired_at',
            type: 'timestamp',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),

      true, // true để cho phép tạo bảng ngay cả khi bảng đã tồn tại
    );
    await queryRunner.createForeignKey(
      'tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tokens');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('tokens', foreignKey);
    }

    await queryRunner.dropTable('tokens', true);
  }
}
