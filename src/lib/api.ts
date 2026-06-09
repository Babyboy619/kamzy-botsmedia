import { supabase } from "@/integrations/supabase/client";

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.access_token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(path, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });
  let body: any;
  try { body = await res.json(); } catch { body = {}; }
  if (!res.ok) {
    throw new Error(body?.message || body?.error || res.statusText || "Request failed");
  }
  return body as T;
}

export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = any>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
