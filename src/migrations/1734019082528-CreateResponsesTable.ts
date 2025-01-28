import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateResponsesTable1734019082528 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'responses',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'test_session_id', type: 'integer', isNullable: false },
          { name: 'question_id', type: 'integer', isNullable: false },
          { name: 'answer_id', type: 'integer', isNullable: false },
          { name: 'is_correct', type: 'boolean', isNullable: false },
        ],
      }),
    );

    await queryRunner.createForeignKeys('responses', [
      new TableForeignKey({
        columnNames: ['test_session_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'test_sessions',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['answer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'answers',
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('responses', 'FK_test_session_id');
    await queryRunner.dropForeignKey('responses', 'FK_question_id');
    await queryRunner.dropForeignKey('responses', 'FK_answer_id');
    await queryRunner.dropTable('responses');
  }
}
