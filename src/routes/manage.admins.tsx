import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/admins");
      setAdmins(res.admins);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/admin/admins", { email: email.trim() });
      toast.success("Admin added");
      setEmail("");
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this admin?")) return;
    try {
      await api.delete(`/api/admin/admins/${userId}`);
      toast.success("Admin removed");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Admins</h1>
        <p className="text-sm text-muted-foreground mt-1">{admins.length} administrators</p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Add Admin by Email</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com"
            className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm" />
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 shrink-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Admin
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">The user must already have a registered account.</p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="font-semibold">Current Administrators</h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No admins found</div>
        ) : (
          <ul className="divide-y divide-border/40">
            {admins.map((a: any) => (
              <li key={a.user_id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {a.profiles?.first_name && a.profiles?.last_name
                      ? `${a.profiles.first_name} ${a.profiles.last_name}`
                      : a.profiles?.email ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.profiles?.email ?? a.user_id}</p>
                </div>
                <button onClick={() => handleRemove(a.user_id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
