import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { Activity } from './activity.entity';
import { Comment } from './comment.entity';
@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  account: string;
  @Column()
  password: string;
  @Column()
  avatar: string;
  @Column()
  profile: string;
  @Column({ type: 'datetime' })
  registerTime: Date;
  @ManyToMany(() => Activity, activity => activity.participants)
  @JoinTable()
  activities: Activity[];
  comments: Comment[];
  @ManyToMany(() => Activity, activity => activity.favoritedBy)
  @JoinTable()
  favoriteActivities: Activity[];
}
