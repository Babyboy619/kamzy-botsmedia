import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, ShoppingCart, Wallet, Package, Ticket, TrendingUp } from "lucide-react";

function fmt(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 0 });
}

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get("/api/admin/overview");
      setData(res);
    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const stats = data?.stats ?? {};
  const recentOrders = data?.recentOrders ?? [];

  const cards = [
    { label: "Total Users", value: stats.users ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total Orders", value: stats.orders ?? 0, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Total Revenue", value: fmt(stats.revenue ?? 0), icon: Wallet, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Today Revenue", value: fmt(stats.todayRevenue ?? 0), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Active Products", value: stats.products ?? 0, icon: Package, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { label: "Active Coupons", value: stats.coupons ?? 0, icon: Ticket, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Live stats for your store</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border border-border/60 p-5 ${c.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            {loading ? (
              <div className="h-8 w-20 rounded bg-muted/50 animate-pulse" />
            ) : (
              <div className="text-2xl font-bold">{c.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="font-semibold">Recent Orders</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="border-t border-border/40">
                    <td className="px-4 py-3 truncate max-w-[200px]">{o.products?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{fmt(Number(o.price_paid))}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
