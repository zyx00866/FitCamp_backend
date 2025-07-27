import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';

import { Activity } from './activity.entity';
import { Comment } from './comment.entity';
import { UserSession } from './userSession.entity';
@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  account: string;

  @Column()
  password: string;

  @Column({ default: '' })
  avatar: string;

  @Column({ default: '这个用户很懒，还没有简介ᓚᘏᗢ' })
  profile: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  registerTime: Date;

  @ManyToMany(() => Activity, activity => activity.participants)
  @JoinTable()
  activities: Activity[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @ManyToMany(() => Activity, activity => activity.favoritedBy)
  @JoinTable()
  favoriteActivities: Activity[];

  @OneToMany(() => Activity, activity => activity.creator)
  createdActivities: Activity[];

  @Column({ default: true })
  isOnline: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastActiveTime: Date;

  @OneToMany(() => UserSession, session => session.user)
  sessions: UserSession[];
}
