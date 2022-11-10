import { Entity, Column, Unique, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { IsInt, IsNotEmpty, MinLength } from 'class-validator';
import { PluginVote } from './PluginVote';

@Entity()
@Unique('NamePublisherVersion', ['name', 'publisherId', 'version'])
export class Plugin {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    @IsNotEmpty()
    @MinLength(4)
    name: string

    @Column({ type: 'text' })
    description: string

    @Column()
    @IsNotEmpty()
    publisherId: string

    @Column({ type: 'varchar', length: '2022-07-27T00:30:34.569259834Z'.length })
    @IsNotEmpty()
    publishedAt: string

    @OneToMany(() => PluginVote, (photo) => photo.plugin, {
        cascade: true,
        onDelete: 'CASCADE',
        orphanedRowAction: "delete",
        eager: true,
    })
    votes: PluginVote[]

    @Column()
    @IsNotEmpty()
    @IsInt()
    version: number;

    @Column({ type: 'text' })
    @IsNotEmpty()
    plugin: number;

    @Column({ default: 0 })
    importedCount: number;
}