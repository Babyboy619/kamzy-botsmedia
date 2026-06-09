import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Coupon = {
  id: string; code: string; discount_percent: number; active: boolean;
  max_uses: number | null; times_used: number; expires_at: string | null;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [discountPct, setDiscountPct] = useState(10);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/coupons");
      setCoupons(res.coupons);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { toast.error("Coupon code required"); return; }
    setCreating(true);
    try {
      await api.post("/api/admin/coupons", {
        code: code.trim().toUpperCase(),
        discount_percent: Number(discountPct),
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt || null,
      });
      toast.success("Coupon created");
      setCode(""); setDiscountPct(10); setMaxUses(""); setExpiresAt("");
      load();
    } catch (e: any) { toast.error(e.message); }
    setCreating(false);
  }

  async function handleToggle(c: Coupon) {
    try {
      await api.patch(`/api/admin/coupons/${c.id}`, { active: !c.active });
      toast.success(c.active ? "Coupon deactivated" : "Coupon activated");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/api/admin/coupons/${id}`);
      toast.success("Deleted");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Coupons</h1>
        <p className="text-sm text-muted-foreground mt-1">{coupons.length} coupons</p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Create Coupon</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Code *</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required placeholder="e.g. GIFT10"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Discount % *</label>
              <input type="number" min={1} max={100} value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} required
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Max Uses (blank = unlimited)</label>
              <input type="number" min={1} value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="e.g. 100"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Expiry Date (blank = no expiry)</label>
              <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? "Creating…" : "Create Coupon"}
          </button>
        </form>
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No coupons yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[550px]">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Code</th>
                  <th className="px-4 py-2.5 font-medium">Discount</th>
                  <th className="px-4 py-2.5 font-medium">Uses</th>
                  <th className="px-4 py-2.5 font-medium">Expires</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                    <td className="px-4 py-3">{c.discount_percent}%</td>
                    <td className="px-4 py-3">{c.times_used}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(c)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {c.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
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
