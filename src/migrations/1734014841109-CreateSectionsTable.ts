import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateSectionsTable1734014841109 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sections',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'test_id', type: 'int' },
          { name: 'name', type: 'varchar' },
          {
            name: 'section_type',
            type: 'enum',
            enum: ['Listening', 'Reading'],
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'sections',
      new TableForeignKey({
        columnNames: ['test_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tests',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('sections', 'FK_sections_test_id');
    await queryRunner.dropTable('sections');
  }
}
