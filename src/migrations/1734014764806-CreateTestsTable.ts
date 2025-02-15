import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTestsTable1734014764806 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tests',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar' },
          { name: 'total_score', type: 'int' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          {
            name: 'type',
            type: 'enum',
            enum: ['FULL_TEST', 'MINI_TEST', 'PART_TEST', 'PRACTICE_TEST'],
            default: `'PRACTICE_TEST'`,
          },
          {
            name: 'total_questions',
            type: 'integer',
          },
          {
            name: 'total_time',
            type: 'integer',
          },
          {
            name: 'partNumber',
            type: 'integer',
          },
          {
            name: 'level',
            type: 'enum',
            enum: ['EASY', 'NORMAL', 'ADVANCED'],
            default: `'EASY'`,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tests');
  }
}
