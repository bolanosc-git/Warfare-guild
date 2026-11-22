import { createHash, timingSafeEqual } from "node:crypto";
import { HttpError } from "./http.js";

export const databaseConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
export const guildWritesEnabled = () => databaseConfigured() && (process.env.GUILD_REPORT_TOKEN?.length ?? 0) >= 24;

export async function database(table, search, options = {}) {
  const origin = new URL(process.env.SUPABASE_URL);
  if (origin.protocol !== "https:" || origin.username || origin.password) {
    throw new HttpError(503, "The guild database URL is invalid.");
  }
  const url = new URL(`/rest/v1/${table}`, origin);
  url.search = new URLSearchParams(search);
  const key = process.env.SUPABASE_SECRET_KEY;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: key, ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
      ...options.headers
    },
    redirect: "error",
    signal: AbortSignal.timeout(7500)
  });
  if (!response.ok) throw new HttpError(502, "The guild database is temporarily unavailable.");
  return response.json();
}


export function validEditor(request) {
  const expected = process.env.GUILD_REPORT_TOKEN;
  const presented = request.headers.get("Authorization")?.match(/^Bearer (.{1,256})$/i)?.[1];
  if (!presented) return false;
  const hash = value => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(expected), hash(presented));
}

