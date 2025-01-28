import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateQuestionsTable1734018662378 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'questions',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'part_id', type: 'integer', isNullable: false },
          { name: 'number', type: 'integer', isNullable: false },
          { name: 'group', type: 'varchar', isNullable: false },
          { name: 'passage', type: 'varchar', isNullable: true },
          { name: 'content', type: 'text', isNullable: false },
          { name: 'type', type: 'varchar', isNullable: true },
          { name: 'audio_url', type: 'varchar', isNullable: true },
          { name: 'image_url', type: 'varchar', isNullable: true },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'questions',
      new TableForeignKey({
        columnNames: ['part_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'parts',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('questions', 'FK_part_id');
    await queryRunner.dropTable('questions');
  }
}
