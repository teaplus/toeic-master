import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Test } from './test.entity';
import { Part } from './part.entity';
export enum SectionType {
  LISTENING = 'LISTENING',
  READING = 'READING',
}

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SectionType,
  })
  type: SectionType;

  @ManyToOne(() => Test, (test) => test.sections)
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @OneToMany(() => Part, (part) => part.section)
  parts: Part[];
}
