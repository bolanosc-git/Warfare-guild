import { HttpError } from "./http.js";

export const databaseConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

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

