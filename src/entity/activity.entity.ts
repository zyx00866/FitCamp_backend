import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';

export enum ActivityType {
  RUNNING = '跑步',
  SWIMMING = '游泳',
  WORKOUT = '健身',
  DANCE = '舞蹈',
  BASKETBALL = '篮球',
  FOOTBALL = '足球',
  BADMINTON = '羽毛球',
  OTHERS = '其它',
}

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  title: string;

  @Column()
  profile: string;

  @Column()
  date: Date;

  @Column()
  organizerName: string;

  @Column()
  location: string;

  @Column()
  picture: string;

  @Column()
  participantsLimit: number;

  @Column()
  fee: number;

  @CreateDateColumn()
  createTime: Date;

  @Column({
    type: 'simple-enum',
    enum: ActivityType,
    default: ActivityType.OTHERS,
  })
  type: ActivityType;

  @ManyToMany(() => User, user => user.activities)
  participants: User[];

  @ManyToMany(() => User, user => user.favoriteActivities)
  favoritedBy: User[];

  @OneToMany(() => Comment, comment => comment.activity)
  comments: Comment[];

  @ManyToOne(() => User, user => user.createdActivities)
  creator: User;
}
