import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, Clock, Search } from "lucide-react";

function fmt(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 0 });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
      <CheckCircle2 className="w-3 h-3" /> Success
    </span>
  );
  if (status === "failed") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">
      <Clock className="w-3 h-3" /> {status}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/payments");
      setPayments(res.payments);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = payments.filter(p =>
    !search ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase()) ||
    p.provider?.toLowerCase().includes(search.toLowerCase()) ||
    p.status?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalCredited = payments
    .filter(p => p.status === "success")
    .reduce((s, p) => s + Number(p.amount_credited), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {payments.length} transactions · {fmt(totalCredited)} total credited
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by email, reference, provider…"
          className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm" />
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Reference</th>
                  <th className="px-4 py-2.5 font-medium">Provider</th>
                  <th className="px-4 py-2.5 font-medium">Paid</th>
                  <th className="px-4 py-2.5 font-medium">Credited</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="px-4 py-3 truncate max-w-[150px]">{p.email ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[130px]">{p.reference}</td>
                    <td className="px-4 py-3 capitalize">{p.provider}</td>
                    <td className="px-4 py-3 font-medium">{fmt(Number(p.amount_paid))}</td>
                    <td className="px-4 py-3">{fmt(Number(p.amount_credited))}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
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
