import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTestSessionsTable1734018886523
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'test_sessions',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'user_id', type: 'integer', isNullable: false },
          { name: 'test_id', type: 'integer', isNullable: false },
          { name: 'part_id', type: 'integer', isNullable: false },
          { name: 'started_at', type: 'timestamp', isNullable: true },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'status', type: 'varchar', isNullable: true },
          { name: 'timeRemaining', type: 'integer' },
          { name: 'listening_score', type: 'integer', isNullable: true },
          { name: 'reading_score', type: 'integer', isNullable: true },
          { name: 'total_score', type: 'integer', isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKeys('test_sessions', [
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['test_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tests',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['part_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'parts',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('test_sessions', 'FK_user_id');
    await queryRunner.dropForeignKey('test_sessions', 'FK_test_id');
    await queryRunner.dropForeignKey('test_sessions', 'FK_part_id');
    await queryRunner.dropTable('test_sessions');
  }
}
