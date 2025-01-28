import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('daily_stats')
export class DailyStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'total_users' })
  totalUsers: number;

  @Column({ name: 'new_users' })
  newUsers: number;

  @Column({ name: 'completed_tests' })
  completedTests: number;

  @Column({ type: 'float', name: 'average_score' })
  averageScore: number;

  @Column({ nullable: true, name: 'top_scorer_id' })
  topScorerId: number;

  @Column({ nullable: true, name: 'top_score' })
  topScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
