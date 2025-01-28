import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Section } from './section.entity';
import { Question } from './question.entity';
import { TestSession } from './test-session.entity';

@Entity('parts')
export class Part {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Section, (section) => section.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @Column()
  numberOfQuestions: number;

  @Column({ name: 'name' })
  partName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'order' })
  partNumber: number;

  @OneToMany(() => Question, (question) => question.part)
  questions: Question[];

  @OneToMany(() => TestSession, (testSession) => testSession.part)
  testSessions: TestSession[];
}
