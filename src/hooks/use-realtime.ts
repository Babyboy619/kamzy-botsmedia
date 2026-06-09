import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Table =
  | "products"
  | "product_logins"
  | "profiles"
  | "orders"
  | "wallet_transactions"
  | "coupons"
  | "payment_transactions"
  | "user_roles";

/**
 * Subscribe to Postgres changes on one or more tables and run `onChange`
 * whenever any row in any of them is inserted/updated/deleted.
 * Use this to make pages live-update without manual refresh.
 */
export function useRealtime(tables: Table[], onChange: () => void) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const channel = supabase.channel(`rt-${tables.join("-")}-${Math.random().toString(36).slice(2, 8)}`);
    tables.forEach((table) => {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table },
        () => cb.current(),
      );
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join("|")]);
}
