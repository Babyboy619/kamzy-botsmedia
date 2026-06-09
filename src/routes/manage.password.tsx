import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

export default function PasswordPage() {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { toast.error("Passwords do not match"); return; }
    if (next.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) { toast.error(error.message); }
    else { toast.success("Password updated"); setNext(""); setConfirm(""); }
    setSaving(false);
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Change Password</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your admin account password</p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <input type="password" value={next} onChange={e => setNext(e.target.value)} required minLength={8}
              placeholder="At least 8 characters"
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8}
              placeholder="Repeat new password"
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {saving ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
