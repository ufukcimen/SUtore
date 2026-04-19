import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ChevronDown,
  Edit,
  FolderOpen,
  LoaderCircle,
  MessageSquare,
  Package,
  Plus,
  ReceiptText,
  ShieldAlert,
  Star,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import { StorefrontPageShell } from "../../cart/components/StorefrontPageShell";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";

// ── Helpers ──────────────────────────────────────────────────────────

function formatCurrency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

const TABS = [
  { id: "products", label: "Products", Icon: Package },
  { id: "categories", label: "Categories", Icon: FolderOpen },
  { id: "stock", label: "Stock", Icon: Box },
  { id: "invoices", label: "Invoices", Icon: ReceiptText },
  { id: "deliveries", label: "Deliveries", Icon: Truck },
  { id: "comments", label: "Comments", Icon: MessageSquare },
];

// ── Main component ──────────────────────────────────────────────────

export function ManagerDashboardPage() {
  const navigate = useNavigate();
  const user = useStoredUser();
  const isManager = user?.role === "product_manager";
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/manager/dashboard" }, replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  if (!isManager) {
    return (
      <StorefrontPageShell currentStep="" description="" eyebrow="Access denied" title="This area is for product managers.">
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900">
          <ShieldAlert className="mx-auto h-8 w-8" />
          <p className="mt-4 text-lg font-semibold">Insufficient permissions</p>
          <Link to="/" className="mt-6 inline-flex items-center rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow">Back to store</Link>
        </section>
      </StorefrontPageShell>
    );
  }

  return (
    <StorefrontPageShell currentStep="" description="Manage products, categories, stock, invoices, deliveries, and reviews." eyebrow="Manager" title="Product Manager Dashboard">
      <nav className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === id
                ? "border-cyan-300 bg-cyan-50 text-brand-accent"
                : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-brand-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {activeTab === "products" ? <ProductsTab user={user} /> : null}
        {activeTab === "categories" ? <CategoriesTab user={user} /> : null}
        {activeTab === "stock" ? <StockTab user={user} /> : null}
        {activeTab === "invoices" ? <InvoicesTab user={user} /> : null}
        {activeTab === "deliveries" ? <DeliveriesTab user={user} /> : null}
        {activeTab === "comments" ? <CommentsTab user={user} /> : null}
      </div>
    </StorefrontPageShell>
  );
}

// ── Products Tab ────────────────────────────────────────────────────

function ProductsTab({ user }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const res = await http.get("/manager/products", { params: { manager_user_id: user.user_id } });
      setProducts(res.data);
    } catch { setProducts([]); }
    finally { setIsLoading(false); }
  }

  async function handleDeactivate(id) {
    try {
      await http.delete(`/manager/products/${id}`, { params: { manager_user_id: user.user_id } });
      setProducts((prev) => prev.map((p) => p.product_id === id ? { ...p, is_active: false } : p));
    } catch { /* silent */ }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) return;
    try {
      await http.delete(`/manager/products/${id}/permanent`, { params: { manager_user_id: user.user_id } });
      setProducts((prev) => prev.filter((p) => p.product_id !== id));
    } catch { /* silent */ }
  }

  function handleEdit(product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleFormDone() {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{products.length} products total</p>
        <button type="button" onClick={() => { setEditingProduct(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {showForm ? <ProductForm user={user} product={editingProduct} onDone={handleFormDone} onCancel={() => { setShowForm(false); setEditingProduct(null); }} /> : null}

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.product_id} className={`flex flex-col gap-3 rounded-[1.5rem] border p-4 sm:flex-row sm:items-center sm:justify-between ${p.is_active ? "border-slate-200 bg-white/90" : "border-slate-200/50 bg-slate-50/50 opacity-60"}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-ink">{p.name}</span>
                {!p.is_active ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Inactive</span> : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">ID: {p.product_id} &middot; {p.category} &middot; {formatCurrency(p.price)} &middot; Stock: {p.stock_quantity ?? 0}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => handleEdit(p)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-brand-ink">
                <Edit className="h-3 w-3" /> Edit
              </button>
              {p.is_active ? (
                <button type="button" onClick={() => handleDeactivate(p.product_id)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:text-amber-700">
                  <XCircle className="h-3 w-3" /> Deactivate
                </button>
              ) : null}
              <button type="button" onClick={() => handleDelete(p.product_id)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-700">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductForm({ user, product, onDone, onCancel }) {
  const isEdit = Boolean(product);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    model: product?.model ?? "",
    serial_number: product?.serial_number ?? "",
    description: product?.description ?? "",
    price: product?.price ?? "",
    warranty_status: product?.warranty_status ?? true,
    distributor: product?.distributor ?? "",
    stock_quantity: product?.stock_quantity ?? 0,
    image_url: product?.image_url ?? "",
    category: product?.category ?? "",
    category_id: product?.category_id ?? "",
    item_type: product?.item_type ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    http.get("/manager/categories", { params: { manager_user_id: user.user_id } })
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, [user.user_id]);

  function handleChange(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
    };
  }

  function handleCategoryChange(e) {
    const catId = e.target.value;
    const cat = categories.find((c) => String(c.category_id) === catId);
    setForm((prev) => ({
      ...prev,
      category_id: catId ? Number(catId) : "",
      category: cat ? cat.name : "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      category_id: form.category_id ? Number(form.category_id) : null,
    };
    try {
      if (isEdit) {
        await http.patch(`/manager/products/${product.product_id}`, payload, { params: { manager_user_id: user.user_id } });
      } else {
        await http.post("/manager/products", payload, { params: { manager_user_id: user.user_id } });
      }
      onDone();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save product.");
    } finally { setSaving(false); }
  }

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-300";
  const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500";

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-[1.5rem] border border-cyan-200 bg-cyan-50/30 p-5">
      <p className="text-sm font-semibold text-brand-ink">{isEdit ? "Edit product" : "Add new product"}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><label className={labelCls}>Name</label><input value={form.name} onChange={handleChange("name")} className={inputCls} required /></div>
        <div><label className={labelCls}>Model</label><input value={form.model} onChange={handleChange("model")} className={inputCls} /></div>
        <div><label className={labelCls}>Serial Number</label><input value={form.serial_number} onChange={handleChange("serial_number")} className={inputCls} /></div>
        <div><label className={labelCls}>Price</label><input type="number" step="0.01" value={form.price} onChange={handleChange("price")} className={inputCls} required /></div>
        <div><label className={labelCls}>Stock</label><input type="number" value={form.stock_quantity} onChange={handleChange("stock_quantity")} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Category</label>
          <select value={form.category_id} onChange={handleCategoryChange} className={inputCls}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.label} ({c.name})</option>
            ))}
          </select>
        </div>
        <div><label className={labelCls}>Item Type (subcategory)</label><input value={form.item_type} onChange={handleChange("item_type")} placeholder="e.g. cpu, gpu, ssd" className={inputCls} /></div>
        <div><label className={labelCls}>Distributor</label><input value={form.distributor} onChange={handleChange("distributor")} className={inputCls} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Image URL</label><input value={form.image_url} onChange={handleChange("image_url")} className={inputCls} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea value={form.description} onChange={handleChange("description")} rows={3} className={inputCls} /></div>
        <div><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.warranty_status} onChange={handleChange("warranty_status")} /> Warranty included</label></div>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50">{saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}</button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-500 hover:text-brand-ink">Cancel</button>
      </div>
    </form>
  );
}

// ── Categories Tab ──────────────────────────────────────────────────

function CategoriesTab({ user }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addForm, setAddForm] = useState({ name: "", label: "", slug: "", description: "", icon: "", is_visible_in_sidebar: true, is_visible_on_homepage: false, sort_order: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setIsLoading(true);
    try {
      const res = await http.get("/manager/categories", { params: { manager_user_id: user.user_id } });
      setCategories(res.data);
    } catch { setCategories([]); }
    finally { setIsLoading(false); }
  }

  function handleAddChange(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setAddForm((prev) => ({ ...prev, [field]: val }));
    };
  }

  function handleEditChange(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setEditForm((prev) => ({ ...prev, [field]: val }));
    };
  }

  function autoSlug(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    const slug = addForm.slug || autoSlug(addForm.label);
    try {
      await http.post("/manager/categories", { ...addForm, slug, sort_order: Number(addForm.sort_order) || 0 }, { params: { manager_user_id: user.user_id } });
      setAddForm({ name: "", label: "", slug: "", description: "", icon: "", is_visible_in_sidebar: true, is_visible_on_homepage: false, sort_order: 0 });
      loadCategories();
    } catch (err) { setError(err.response?.data?.detail || "Could not create category."); }
  }

  function startEdit(cat) {
    setEditingId(cat.category_id);
    setEditForm({ label: cat.label, slug: cat.slug, description: cat.description || "", icon: cat.icon || "", sort_order: cat.sort_order, is_visible_in_sidebar: cat.is_visible_in_sidebar, is_visible_on_homepage: cat.is_visible_on_homepage });
  }

  async function saveEdit(catId) {
    setError("");
    try {
      await http.patch(`/manager/categories/${catId}`, { ...editForm, sort_order: Number(editForm.sort_order) || 0 }, { params: { manager_user_id: user.user_id } });
      setEditingId(null);
      loadCategories();
    } catch (err) { setError(err.response?.data?.detail || "Could not update category."); }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/manager/categories/${id}`, { params: { manager_user_id: user.user_id } });
      if (expandedId === id) setExpandedId(null);
      if (editingId === id) setEditingId(null);
      loadCategories();
    } catch (err) { setError(err.response?.data?.detail || "Could not delete category."); }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  const inputCls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-300";
  const lblCls = "mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500";

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-6 rounded-[1.5rem] border border-cyan-200 bg-cyan-50/30 p-4">
        <p className="text-sm font-semibold text-brand-ink">Add new category</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div><label className={lblCls}>Name (key)</label><input value={addForm.name} onChange={handleAddChange("name")} placeholder="e.g. laptop" required className={inputCls + " w-full"} /></div>
          <div><label className={lblCls}>Label</label><input value={addForm.label} onChange={handleAddChange("label")} placeholder="e.g. Laptops" required className={inputCls + " w-full"} /></div>
          <div><label className={lblCls}>Slug</label><input value={addForm.slug} onChange={handleAddChange("slug")} placeholder="auto from label" className={inputCls + " w-full"} /></div>
          <div><label className={lblCls}>Icon</label><input value={addForm.icon} onChange={handleAddChange("icon")} placeholder="e.g. laptop" className={inputCls + " w-full"} /></div>
          <div><label className={lblCls}>Sort order</label><input type="number" value={addForm.sort_order} onChange={handleAddChange("sort_order")} className={inputCls + " w-full"} /></div>
          <div className="sm:col-span-2 lg:col-span-1"><label className={lblCls}>Description</label><input value={addForm.description} onChange={handleAddChange("description")} className={inputCls + " w-full"} /></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={addForm.is_visible_in_sidebar} onChange={handleAddChange("is_visible_in_sidebar")} /> Sidebar</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={addForm.is_visible_on_homepage} onChange={handleAddChange("is_visible_on_homepage")} /> Homepage</label>
          <button type="submit" className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-glow"><Plus className="h-4 w-4" /> Add category</button>
        </div>
      </form>

      {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.category_id} className="rounded-[1.5rem] border border-slate-200 bg-white/90 overflow-hidden">
            {editingId === c.category_id ? (
              <div className="p-4 space-y-3 bg-cyan-50/20">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div><label className={lblCls}>Label</label><input value={editForm.label} onChange={handleEditChange("label")} className={inputCls + " w-full"} /></div>
                  <div><label className={lblCls}>Slug</label><input value={editForm.slug} onChange={handleEditChange("slug")} className={inputCls + " w-full"} /></div>
                  <div><label className={lblCls}>Icon</label><input value={editForm.icon} onChange={handleEditChange("icon")} className={inputCls + " w-full"} /></div>
                  <div><label className={lblCls}>Sort order</label><input type="number" value={editForm.sort_order} onChange={handleEditChange("sort_order")} className={inputCls + " w-full"} /></div>
                  <div className="sm:col-span-2"><label className={lblCls}>Description</label><input value={editForm.description} onChange={handleEditChange("description")} className={inputCls + " w-full"} /></div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={editForm.is_visible_in_sidebar} onChange={handleEditChange("is_visible_in_sidebar")} /> Sidebar</label>
                  <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={editForm.is_visible_on_homepage} onChange={handleEditChange("is_visible_on_homepage")} /> Homepage</label>
                  <div className="ml-auto flex gap-2">
                    <button type="button" onClick={() => saveEdit(c.category_id)} className="rounded-xl bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-xs font-semibold text-slate-500 hover:text-brand-ink">Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-ink">{c.label}</span>
                    <span className="text-xs text-slate-400">({c.name})</span>
                    <span className="text-xs text-slate-400">/{c.slug}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${c.is_visible_in_sidebar ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-400"}`}>Sidebar {c.is_visible_in_sidebar ? "ON" : "OFF"}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${c.is_visible_on_homepage ? "border-cyan-200 bg-cyan-50 text-brand-accent" : "border-slate-200 bg-slate-50 text-slate-400"}`}>Homepage {c.is_visible_on_homepage ? "ON" : "OFF"}</span>
                    {c.icon ? <span className="text-xs text-slate-400">icon: {c.icon}</span> : null}
                    <span className="text-xs text-slate-400">order: {c.sort_order}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => setExpandedId(expandedId === c.category_id ? null : c.category_id)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:text-brand-ink">
                    <ChevronDown className={`h-3 w-3 transition ${expandedId === c.category_id ? "rotate-180" : ""}`} /> Filters
                  </button>
                  <button type="button" onClick={() => startEdit(c)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:text-brand-ink"><Edit className="h-3 w-3" /> Edit</button>
                  <button type="button" onClick={() => handleDelete(c.category_id)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-rose-200 hover:text-rose-700"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </div>
            )}

            {expandedId === c.category_id ? (
              <div className="border-t border-slate-200 bg-slate-50/50 p-4">
                <ItemTypeManager user={user} categoryId={c.category_id} categoryLabel={c.label} />
              </div>
            ) : null}
          </div>
        ))}
        {categories.length === 0 ? <p className="text-center text-sm text-slate-500">No categories yet.</p> : null}
      </div>
    </div>
  );
}

function ItemTypeManager({ user, categoryId, categoryLabel }) {
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addValue, setAddValue] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addSort, setAddSort] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");

  useEffect(() => { loadTypes(); }, [categoryId]);

  async function loadTypes() {
    setIsLoading(true);
    try {
      const res = await http.get(`/manager/item-types/${categoryId}`, { params: { manager_user_id: user.user_id } });
      setTypes(res.data);
    } catch { setTypes([]); }
    finally { setIsLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await http.post("/manager/item-types", { category_id: categoryId, value: addValue, label: addLabel, sort_order: Number(addSort) || 0 }, { params: { manager_user_id: user.user_id } });
      setAddValue(""); setAddLabel(""); setAddSort(0);
      loadTypes();
    } catch (err) { setError(err.response?.data?.detail || "Could not add item type."); }
  }

  function startEdit(t) {
    setEditingId(t.item_type_id);
    setEditForm({ value: t.value, label: t.label, sort_order: t.sort_order });
  }

  async function saveEdit(id) {
    setError("");
    try {
      await http.patch(`/manager/item-types/${id}`, { ...editForm, sort_order: Number(editForm.sort_order) || 0 }, { params: { manager_user_id: user.user_id } });
      setEditingId(null);
      loadTypes();
    } catch (err) { setError(err.response?.data?.detail || "Could not update item type."); }
  }

  async function handleDeleteType(id) {
    try {
      await http.delete(`/manager/item-types/${id}`, { params: { manager_user_id: user.user_id } });
      loadTypes();
    } catch (err) { setError(err.response?.data?.detail || "Could not delete item type."); }
  }

  const inputCls = "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-cyan-300";

  if (isLoading) return <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-brand-accent" />;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">Item type filters for {categoryLabel}</p>

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap items-end gap-2">
        <div><label className="mb-1 block text-xs text-slate-500">Value</label><input value={addValue} onChange={(e) => setAddValue(e.target.value)} placeholder="e.g. gpu" required className={inputCls} /></div>
        <div><label className="mb-1 block text-xs text-slate-500">Label</label><input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="e.g. Graphics Card" required className={inputCls} /></div>
        <div><label className="mb-1 block text-xs text-slate-500">Order</label><input type="number" value={addSort} onChange={(e) => setAddSort(e.target.value)} className={inputCls + " w-16"} /></div>
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-glow"><Plus className="h-3 w-3" /> Add</button>
      </form>

      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}

      {types.length > 0 ? (
        <div className="mt-3 space-y-2">
          {types.map((t) => (
            <div key={t.item_type_id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              {editingId === t.item_type_id ? (
                <>
                  <input value={editForm.value} onChange={(e) => setEditForm((p) => ({ ...p, value: e.target.value }))} className={inputCls + " w-24"} />
                  <input value={editForm.label} onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))} className={inputCls + " flex-1"} />
                  <input type="number" value={editForm.sort_order} onChange={(e) => setEditForm((p) => ({ ...p, sort_order: e.target.value }))} className={inputCls + " w-14"} />
                  <button type="button" onClick={() => saveEdit(t.item_type_id)} className="rounded-lg bg-brand-ink px-2 py-1 text-xs font-semibold text-white">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-xs text-slate-500">Cancel</button>
                </>
              ) : (
                <>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">{t.value}</span>
                  <span className="flex-1 text-sm font-semibold text-brand-ink">{t.label}</span>
                  <span className="text-xs text-slate-400">#{t.sort_order}</span>
                  <button type="button" onClick={() => startEdit(t)} className="text-xs font-semibold text-slate-500 hover:text-brand-ink">Edit</button>
                  <button type="button" onClick={() => handleDeleteType(t.item_type_id)} className="text-xs font-semibold text-slate-500 hover:text-rose-700">Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-500">No item type filters defined yet. Add one above.</p>
      )}
    </div>
  );
}

// ── Stock Tab ────────────────────────────────────────────────────────

function StockTab({ user }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingQty, setEditingQty] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const res = await http.get("/manager/products", { params: { manager_user_id: user.user_id, include_inactive: false } });
      setProducts(res.data);
    } catch { setProducts([]); }
    finally { setIsLoading(false); }
  }

  async function handleSaveStock(id) {
    const qty = Math.max(0, parseInt(editingQty, 10) || 0);
    try {
      await http.patch(`/manager/products/${id}/stock`, null, { params: { manager_user_id: user.user_id, quantity: qty } });
      setProducts((prev) => prev.map((p) => p.product_id === id ? { ...p, stock_quantity: qty } : p));
      setEditingId(null);
    } catch { /* silent */ }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div className="space-y-3">
      {products.map((p) => {
        const stock = p.stock_quantity ?? 0;
        const isLow = stock > 0 && stock <= 5;
        const isOut = stock <= 0;
        return (
          <div key={p.product_id} className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-ink">{p.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${isOut ? "border-rose-200 bg-rose-50 text-rose-700" : isLow ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                  {isOut ? "Out of stock" : `${stock} in stock`}
                </span>
                {isLow ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {editingId === p.product_id ? (
                <>
                  <input type="number" min="0" value={editingQty} onChange={(e) => setEditingQty(e.target.value)} className="w-20 rounded-xl border border-cyan-300 bg-white px-2 py-1.5 text-sm outline-none" />
                  <button type="button" onClick={() => handleSaveStock(p.product_id)} className="rounded-xl bg-brand-accent px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-glow">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:text-brand-ink">Cancel</button>
                </>
              ) : (
                <button type="button" onClick={() => { setEditingId(p.product_id); setEditingQty(String(stock)); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:text-brand-ink">
                  <Edit className="h-3 w-3" /> Update stock
                </button>
              )}
            </div>
          </div>
        );
      })}
      {products.length === 0 ? <p className="text-center text-sm text-slate-500">No active products.</p> : null}
    </div>
  );
}

// ── Invoices Tab ─────────────────────────────────────────────────────

function InvoicesTab({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    setIsLoading(true);
    try {
      const res = await http.get("/manager/invoices", { params: { manager_user_id: user.user_id } });
      setInvoices(res.data);
    } catch { setInvoices([]); }
    finally { setIsLoading(false); }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div className="space-y-3">
      {invoices.map((inv) => (
        <div key={inv.order_id} className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-ink">{inv.order_number}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(inv.created_at)} &middot; {inv.billing_name} &middot; {inv.billing_email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-brand-accent">{formatCurrency(inv.total)}</span>
              <button type="button" onClick={() => setExpandedId(expandedId === inv.order_id ? null : inv.order_id)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline">
                <ChevronDown className={`h-3 w-3 transition ${expandedId === inv.order_id ? "rotate-180" : ""}`} /> Details
              </button>
            </div>
          </div>
          {expandedId === inv.order_id ? (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">Address: {inv.billing_address}</p>
              <p className="text-xs text-slate-500">Payment: {inv.payment_brand} ****{inv.payment_last4}</p>
              <p className="text-xs text-slate-500">Subtotal: {formatCurrency(inv.subtotal)} &middot; Shipping: {formatCurrency(inv.shipping)} &middot; Tax: {formatCurrency(inv.tax)}</p>
              <div className="mt-2 space-y-1">
                {inv.items.map((item) => (
                  <div key={item.order_item_id} className="flex items-center justify-between text-xs text-slate-600">
                    <span>{item.product_name} &times; {item.quantity}</span>
                    <span>{formatCurrency(item.line_total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
      {invoices.length === 0 ? <p className="text-center text-sm text-slate-500">No invoices yet.</p> : null}
    </div>
  );
}

// ── Deliveries Tab ───────────────────────────────────────────────────

function DeliveriesTab({ user }) {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => { loadDeliveries(); }, [showCompleted]);

  async function loadDeliveries() {
    setIsLoading(true);
    try {
      const res = await http.get("/manager/deliveries", { params: { manager_user_id: user.user_id, show_completed: showCompleted } });
      setDeliveries(res.data);
    } catch { setDeliveries([]); }
    finally { setIsLoading(false); }
  }

  async function handleComplete(id) {
    try {
      await http.patch(`/manager/deliveries/${id}/complete`, null, { params: { manager_user_id: user.user_id } });
      setDeliveries((prev) => prev.filter((d) => d.delivery_id !== id));
    } catch { /* silent */ }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div>
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
          Show completed deliveries
        </label>
      </div>
      <div className="space-y-3">
        {deliveries.map((d) => (
          <div key={d.delivery_id} className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-ink">Delivery #{d.delivery_id}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${d.is_completed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                  {d.is_completed ? "Completed" : "Pending"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Order: {d.order_number || "N/A"} &middot; Customer: {d.customer_name || "Guest"} &middot; {formatCurrency(d.total_price)}</p>
              <p className="mt-1 text-xs text-slate-400">{d.delivery_address}</p>
            </div>
            {!d.is_completed ? (
              <button type="button" onClick={() => handleComplete(d.delivery_id)} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                <CheckCircle2 className="h-4 w-4" /> Mark completed
              </button>
            ) : null}
          </div>
        ))}
        {deliveries.length === 0 ? <p className="text-center text-sm text-slate-500">{showCompleted ? "No deliveries found." : "No pending deliveries."}</p> : null}
      </div>
    </div>
  );
}

// ── Comments Tab (reuses existing review moderation API) ────────────

function CommentsTab({ user }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => { loadPending(); }, []);

  async function loadPending() {
    setIsLoading(true);
    try {
      const res = await http.get("/reviews/pending", { params: { manager_user_id: user.user_id } });
      setReviews(res.data);
    } catch { setReviews([]); }
    finally { setIsLoading(false); }
  }

  async function handleAction(reviewId, newStatus) {
    setActionId(reviewId);
    try {
      await http.patch(`/reviews/${reviewId}/status`, { status: newStatus }, { params: { manager_user_id: user.user_id } });
      setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
    } catch { /* silent */ }
    finally { setActionId(null); }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  if (reviews.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/88 px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-3 text-lg font-semibold text-brand-ink">All caught up.</p>
        <p className="mt-1 text-sm text-slate-500">No pending reviews to moderate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.review_id} className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((v) => <Star key={v} className={`h-3.5 w-3.5 ${v <= r.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />)}
                </div>
                <span className="text-sm font-semibold text-brand-ink">{r.user_name || "Anonymous"}</span>
                <Link to={`/products/${r.product_id}`} className="text-xs font-semibold text-brand-accent hover:underline">Product #{r.product_id}</Link>
              </div>
              <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" disabled={actionId === r.review_id} onClick={() => handleAction(r.review_id, "approved")} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"><CheckCircle2 className="h-3 w-3" /> Approve</button>
              <button type="button" disabled={actionId === r.review_id} onClick={() => handleAction(r.review_id, "rejected")} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"><XCircle className="h-3 w-3" /> Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
