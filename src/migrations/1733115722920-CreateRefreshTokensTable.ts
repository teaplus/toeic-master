import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateRefreshTokensTable1645568743103
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo bảng refresh_tokens
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'integer',
          },
          {
            name: 'token',
            type: 'varchar',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'revoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'device_info',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Thêm khóa ngoại liên kết với bảng users
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Xóa khóa ngoại trước khi xóa bảng
    const table = await queryRunner.getTable('refresh_tokens');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('refresh_tokens', foreignKey);
    }

    // Xóa bảng refresh_tokens
    await queryRunner.dropTable('refresh_tokens');
  }
}
