import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "[DB] DATABASE_URL is not set. Add it to .env.local and restart the server."
  );
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
