import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreatePartsTable1734018481057 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'parts',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'section_id', type: 'integer', isNullable: true },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'order', type: 'integer', isNullable: true },
          { name: 'numberOfQuestions', type: 'integer', isNullable: false },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'parts',
      new TableForeignKey({
        columnNames: ['section_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sections',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('parts', 'FK_section_id');
    await queryRunner.dropTable('parts');
  }
}
