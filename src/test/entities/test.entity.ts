import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Section } from './section.entity';
import { TestSession } from './test-session.entity';

export enum TestType {
  FULL_TEST = 'FULL_TEST', // 200 câu
  MINI_TEST = 'MINI_TEST', // 100 câu
  PART_TEST = 'PART_TEST', // Test practice
  PRACTICE_TEST = 'PRACTICE_TEST', // Test practice
}

export enum TestLevel {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  ADVANCED = 'ADVANCED',
}

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TestType,
    default: TestType.PRACTICE_TEST,
  })
  type: TestType;

  @Column()
  total_score: number;

  @Column()
  total_questions: number;

  @Column()
  total_time: number;

  @Column()
  partNumber: number;

  @Column({
    type: 'enum',
    enum: TestLevel,
    default: TestLevel.EASY,
  })
  level: TestLevel;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Section, (section) => section.test)
  sections: Section[];

  @OneToMany(() => TestSession, (testSession) => testSession.test)
  testSessions: TestSession[];
}
