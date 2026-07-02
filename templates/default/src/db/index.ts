import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type AppDb = NeonHttpDatabase<typeof schema>;

let instance: AppDb | null = null;

function getDb(): AppDb {
  if (instance) return instance;

  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL が設定されていません。.env.local を確認してください。",
    );
  }

  instance = drizzle(
    neon(connectionString, {
      fetchOptions: {
        signal: AbortSignal.timeout(60_000),
      },
    }),
    { schema },
  );
  return instance;
}

export const db = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export type Db = AppDb;
