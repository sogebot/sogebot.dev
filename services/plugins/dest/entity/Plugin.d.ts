export declare class Plugin {
    id: string;
    name: string;
    description: string;
    publisherId: string;
    publishedAt: string;
    votes: {
        userId: string;
        vote: 1 | -1;
    }[];
    version: number;
    plugin: number;
}
