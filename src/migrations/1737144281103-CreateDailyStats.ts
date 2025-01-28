import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDailyStats1737144281103 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'daily_stats',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'date',
            type: 'date',
            isUnique: true,
          },
          {
            name: 'total_users',
            type: 'int',
          },
          {
            name: 'new_users',
            type: 'int',
          },
          {
            name: 'completed_tests',
            type: 'int',
          },
          {
            name: 'average_score',
            type: 'float',
          },
          {
            name: 'top_scorer_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'top_score',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('daily_stats');
  }
}
