import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "./types.js";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://dev_user:dev_password@localhost:5432/news_platform";

export const pool = new Pool({
  connectionString,
  max: 10,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
});