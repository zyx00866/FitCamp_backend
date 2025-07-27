// src/entity/userSession.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'text' })
  token: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  loginTime: Date;

  @UpdateDateColumn()
  lastActiveTime: Date;

  @Column({ type: 'datetime', nullable: true })
  logoutTime: Date;

  @ManyToOne(() => User, user => user.sessions)
  user: User;
}
