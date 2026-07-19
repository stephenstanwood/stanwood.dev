import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

function databaseUrl(): string | undefined {
  return import.meta.env.LINKEDIN_TRACKER_DATABASE_URL ??
    process.env.LINKEDIN_TRACKER_DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL;
}

export function hasLinkedInDatabase(): boolean {
  return Boolean(databaseUrl());
}

export function getLinkedInSql(): NeonQueryFunction<false, false> {
  if (sqlClient) return sqlClient;
  const url = databaseUrl();
  if (!url) throw new Error("LINKEDIN_TRACKER_DATABASE_URL is not configured.");
  sqlClient = neon(url);
  return sqlClient;
}
