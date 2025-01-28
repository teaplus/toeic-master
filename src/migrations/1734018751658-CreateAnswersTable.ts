import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAnswersTable1734018751658 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'answers',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'question_id', type: 'integer', isNullable: false },
          { name: 'content', type: 'text', isNullable: false },
          { name: 'is_correct', type: 'boolean', default: false },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'answers',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('answers', 'FK_question_id');
    await queryRunner.dropTable('answers');
  }
}
