import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class AddAdminAccountsTable1734408388736 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'admins',
        columns: [
          { name: 'id', type: 'serial', isPrimary: true },
          { name: 'user_id', type: 'int', isUnique: true },
          { name: 'role', type: 'enum', enum: ['0', '1'] }, //0 is user. 1 is admin
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'admins',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('admins');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('admins', foreignKey);
    }

    await queryRunner.dropTable('admins', true);
  }
}
