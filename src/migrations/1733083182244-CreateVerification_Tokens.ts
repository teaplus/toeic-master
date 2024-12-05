import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateVerificationTokens1733083182244
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'verifycation_tokens',
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
            name: 'verify_token',
            type: 'varchar',
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'expired_at',
            type: 'timestamp',
          },
          {
            name: 'create_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),

      true, // true để cho phép tạo bảng ngay cả khi bảng đã tồn tại
    );
    await queryRunner.createForeignKey(
      'verifycation_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('verifycation_tokens');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('verifycation_tokens', foreignKey);
    }

    await queryRunner.dropTable('verifycation_tokens', true);
  }
}
