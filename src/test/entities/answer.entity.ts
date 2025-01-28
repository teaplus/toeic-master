import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Response } from './response.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Question, (question) => question.id)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'text' })
  content: string;

  @Column()
  is_correct: boolean;

  @OneToMany(() => Response, (response) => response.answer)
  responses: Response[];
}
