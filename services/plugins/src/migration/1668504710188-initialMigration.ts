import { MigrationInterface, QueryRunner } from "typeorm";

export class initialMigration1668504710188 implements MigrationInterface {
    name = 'initialMigration1668504710188'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "plugin_vote" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "vote" integer NOT NULL, "pluginId" uuid, CONSTRAINT "PK_27ce8949c8c95d0d318f75653ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "plugin" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "publisherId" character varying NOT NULL, "publishedAt" character varying(30) NOT NULL, "version" integer NOT NULL, "plugin" text NOT NULL, "importedCount" integer NOT NULL DEFAULT '0', "compatibleWith" character varying NOT NULL, CONSTRAINT "NamePublisherVersion" UNIQUE ("name", "publisherId", "version"), CONSTRAINT "PK_9a65387180b2e67287345684c03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "plugin_vote" ADD CONSTRAINT "FK_76b84d3e5db715be8ce7ad695c7" FOREIGN KEY ("pluginId") REFERENCES "plugin"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plugin_vote" DROP CONSTRAINT "FK_76b84d3e5db715be8ce7ad695c7"`);
        await queryRunner.query(`DROP TABLE "plugin"`);
        await queryRunner.query(`DROP TABLE "plugin_vote"`);
    }

}
