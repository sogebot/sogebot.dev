import { Entity, PrimaryColumn, Column, Unique } from "typeorm"
import { IsInt, IsNotEmpty, MinLength } from 'class-validator';

@Entity()
@Unique('NamePublisherVersion', ['name', 'publisherId', 'version'])
export class Plugin {
    @PrimaryColumn({ generated: 'uuid' })
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

    @Column({ type: 'json' })
    votes: { userId: string, vote: 1 | -1 }[]

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