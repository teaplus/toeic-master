import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Part } from './part.entity';
import { Answer } from './answer.entity';
import { Response } from './response.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  number: number;

  @ManyToOne(() => Part, (part) => part.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'part_id' })
  part: Part;

  @Column()
  passage: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  group: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  audio_url: string;

  @Column({ nullable: true })
  image_url: string;

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];

  @OneToMany(() => Response, (response) => response.question)
  responses: Response[];
}
