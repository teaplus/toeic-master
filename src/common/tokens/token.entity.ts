import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  token: string;

  @Column({
    type: 'enum',
    enum: ['refreshToken', 'verificationToken'],
    default: 'refreshToken',
  })
  type: 'refreshToken' | 'verificationToken';

  @Column({ type: 'timestamp' })
  expired_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  is_used: boolean;

  @Column({ type: 'varchar', nullable: true })
  device_info: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
