import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { Plugin } from './Plugin';

@Entity()
export class PluginVote {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column()
  vote: number

  @ManyToOne(() => Plugin, (plugin) => plugin.votes, {
    orphanedRowAction: "delete",
  })
  plugin: Plugin
}