import { Entity, Column, PrimaryColumn, ManyToMany } from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';

@Entity('activity')
export class Activity {
  @PrimaryColumn()
  id: string;
  @Column()
  title: string;
  @Column()
  profile: string;
  @Column()
  date: Date;
  @Column()
  organizer: string;
  @Column()
  location: string;
  @Column()
  picture: string;
  @Column()
  participantsLimit: number;
  @ManyToMany(() => User, user => user.activities)
  @ManyToMany(() => User, user => user.favoriteActivities)
  participants: User[];
  comments: Comment[];
  favoritedBy: User[];
}
