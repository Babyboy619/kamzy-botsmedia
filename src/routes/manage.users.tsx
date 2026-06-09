import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Ban, CheckCircle2, Wallet, Search } from "lucide-react";
import { toast } from "sonner";

type U = {
  id: string; first_name: string | null; last_name: string | null;
  username: string | null; email: string | null; phone: string | null;
  wallet_balance: number; is_suspended: boolean; created_at: string;
};

function fmt(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fundFor, setFundFor] = useState<U | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.users as U[]);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleSuspend(u: U) {
    if (!confirm(`${u.is_suspended ? "Unsuspend" : "Suspend"} ${u.email}?`)) return;
    try {
      await api.patch(`/api/admin/users/${u.id}/suspend`, { suspended: !u.is_suspended });
      toast.success("Updated");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  const filtered = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by email, name, username, phone…"
          className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm" />
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">Wallet</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Joined</th>
                  <th className="px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{[u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "—"}</td>
                    <td className="px-4 py-3 text-xs">{u.email}</td>
                    <td className="px-4 py-3">{u.phone || "—"}</td>
                    <td className="px-4 py-3 font-medium">{fmt(Number(u.wallet_balance))}</td>
                    <td className="px-4 py-3">
                      {u.is_suspended
                        ? <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive">Suspended</span>
                        : <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setFundFor(u)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground">
                          <Wallet className="w-3 h-3" /> Fund
                        </button>
                        <button onClick={() => toggleSuspend(u)}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${u.is_suspended ? "bg-emerald-600 text-white" : "bg-destructive text-destructive-foreground"}`}>
                          {u.is_suspended ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                          {u.is_suspended ? "Unsuspend" : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {fundFor && (
        <FundModal
          user={fundFor}
          onClose={() => setFundFor(null)}
          onDone={() => { setFundFor(null); load(); }}
        />
      )}
    </div>
  );
}

function FundModal({ user, onClose, onDone }: { user: U; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(1000);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/api/admin/users/adjust-wallet", { userEmail: user.email, amount, note: note || undefined });
      toast.success(`Wallet updated. New balance: ₦${Number(res.newBalance).toLocaleString()}`);
      onDone();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()}
        className="bg-card rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
        <div>
          <h2 className="font-display text-lg font-bold">Adjust Wallet</h2>
          <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
          <p className="text-xs text-muted-foreground">Current balance: ₦{Number(user.wallet_balance).toLocaleString()}</p>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Amount (₦) — use negative to debit</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Refund for failed payment"
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {saving ? "Saving…" : "Apply"}
          </button>
        </div>
      </form>
    </div>
  );
}
