import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string; name: string; description: string | null; price: number;
  image_url: string | null; active: boolean; category: string;
};

const PRESET_CATEGORIES = [
  "Facebook", "Instagram", "TikTok", "Telegram", "Twitter/X",
  "Netflix", "Canva", "Spotify", "Gmail", "Crypto Accounts",
  "VPN", "YouTube", "Reddit", "Others",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(1000);
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("Facebook");
  const [customCategory, setCustomCategory] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/products");
      setProducts(res.products as Product[]);
      setStockCounts(res.stockCounts);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const finalCategory = (category === "__custom__" ? customCategory.trim() : category) || "Others";
    if (!name.trim()) { toast.error("Product name is required"); return; }
    setCreating(true);
    try {
      await api.post("/api/admin/products", { name: name.trim(), description: description || null, price, image_url: imageUrl || null, category: finalCategory });
      toast.success("Product created");
      setName(""); setDescription(""); setPrice(1000); setImageUrl(""); setCustomCategory("");
      load();
    } catch (e: any) { toast.error(e.message); }
    setCreating(false);
  }

  async function handleImageFile(file: File | null) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const upload = await api.post("/api/admin/image-upload", { fileName: file.name, contentType: file.type });
      const { error } = await supabase.storage.from("product-images").uploadToSignedUrl(upload.path, upload.token, file);
      if (error) throw error;
      setImageUrl(upload.path);
      toast.success("Image uploaded");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    setUploadingImage(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/products/${id}`);
      toast.success("Deleted");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleToggleActive(p: Product) {
    try {
      await api.patch(`/api/admin/products/${p.id}`, { active: !p.active });
      toast.success(p.active ? "Product unpublished" : "Product published");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <p className="text-sm text-muted-foreground mt-1">{products.length} products total</p>
      </div>

      {/* Create product form */}
      <div className="bg-card border border-border/60 rounded-xl p-6">
        <h2 className="font-semibold mb-4">Add New Product</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Product Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Facebook Account"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Price (₦) *</label>
              <input type="number" min={0} value={price} onChange={e => setPrice(Number(e.target.value))} required
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
              {PRESET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">Custom…</option>
            </select>
            {category === "__custom__" && (
              <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Enter category name"
                className="mt-2 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Product Image</label>
            <div className="flex gap-3 items-start flex-wrap">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border bg-muted/30 text-sm cursor-pointer hover:bg-muted transition-colors">
                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploadingImage ? "Uploading…" : "Upload Image"}
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                  onChange={e => handleImageFile(e.target.files?.[0] ?? null)} disabled={uploadingImage} />
              </label>
              {imageUrl && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  <Check className="w-3 h-3 text-green-600" /> Image uploaded
                  <button type="button" onClick={() => setImageUrl("")} className="text-destructive hover:text-destructive/80 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? "Creating…" : "Create Product"}
          </button>
        </form>
      </div>

      {/* Product list */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No products yet — create one above.</div>
        ) : (
          <ul className="divide-y divide-border/40">
            {products.map(p => (
              <ProductRow
                key={p.id}
                product={p}
                stock={stockCounts[p.id] ?? 0}
                isOpen={openId === p.id}
                isEdit={editId === p.id}
                onToggleOpen={() => setOpenId(openId === p.id ? null : p.id)}
                onToggleEdit={() => setEditId(editId === p.id ? null : p.id)}
                onDelete={() => handleDelete(p.id)}
                onToggleActive={() => handleToggleActive(p)}
                onRefresh={load}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProductRow({
  product, stock, isOpen, isEdit, onToggleOpen, onToggleEdit, onDelete, onToggleActive, onRefresh
}: {
  product: Product; stock: number; isOpen: boolean; isEdit: boolean;
  onToggleOpen: () => void; onToggleEdit: () => void;
  onDelete: () => void; onToggleActive: () => void; onRefresh: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(product.price);
  const [category, setCategory] = useState(product.category);
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [logins, setLogins] = useState<{ id: string; login_data: string; status: string }[]>([]);
  const [loginsLoading, setLoginsLoading] = useState(false);
  const [newLines, setNewLines] = useState("");
  const [addingLines, setAddingLines] = useState(false);

  async function loadLogins() {
    setLoginsLoading(true);
    try {
      const res = await api.get(`/api/admin/products/${product.id}/logins`);
      setLogins(res.logins);
    } catch (e: any) { toast.error(e.message); }
    setLoginsLoading(false);
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Product name is required"); return; }
    setSaving(true);
    try {
      await api.patch(`/api/admin/products/${product.id}`, {
        name: name.trim(), description: description || null, price: Number(price),
        image_url: imageUrl || null, category: category || "Others",
      });
      toast.success("Product updated");
      onToggleEdit();
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  }

  async function handleImageFile(file: File | null) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const upload = await api.post("/api/admin/image-upload", { fileName: file.name, contentType: file.type });
      const { error } = await supabase.storage.from("product-images").uploadToSignedUrl(upload.path, upload.token, file);
      if (error) throw error;
      setImageUrl(upload.path);
      toast.success("Image uploaded");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    setUploadingImage(false);
  }

  async function handleAddLines() {
    const lines = newLines.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) { toast.error("No valid lines"); return; }
    setAddingLines(true);
    try {
      await api.post(`/api/admin/products/${product.id}/logins`, { lines });
      toast.success(`Added ${lines.length} login(s)`);
      setNewLines("");
      loadLogins();
      onRefresh();
    } catch (e: any) { toast.error(e.message); }
    setAddingLines(false);
  }

  async function handleDeleteLogin(id: string) {
    if (!confirm("Remove this login credential?")) return;
    try {
      await api.delete(`/api/admin/logins/${id}`);
      setLogins(l => l.filter(x => x.id !== id));
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <li>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggleOpen} className="text-muted-foreground hover:text-foreground">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.category} · ₦{Number(product.price).toLocaleString()} · {stock} in stock</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
          {product.active ? "Live" : "Draft"}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={onToggleEdit} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggleActive} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium">
            {product.active ? "Unpublish" : "Publish"}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isEdit && (
        <div className="px-4 pb-4 border-t border-border/40 pt-4 bg-muted/20 space-y-3">
          <h3 className="text-sm font-semibold">Edit Product</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Price (₦)</label>
              <input type="number" min={0} value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Image</label>
            <div className="flex gap-2 items-center">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border bg-muted/30 text-xs cursor-pointer hover:bg-muted">
                {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {uploadingImage ? "Uploading…" : "Replace Image"}
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                  onChange={e => handleImageFile(e.target.files?.[0] ?? null)} disabled={uploadingImage} />
              </label>
              {imageUrl && <span className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-green-600" /> Image set</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save changes
            </button>
            <button onClick={onToggleEdit} className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="px-4 pb-4 border-t border-border/40 pt-4 bg-muted/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Login Credentials ({logins.length})</h3>
            {logins.length === 0 && !loginsLoading && (
              <button onClick={loadLogins} className="text-xs text-primary hover:underline">Load credentials</button>
            )}
          </div>

          {loginsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>
          ) : logins.length > 0 ? (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {logins.map(l => (
                <li key={l.id} className="flex items-center gap-2 text-xs bg-background rounded-lg px-3 py-2 border border-border/40">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${l.status === "available" ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <span className="flex-1 font-mono truncate">{l.login_data}</span>
                  <span className="text-muted-foreground">{l.status}</span>
                  <button onClick={() => handleDeleteLogin(l.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div>
            <label className="block text-xs font-medium mb-1.5">Add Login Credentials (one per line)</label>
            <textarea value={newLines} onChange={e => setNewLines(e.target.value)} rows={3} placeholder={"email:password\nemail2:password2"}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono resize-none" />
            <button onClick={handleAddLines} disabled={addingLines || !newLines.trim()}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60">
              {addingLines ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {addingLines ? "Adding…" : "Add Credentials"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
