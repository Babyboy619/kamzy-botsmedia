import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[API] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: true, credentials: true }));

// ── Auth middleware ──────────────────────────────────────────────────────────

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: no token" });
  }
  const token = auth.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
  req.user = user;
  req.userId = user.id;
  next();
}

async function requireAdmin(req, res, next) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", req.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) return res.status(403).json({ message: "Admin access required" });
  next();
}

function errHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (e) {
      console.error("[API Error]", e.message);
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  };
}

// ── Health ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Catalog (public) ─────────────────────────────────────────────────────────

app.get("/api/catalog/products", errHandler(async (_req, res) => {
  const [{ data: products, error: pErr }, { data: stock, error: sErr }] = await Promise.all([
    supabaseAdmin.from("products").select("id,name,description,price,image_url,category,active,created_at").eq("active", true).order("created_at", { ascending: false }),
    supabaseAdmin.from("product_logins").select("product_id").eq("status", "available"),
  ]);
  if (pErr) throw new Error(pErr.message);
  if (sErr) throw new Error(sErr.message);
  const stockCounts = {};
  (stock ?? []).forEach(r => { stockCounts[r.product_id] = (stockCounts[r.product_id] ?? 0) + 1; });
  res.json({ products: products ?? [], stockCounts });
}));

// ── Admin verify ─────────────────────────────────────────────────────────────

app.post("/api/admin/verify", errHandler(async (req, res) => {
  const { accessToken } = req.body ?? {};
  if (!accessToken) return res.status(400).json({ message: "accessToken required" });
  const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(accessToken);
  if (uErr || !userData.user) return res.status(401).json({ message: "Invalid session" });
  const { data: role } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
  if (!role) return res.status(403).json({ message: "This account does not have admin access" });
  res.json({ ok: true, userId: userData.user.id });
}));

// ── Admin overview ────────────────────────────────────────────────────────────

app.get("/api/admin/overview", requireAuth, requireAdmin, errHandler(async (_req, res) => {
  const [
    { count: userCount },
    { data: orders },
    { count: productCount },
    { count: couponCount },
    { data: recentOrders },
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("orders").select("price_paid,created_at"),
    supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabaseAdmin.from("coupons").select("id", { count: "exact", head: true }).eq("active", true),
    supabaseAdmin.from("orders").select("id,price_paid,status,created_at,user_id,product_id").order("created_at", { ascending: false }).limit(10),
  ]);
  const productIds = Array.from(new Set((recentOrders ?? []).map(o => o.product_id).filter(Boolean)));
  const { data: recentProducts } = await supabaseAdmin.from("products").select("id,name").in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]);
  const productMap = new Map((recentProducts ?? []).map(p => [p.id, p]));
  const revenue = (orders ?? []).reduce((s, r) => s + Number(r.price_paid), 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayRevenue = (orders ?? []).filter(r => new Date(r.created_at) >= today).reduce((s, r) => s + Number(r.price_paid), 0);
  res.json({
    stats: { users: userCount ?? 0, orders: orders?.length ?? 0, revenue, todayRevenue, products: productCount ?? 0, coupons: couponCount ?? 0 },
    recentOrders: (recentOrders ?? []).map(o => ({ ...o, products: productMap.get(o.product_id) ?? null })),
  });
}));

// ── Admin orders ──────────────────────────────────────────────────────────────

app.get("/api/admin/orders", requireAuth, requireAdmin, errHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("orders").select("id,user_id,product_id,price_paid,status,created_at,coupon_code,discount_percent").order("created_at", { ascending: false }).limit(300);
  if (error) throw new Error(error.message);
  const userIds = Array.from(new Set((data ?? []).map(r => r.user_id)));
  const productIds = Array.from(new Set((data ?? []).map(r => r.product_id).filter(Boolean)));
  const [{ data: profiles }, { data: products }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id,email,first_name,last_name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    supabaseAdmin.from("products").select("id,name,category").in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  const productMap = new Map((products ?? []).map(p => [p.id, p]));
  res.json({ orders: (data ?? []).map(o => ({ ...o, user: profileMap.get(o.user_id) ?? null, products: productMap.get(o.product_id) ?? null })) });
}));

// ── Admin coupons ─────────────────────────────────────────────────────────────

app.get("/api/admin/coupons", requireAuth, requireAdmin, errHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  res.json({ coupons: data ?? [] });
}));

app.post("/api/admin/coupons", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { code, discount_percent, max_uses, expires_at } = req.body ?? {};
  if (!code || !discount_percent) return res.status(400).json({ message: "code and discount_percent required" });
  const { error } = await supabaseAdmin.from("coupons").insert({
    code: String(code).toUpperCase().trim(),
    discount_percent: Number(discount_percent),
    max_uses: max_uses ?? null,
    expires_at: expires_at ?? null,
    created_by: req.userId,
  });
  if (error) throw new Error(error.message);
  res.json({ ok: true });
}));

app.patch("/api/admin/coupons/:id", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { active } = req.body ?? {};
  const { error } = await supabaseAdmin.from("coupons").update({ active }).eq("id", req.params.id);
  if (error) throw new Error(error.message);
  res.json({ ok: true });
}));

app.delete("/api/admin/coupons/:id", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { error } = await supabaseAdmin.from("coupons").delete().eq("id", req.params.id);
  if (error) throw new Error(error.message);
  res.json({ ok: true });
}));

// ── Admin products ────────────────────────────────────────────────────────────

app.get("/api/admin/products", requireAuth, requireAdmin, errHandler(async (_req, res) => {
  const [{ data: products }, { data: stock }] = await Promise.all([
    supabaseAdmin.from("products").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("product_logins").select("product_id").eq("status", "available"),
  ]);
  const counts = {};
  (stock ?? []).forEach(r => { counts[r.product_id] = (counts[r.product_id] ?? 0) + 1; });
  res.json({ products: products ?? [], stockCounts: counts });
}));

app.post("/api/admin/products", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { name, description, price, image_url, category } = req.body ?? {};
  if (!name || price == null || !category) return res.status(400).json({ message: "name, price, and category are required" });
  const { data: prod, error } = await supabaseAdmin.from("products").insert({
    name: String(name).trim(),
    description: description || null,
    price: Number(price),
    image_url: image_url || null,
    category: String(category).trim(),
  }).select().single();
  if (error) throw new Error(error.message);
  res.json({ ok: true, product: prod });
}));

app.patch("/api/admin/products/:id", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { id } = req.params;
  const fields = req.body ?? {};
  delete fields.id;
  if (Object.keys(fields).length === 0) return res.status(400).json({ message: "No fields to update" });
  const { error } = await supabaseAdmin.from("products").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  res.json({ ok: true });
}));

app.delete("/api/admin/products/:id", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", req.params.id);
  if (error) throw new Error(error.message);
  res.json({ ok: true });
}));

// ── Admin product logins ──────────────────────────────────────────────────────

app.get("/api/admin/products/:id/logins", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin.from("product_logins").select("id,login_data,status").eq("product_id", req.params.id).order("created_at");
  if (error) throw new Error(error.message);
  res.json({ logins: data ?? [] });
}));

app.post("/api/admin/products/:id/logins", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { lines } = req.body ?? {};
  if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ message: "lines array required" });
  const rows = lines.map(login_data => ({ product_id: req.params.id, login_data }));
  const { error } = await supabaseAdmin.from("product_logins").insert(rows);
  if (error) throw new Error(error.message);
  res.json({ ok: true, count: rows.length });
}));

app.delete("/api/admin/logins/:id", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { error } = await supabaseAdmin.from("product_logins").delete().eq("id", req.params.id);
  if (error) throw new Error(error.message);
  res.json({ ok: true });
}));

// ── Admin image upload ────────────────────────────────────────────────────────

app.post("/api/admin/image-upload", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { fileName, contentType } = req.body ?? {};
  if (!fileName || !contentType) return res.status(400).json({ message: "fileName and contentType required" });
  if (!contentType.startsWith("image/")) return res.status(400).json({ message: "Only image uploads are allowed" });
  const ext = String(fileName).split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${req.userId}/${crypto.randomUUID()}.${ext}`;
  const { data: signed, error } = await supabaseAdmin.storage.from("product-images").createSignedUploadUrl(path);
  if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Could not prepare image upload");
  res.json({ path, signedUrl: signed.signedUrl, token: signed.token });
}));

app.post("/api/admin/image-url", errHandler(async (req, res) => {
  const { path } = req.body ?? {};
  if (!path) return res.status(400).json({ message: "path required" });
  if (/^https?:\/\//i.test(path)) return res.json({ url: path });
  const { data: signed, error } = await supabaseAdmin.storage.from("product-images").createSignedUrl(path, 3600);
  if (error || !signed?.signedUrl) throw new Error(error?.message ?? "Could not load image");
  res.json({ url: signed.signedUrl });
}));

// ── Admin users ───────────────────────────────────────────────────────────────

app.get("/api/admin/users", requireAuth, requireAdmin, errHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("profiles").select("id,first_name,last_name,username,email,phone,wallet_balance,is_suspended,created_at").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  res.json({ users: data ?? [] });
}));

app.post("/api/admin/users/suspend", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { userId, suspended } = req.body ?? {};
  if (!userId) return res.status(400).json({ message: "userId required" });
  const { error } = await supabaseAdmin.from("profiles").update({ is_suspended: suspended }).eq("id", userId);
  if (error) throw new Error(error.message);
  res.json({ ok: true });
}));

app.post("/api/admin/users/wallet", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { userEmail, amount, note } = req.body ?? {};
  if (!userEmail || amount == null) return res.status(400).json({ message: "userEmail and amount required" });
  const { data: profile, error: pErr } = await supabaseAdmin.from("profiles").select("id,wallet_balance").eq("email", userEmail).maybeSingle();
  if (pErr || !profile) return res.status(404).json({ message: "User not found" });
  const newBal = Number(profile.wallet_balance) + Number(amount);
  if (newBal < 0) return res.status(400).json({ message: "Resulting balance would be negative" });
  const { error: uErr } = await supabaseAdmin.from("profiles").update({ wallet_balance: newBal }).eq("id", profile.id);
  if (uErr) throw new Error(uErr.message);
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: profile.id,
    amount: Number(amount),
    type: Number(amount) >= 0 ? "admin_credit" : "admin_debit",
    note: note ?? null,
    admin_id: req.userId,
  });
  res.json({ ok: true, newBalance: newBal });
}));

// ── Admin admins ──────────────────────────────────────────────────────────────

app.get("/api/admin/admins", requireAuth, requireAdmin, errHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
  if (error) throw new Error(error.message);
  const userIds = Array.from(new Set((data ?? []).map(r => r.user_id)));
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id,email,first_name,last_name").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
  res.json({ admins: (data ?? []).map(r => ({ user_id: r.user_id, profiles: profileMap.get(r.user_id) ?? null })) });
}));

app.post("/api/admin/admins", requireAuth, requireAdmin, errHandler(async (req, res) => {
  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ message: "email required" });
  const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile) return res.status(404).json({ message: "No user found with that email — they must register first" });
  const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: profile.id, role: "admin" });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  res.json({ ok: true });
}));

app.delete("/api/admin/admins/:userId", requireAuth, requireAdmin, errHandler(async (req, res) => {
  if (req.params.userId === req.userId) return res.status(400).json({ message: "You cannot remove yourself" });
  const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", req.params.userId).eq("role", "admin");
  if (error) throw new Error(error.message);
  res.json({ ok: true });
}));

// ── Admin payments ────────────────────────────────────────────────────────────

app.get("/api/admin/payments", requireAuth, requireAdmin, errHandler(async (_req, res) => {
  const { data, error } = await supabaseAdmin.from("payment_transactions").select("id,user_id,provider,reference,amount_paid,amount_credited,coupon_code,status,created_at,verified_at").order("created_at", { ascending: false }).limit(300);
  if (error) throw new Error(error.message);
  const userIds = Array.from(new Set((data ?? []).map(r => r.user_id)));
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id,email").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const emailById = new Map((profiles ?? []).map(p => [p.id, p.email]));
  res.json({ payments: (data ?? []).map(p => ({ ...p, email: emailById.get(p.user_id) ?? null })) });
}));

// ── My purchases ──────────────────────────────────────────────────────────────

app.get("/api/my/purchases", requireAuth, errHandler(async (req, res) => {
  const { data: orders, error } = await supabaseAdmin.from("orders").select("id,product_id,login_id,price_paid,status,created_at,coupon_code,discount_percent").eq("user_id", req.userId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const productIds = Array.from(new Set((orders ?? []).map(o => o.product_id)));
  const loginIds = (orders ?? []).map(o => o.login_id).filter(Boolean);
  const [{ data: products }, { data: logins }] = await Promise.all([
    supabaseAdmin.from("products").select("id,name,description,image_url,category,price").in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]),
    loginIds.length ? supabaseAdmin.from("product_logins").select("id,login_data").in("id", loginIds) : Promise.resolve({ data: [] }),
  ]);
  const pMap = new Map((products ?? []).map(p => [p.id, p]));
  const lMap = new Map((logins ?? []).map(l => [l.id, l.login_data]));
  res.json({
    purchases: (orders ?? []).map(o => ({
      id: o.id,
      productId: o.product_id,
      product: pMap.get(o.product_id) ?? null,
      loginData: o.login_id ? (lMap.get(o.login_id) ?? null) : null,
      pricePaid: Number(o.price_paid),
      status: o.status,
      createdAt: o.created_at,
      couponCode: o.coupon_code,
      discountPercent: o.discount_percent,
    })),
  });
}));

// ── Purchase product ──────────────────────────────────────────────────────────

app.post("/api/store/purchase", requireAuth, errHandler(async (req, res) => {
  const { productId, couponCode } = req.body ?? {};
  if (!productId) return res.status(400).json({ message: "productId required" });
  const { data: rpc, error } = await supabaseAdmin.rpc("purchase_product_atomic", {
    _user_id: req.userId,
    _product_id: productId,
    _coupon_code: couponCode || null,
  });
  if (error) throw new Error(error.message);
  res.json(rpc);
}));

// ── Payments ──────────────────────────────────────────────────────────────────

function genRef(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function recordPending({ userId, reference, amount, provider, couponCode }) {
  const { error } = await supabaseAdmin.from("payment_transactions").insert({
    user_id: userId,
    provider,
    reference,
    amount_paid: amount,
    amount_credited: 0,
    coupon_code: couponCode ?? null,
    status: "pending",
  });
  if (error) throw new Error(error.message);
}

app.post("/api/payments/init-paystack", requireAuth, errHandler(async (req, res) => {
  const { amount, couponCode } = req.body ?? {};
  if (!amount || amount < 100) return res.status(400).json({ message: "Minimum amount is ₦100" });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(503).json({ message: "Paystack is not configured yet." });
  const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", req.userId).maybeSingle();
  const email = profile?.email ?? req.user.email;
  if (!email) return res.status(400).json({ message: "Email missing on account" });
  const reference = genRef("ps");
  const origin = req.headers.origin || req.headers.referer ? new URL(req.headers.origin || req.headers.referer).origin : "https://kamzybotsmedia.store";
  const coupon = couponCode?.toUpperCase().trim() || null;
  await recordPending({ userId: req.userId, reference, amount: Number(amount), provider: "paystack", couponCode: coupon });
  const apiRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount: Math.round(Number(amount) * 100), currency: "NGN", reference, callback_url: `${origin}/wallet?ref=${reference}&provider=paystack`, metadata: { user_id: req.userId, coupon_code: coupon } }),
  });
  const json = await apiRes.json();
  if (!apiRes.ok || !json.status) throw new Error(json.message || "Unable to start Paystack payment.");
  res.json({ authorization_url: json.data.authorization_url, reference });
}));

app.post("/api/payments/init-monnify", requireAuth, errHandler(async (req, res) => {
  const { amount, couponCode } = req.body ?? {};
  if (!amount || amount < 100) return res.status(400).json({ message: "Minimum amount is ₦100" });
  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  const contractCode = process.env.MONNIFY_CONTRACT_CODE;
  if (!apiKey || !secretKey || !contractCode) return res.status(503).json({ message: "Monnify is not configured yet." });
  const { data: profile } = await supabaseAdmin.from("profiles").select("email,first_name,last_name").eq("id", req.userId).maybeSingle();
  const email = profile?.email ?? req.user.email;
  if (!email) return res.status(400).json({ message: "Email missing on account" });
  const MONNIFY_BASE = process.env.MONNIFY_ENV === "live" ? "https://api.monnify.com" : "https://sandbox.monnify.com";
  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  const authRes = await fetch(`${MONNIFY_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
  });
  const authJson = await authRes.json();
  if (!authRes.ok || !authJson.responseBody?.accessToken) throw new Error(authJson.responseMessage || "Monnify authentication failed.");
  const accessToken = authJson.responseBody.accessToken;
  const reference = genRef("mn");
  const origin = req.headers.origin || "https://kamzybotsmedia.store";
  const coupon = couponCode?.toUpperCase().trim() || null;
  await recordPending({ userId: req.userId, reference, amount: Number(amount), provider: "monnify", couponCode: coupon });
  const txRes = await fetch(`${MONNIFY_BASE}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Number(amount), customerName: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Customer", customerEmail: email, paymentReference: reference, paymentDescription: "Sammy Store Logs — Wallet Top-Up", currencyCode: "NGN", contractCode, redirectUrl: `${origin}/wallet?ref=${reference}&provider=monnify`, paymentMethods: ["CARD", "ACCOUNT_TRANSFER", "USSD"] }),
  });
  const txJson = await txRes.json();
  if (!txRes.ok || !txJson.responseBody?.checkoutUrl) throw new Error(txJson.responseMessage || "Unable to start Monnify payment.");
  res.json({ checkout_url: txJson.responseBody.checkoutUrl, reference });
}));

app.post("/api/payments/verify", requireAuth, errHandler(async (req, res) => {
  const { reference, provider: providerHint } = req.body ?? {};
  if (!reference) return res.status(400).json({ message: "reference required" });
  const { data: tx, error } = await supabaseAdmin.from("payment_transactions").select("*").eq("reference", reference).maybeSingle();
  if (error || !tx) return res.status(404).json({ message: "Unknown reference" });
  if (tx.user_id !== req.userId) return res.status(403).json({ message: "Forbidden" });
  if (tx.status === "success") return res.json({ ok: true, status: "success", amountCredited: Number(tx.amount_credited) });
  const provider = providerHint || tx.provider || "paystack";

  if (provider === "monnify") {
    const apiKey = process.env.MONNIFY_API_KEY;
    const secretKey = process.env.MONNIFY_SECRET_KEY;
    const MONNIFY_BASE = process.env.MONNIFY_ENV === "live" ? "https://api.monnify.com" : "https://sandbox.monnify.com";
    const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
    const authRes = await fetch(`${MONNIFY_BASE}/api/v1/auth/login`, { method: "POST", headers: { Authorization: `Basic ${credentials}` } });
    const authJson = await authRes.json();
    if (!authRes.ok || !authJson.responseBody?.accessToken) throw new Error("Monnify auth failed during verification.");
    const accessToken = authJson.responseBody.accessToken;
    const verRes = await fetch(`${MONNIFY_BASE}/api/v2/transactions/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const raw = await verRes.json();
    const success = verRes.ok && raw?.responseBody?.paymentStatus === "PAID";
    const amountPaid = success ? Number(raw.responseBody?.amountPaid ?? 0) : 0;
    if (!success) {
      await supabaseAdmin.from("payment_transactions").update({ status: "failed", raw_payload: raw, verified_at: new Date().toISOString() }).eq("id", tx.id);
      return res.json({ ok: false, status: "failed", amountCredited: 0 });
    }
    const { data: rpc, error: rpcErr } = await supabaseAdmin.rpc("credit_wallet_from_payment", { _reference: reference, _provider: "monnify", _amount_paid: amountPaid, _raw: raw });
    if (rpcErr) throw new Error(rpcErr.message);
    return res.json({ ok: true, status: "success", amountCredited: Number(rpc?.amountCredited ?? 0) });
  }

  // Paystack
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const verRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` } });
  const raw = await verRes.json();
  const success = verRes.ok && raw?.data?.status === "success";
  const amountPaid = success ? Number(raw.data.amount) / 100 : 0;
  if (!success) {
    await supabaseAdmin.from("payment_transactions").update({ status: "failed", raw_payload: raw, verified_at: new Date().toISOString() }).eq("id", tx.id);
    return res.json({ ok: false, status: "failed", amountCredited: 0 });
  }
  const { data: rpc, error: rpcErr } = await supabaseAdmin.rpc("credit_wallet_from_payment", { _reference: reference, _provider: "paystack", _amount_paid: amountPaid, _raw: raw });
  if (rpcErr) throw new Error(rpcErr.message);
  res.json({ ok: true, status: "success", amountCredited: Number(rpc?.amountCredited ?? 0) });
}));

// ── Static + SPA fallback (production only) ──────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, "..", "dist");

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(join(distPath, "index.html"));
  });
  console.log("[API] Serving built frontend from dist/");
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[API] Server running on port ${PORT}`);
});
