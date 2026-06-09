import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSupabaseClient(): SupabaseClient<Database> | null {
  const SUPABASE_URL =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
    (typeof process !== "undefined" ? process.env?.SUPABASE_URL : undefined);

  // Support both key names
  const SUPABASE_KEY =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (typeof process !== "undefined"
      ? process.env?.SUPABASE_PUBLISHABLE_KEY
      : undefined);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("[Supabase] Missing env vars — running in offline mode");
    return null;
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

const offlineError = () =>
  new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");

function buildOfflineStub(): SupabaseClient<Database> {
  const queryBuilder: any = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "then") return undefined;
        if (prop === Symbol.iterator) return undefined;
        return (..._args: unknown[]) => queryBuilder;
      },
    },
  );
  queryBuilder.then = (resolve: (v: any) => void) =>
    resolve({ data: null, error: offlineError() });

  const authStub = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: offlineError() }),
    signInWithOAuth: async () => ({ data: null, error: offlineError() }),
    signUp: async () => ({ data: null, error: offlineError() }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: offlineError() }),
    updateUser: async () => ({ data: null, error: offlineError() }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  };

  return new Proxy({} as SupabaseClient<Database>, {
    get(_t, prop) {
      if (prop === "auth") return authStub;
      if (prop === "from" || prop === "rpc") return () => queryBuilder;
      if (prop === "storage")
        return {
          from: () => ({
            upload: async () => ({ data: null, error: offlineError() }),
            download: async () => ({ data: null, error: offlineError() }),
            getPublicUrl: () => ({ data: { publicUrl: "" } }),
            remove: async () => ({ data: null, error: offlineError() }),
            list: async () => ({ data: null, error: offlineError() }),
            uploadToSignedUrl: async () => ({ data: null, error: offlineError() }),
          }),
        };
      if (prop === "functions")
        return { invoke: async () => ({ data: null, error: offlineError() }) };
      if (prop === "channel")
        return () => ({
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
          subscribe: () => ({ unsubscribe: () => {} }),
          unsubscribe: () => {},
        });
      if (prop === "removeChannel") return () => {};
      return () => queryBuilder;
    },
  });
}

let _supabase: SupabaseClient<Database> | null | undefined;

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_t, prop, receiver) {
    if (_supabase === undefined) _supabase = createSupabaseClient();
    const target = _supabase ?? buildOfflineStub();
    return Reflect.get(target, prop, receiver);
  },
});
