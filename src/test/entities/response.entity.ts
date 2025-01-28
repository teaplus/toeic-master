import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestSession } from './test-session.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';

@Entity('responses')
export class Response {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TestSession, (testSession) => testSession.id)
  @JoinColumn({ name: 'test_session_id' })
  testSession: TestSession;

  @ManyToOne(() => Question, (question) => question.responses, {
    nullable: false,
  })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => Answer, (answer) => answer.responses, { nullable: false })
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;
}
