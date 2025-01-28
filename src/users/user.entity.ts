import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TestSession } from 'src/test/entities/test-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  avatar: string;

  @Column()
  fullName: string;

  @Column()
  address: string;

  @Column()
  phoneNumber: string;

  @Column({ default: false })
  is_activated: boolean;

  @Column({ type: 'enum', enum: ['common', 'admin'], default: 'common' })
  role: 'common' | 'admin';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TestSession, (testSession) => testSession.user)
  testSessions: TestSession[];
}
