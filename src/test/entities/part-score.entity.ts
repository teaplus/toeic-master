import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestSession } from './test-session.entity';
import { Part } from './part.entity';

@Entity('part_scores')
export class PartScore {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TestSession, (testSession) => testSession.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'test_session_id' })
  testSession: TestSession;

  @ManyToOne(() => Part, (part) => part.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'part_id' })
  part: Part;

  @Column()
  partNumber: number;

  @Column({ type: 'int', default: 0 })
  score: number;
}
