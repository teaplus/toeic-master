import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  verify_token: string;

  @Column({ default: false })
  is_used: boolean;

  @Column()
  expired_at: Date;

  @CreateDateColumn()
  create_at: Date;
}
