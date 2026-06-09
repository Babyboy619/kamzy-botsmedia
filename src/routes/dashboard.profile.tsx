import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, User, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, username, phone")
        .eq("id", user.id)
        .single();
      if (data) {
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setUsername(data.username ?? "");
        setPhone(data.phone ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      username: username.trim() || null,
      phone: phone.trim() || null,
    });
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
    setSaving(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold">Edit Profile</h1>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">First Name</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Last Name</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="johndoe"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 XXX XXX XXXX"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email (read-only)</label>
              <input value={email} readOnly
                className="w-full h-10 rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground" />
            </div>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
