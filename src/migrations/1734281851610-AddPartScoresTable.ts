import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddPartScoresTable1734281851610 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'part_scores',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'test_session_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'part_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'score',
            type: 'int',
            default: 0,
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['test_session_id'],
            referencedTableName: 'test_sessions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['part_id'],
            referencedTableName: 'parts',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('part_scores');
  }
}
