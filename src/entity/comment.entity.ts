import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  content: string;
  @Column()
  picture: string;
  @ManyToOne(() => User, user => user.comments, { eager: true })
  user: User;
  @ManyToOne(() => Activity, activity => activity.comments)
  activity: Activity;
  @Column()
  starNumber: number;
  @CreateDateColumn()
  createTime: Date;
}
