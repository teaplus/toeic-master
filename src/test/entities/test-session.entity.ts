import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Test } from './test.entity';
import { Part } from './part.entity';
import { Response } from './response.entity';
import { PartScore } from './part-score.entity';

export enum TestSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('test_sessions')
export class TestSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  timeRemaining: number;

  @ManyToOne(() => Test, (test) => test.id, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @ManyToOne(() => Part, (part) => part.id, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'part_id' })
  part: Part;

  @Column({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({
    type: 'enum',
    enum: TestSessionStatus,
    default: TestSessionStatus.IN_PROGRESS,
  })
  status: string;

  @OneToMany(() => Response, (response) => response.testSession)
  responses: Response[];

  @OneToMany(() => PartScore, (partScore) => partScore.testSession, {
    nullable: true,
    cascade: true,
  })
  partScores: PartScore[];

  @Column({ nullable: true })
  listening_score: number;

  @Column({ nullable: true })
  reading_score: number;

  @Column({ nullable: true })
  total_score: number;
}
