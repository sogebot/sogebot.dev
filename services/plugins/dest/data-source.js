"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Plugin_1 = require("./entity/Plugin");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.PG_HOST || "localhost",
    port: Number(process.env.PG_PORT) || 5432,
    username: process.env.PG_USERNAME || "postgres",
    password: process.env.PG_PASSWORD || "postgres",
    database: process.env.PG_DB || "sogebot",
    logging: false,
    entities: [Plugin_1.Plugin],
    migrations: [],
    subscribers: [],
    synchronize: true,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1zb3VyY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGF0YS1zb3VyY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNEJBQXlCO0FBQ3pCLHFDQUFvQztBQUNwQyw0Q0FBd0M7QUFFM0IsUUFBQSxhQUFhLEdBQUcsSUFBSSxvQkFBVSxDQUFDO0lBQ3hDLElBQUksRUFBRSxVQUFVO0lBQ2hCLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxXQUFXO0lBQ3hDLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJO0lBQ3pDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxVQUFVO0lBQy9DLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxVQUFVO0lBQy9DLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxTQUFTO0lBQ3hDLE9BQU8sRUFBRSxLQUFLO0lBQ2QsUUFBUSxFQUFFLENBQUMsZUFBTSxDQUFDO0lBQ2xCLFVBQVUsRUFBRSxFQUFFO0lBQ2QsV0FBVyxFQUFFLEVBQUU7SUFDZixXQUFXLEVBQUUsSUFBSTtDQUNwQixDQUFDLENBQUEifQ==