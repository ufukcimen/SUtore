import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Download,
  Edit,
  LoaderCircle,
  Percent,
  ReceiptText,
  RotateCcw,
  Save,
  ShieldAlert,
  Tags,
  XCircle,
} from "lucide-react";
import { StorefrontPageShell } from "../../cart/components/StorefrontPageShell";
import { downloadResponseBlob } from "../../../lib/downloads";
import { http } from "../../../lib/http";
import { useStoredUser } from "../../../lib/useStoredUser";

function formatCurrency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function dateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg).filter(Boolean).join(" ");
  return fallback;
}

function isAdminUser(user) {
  return user?.role === "sales_manager" || user?.role === "admin";
}

async function downloadInvoicePdf(user, invoice) {
  const response = await http.get(`/admin/invoices/${invoice.order_id}/pdf`, {
    params: { admin_user_id: user.user_id },
    responseType: "blob",
  });
  downloadResponseBlob(response, `invoice-${invoice.order_number}.pdf`);
}

async function downloadInvoiceRangePdf(user, startDate, endDate) {
  const response = await http.get("/admin/invoices/pdf", {
    params: {
      admin_user_id: user.user_id,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
    responseType: "blob",
  });
  downloadResponseBlob(response, "invoices.pdf");
}

const TABS = [
  { id: "pricing", label: "Pricing", Icon: DollarSign },
  { id: "discounts", label: "Discounts", Icon: Percent },
  { id: "invoices", label: "Invoices", Icon: ReceiptText },
  { id: "analytics", label: "Revenue", Icon: BarChart3 },
  { id: "refunds", label: "Refunds", Icon: RotateCcw },
];

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = useStoredUser();
  const [activeTab, setActiveTab] = useState("pricing");

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: "/admin/dashboard" }, replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  if (!isAdminUser(user)) {
    return (
      <StorefrontPageShell currentStep="" description="" eyebrow="Access denied" title="This area is for sales administrators.">
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900">
          <ShieldAlert className="mx-auto h-8 w-8" />
          <p className="mt-4 text-lg font-semibold">Insufficient permissions</p>
          <Link to="/" className="mt-6 inline-flex items-center rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow">Back to store</Link>
        </section>
      </StorefrontPageShell>
    );
  }

  return (
    <StorefrontPageShell currentStep="" description="Manage pricing, discount campaigns, invoices, revenue, and refunds." eyebrow="Admin" title="Sales Admin Dashboard">
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
        {activeTab === "pricing" ? <PricingTab user={user} /> : null}
        {activeTab === "discounts" ? <DiscountsTab user={user} /> : null}
        {activeTab === "invoices" ? <InvoicesTab user={user} /> : null}
        {activeTab === "analytics" ? <AnalyticsTab user={user} /> : null}
        {activeTab === "refunds" ? <RefundsTab user={user} /> : null}
      </div>
    </StorefrontPageShell>
  );
}

function PricingTab({ user }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingPrice, setEditingPrice] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setIsLoading(true);
    setError("");
    try {
      const res = await http.get("/admin/products", { params: { admin_user_id: user.user_id } });
      setProducts(res.data);
    } catch (err) {
      setProducts([]);
      setError(getErrorMessage(err, "Could not load products."));
    } finally {
      setIsLoading(false);
    }
  }

  async function savePrice(productId) {
    setSavingId(productId);
    setError("");
    try {
      const res = await http.patch(
        `/admin/products/${productId}/price`,
        { price: Number(editingPrice) || 0 },
        { params: { admin_user_id: user.user_id } },
      );
      setProducts((prev) => prev.map((product) => (
        product.product_id === productId ? res.data : product
      )));
      setEditingId(null);
      setEditingPrice("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update price."));
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-600">{products.length} products available for pricing</p>
        <button type="button" onClick={loadProducts} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-brand-ink">
          <RotateCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.product_id} className={`flex flex-col gap-3 rounded-[1.5rem] border p-4 sm:flex-row sm:items-center sm:justify-between ${product.is_active ? "border-slate-200 bg-white/90" : "border-slate-200/50 bg-slate-50/50 opacity-60"}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-brand-ink">{product.name || "Unnamed product"}</span>
                {!product.is_active ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Inactive</span> : null}
              </div>
              <p className="mt-1 text-xs text-slate-500">ID: {product.product_id} &middot; {product.category || "Uncategorized"} &middot; Stock: {product.stock_quantity ?? 0}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {editingId === product.product_id ? (
                <>
                  <input type="number" min="0" step="0.01" value={editingPrice} onChange={(e) => setEditingPrice(e.target.value)} className="w-28 rounded-xl border border-cyan-300 bg-white px-3 py-2 text-sm outline-none" />
                  <button type="button" disabled={savingId === product.product_id} onClick={() => savePrice(product.product_id)} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50">
                    <Save className="h-3 w-3" /> Save
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-xs font-semibold text-slate-500 hover:text-brand-ink">Cancel</button>
                </>
              ) : (
                <>
                  <span className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-brand-accent">{formatCurrency(product.price)}</span>
                  <button type="button" onClick={() => { setEditingId(product.product_id); setEditingPrice(product.price ?? "0"); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-brand-ink">
                    <Edit className="h-3 w-3" /> Edit price
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscountsTab({ user }) {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [discountRate, setDiscountRate] = useState(10);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const res = await http.get("/admin/products", {
        params: { admin_user_id: user.user_id, include_inactive: false },
      });
      setProducts(res.data);
    } catch (err) {
      setProducts([]);
      setError(getErrorMessage(err, "Could not load products."));
    } finally {
      setIsLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => (
      `${product.name || ""} ${product.category || ""} ${product.model || ""}`.toLowerCase().includes(normalized)
    ));
  }, [products, query]);

  function toggleProduct(productId) {
    setSelectedIds((prev) => (
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    ));
  }

  async function applyDiscount(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (selectedIds.length === 0) {
      setError("Select at least one product.");
      return;
    }

    setIsApplying(true);
    try {
      const res = await http.post(
        "/admin/discounts",
        { product_ids: selectedIds, discount_rate: Number(discountRate) || 0 },
        { params: { admin_user_id: user.user_id } },
      );
      setResult(res.data);
      const priceById = new Map(res.data.products.map((product) => [product.product_id, product.new_price]));
      setProducts((prev) => prev.map((product) => (
        priceById.has(product.product_id) ? { ...product, price: priceById.get(product.product_id) } : product
      )));
      setSelectedIds([]);
    } catch (err) {
      setError(getErrorMessage(err, "Could not apply discount."));
    } finally {
      setIsApplying(false);
    }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div>
      <form onSubmit={applyDiscount} className="mb-6 rounded-[1.5rem] border border-cyan-200 bg-cyan-50/30 p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem_auto] lg:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Find products</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-300" placeholder="Search name, model, or category" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Discount</label>
            <input type="number" min="1" max="99" step="0.01" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-300" />
          </div>
          <button type="submit" disabled={isApplying || selectedIds.length === 0} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow disabled:opacity-50">
            <Tags className="h-4 w-4" /> Apply to {selectedIds.length}
          </button>
        </div>
      </form>

      {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      {result ? (
        <div className="mb-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-semibold">{result.products.length} products discounted. {result.notified_users_count} wishlist users matched.</p>
              {result.notified_emails.length > 0 ? <p className="mt-1 text-xs">{result.notified_emails.join(", ")}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {filteredProducts.map((product) => {
          const checked = selectedIds.includes(product.product_id);
          return (
            <label key={product.product_id} className={`flex cursor-pointer flex-col gap-3 rounded-[1.5rem] border p-4 transition sm:flex-row sm:items-center sm:justify-between ${checked ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white/90 hover:border-cyan-200"}`}>
              <div className="flex min-w-0 items-start gap-3">
                <input type="checkbox" checked={checked} onChange={() => toggleProduct(product.product_id)} className="mt-1 h-4 w-4" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-ink">{product.name || "Unnamed product"}</p>
                  <p className="mt-1 text-xs text-slate-500">ID: {product.product_id} &middot; {product.category || "Uncategorized"}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-brand-ink">{formatCurrency(product.price)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function DateRangeControls({ endDate, onEndDateChange, onLoad, onStartDateChange, startDate }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Start date</label>
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-300" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">End date</label>
        <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-300" />
      </div>
      <button type="button" onClick={onLoad} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900">
        <CalendarDays className="h-4 w-4" /> Load
      </button>
    </div>
  );
}

function InvoicesTab({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [startDate, setStartDate] = useState(dateInputValue(-30));
  const [endDate, setEndDate] = useState(dateInputValue());
  const [error, setError] = useState("");
  const [isDownloadingRange, setIsDownloadingRange] = useState(false);
  const [isDownloadingSeparate, setIsDownloadingSeparate] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    setIsLoading(true);
    setError("");
    try {
      const res = await http.get("/admin/invoices", {
        params: { admin_user_id: user.user_id, start_date: startDate || undefined, end_date: endDate || undefined },
      });
      const nextInvoices = Array.isArray(res.data) ? res.data : [];
      setInvoices(nextInvoices);
    } catch (err) {
      setInvoices([]);
      setError(getErrorMessage(err, "Could not load invoices."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadRange() {
    setIsDownloadingRange(true);
    setError("");
    try {
      await downloadInvoiceRangePdf(user, startDate, endDate);
    } catch (err) {
      setError(getErrorMessage(err, "Could not download the invoice range PDF."));
    } finally {
      setIsDownloadingRange(false);
    }
  }

  async function handleDownloadSeparate() {
    setIsDownloadingSeparate(true);
    setError("");
    try {
      for (const invoice of invoices) {
        await downloadInvoicePdf(user, invoice);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not download all invoice PDFs."));
    } finally {
      setIsDownloadingSeparate(false);
    }
  }

  async function handleDownloadInvoice(invoice) {
    setDownloadingInvoiceId(invoice.order_id);
    setError("");
    try {
      await downloadInvoicePdf(user, invoice);
    } catch (err) {
      setError(getErrorMessage(err, "Could not download this invoice PDF."));
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div>
      <DateRangeControls startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onLoad={loadInvoices} />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-600">{invoices.length} invoices in range</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" disabled={invoices.length === 0 || isDownloadingRange} onClick={handleDownloadRange} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-brand-ink disabled:opacity-50">
            <Download className="h-4 w-4" /> {isDownloadingRange ? "Preparing..." : "Download range PDF"}
          </button>
          <button type="button" disabled={invoices.length === 0 || isDownloadingSeparate} onClick={handleDownloadSeparate} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-brand-ink disabled:opacity-50">
            <Download className="h-4 w-4" /> {isDownloadingSeparate ? "Downloading..." : "Download separate PDFs"}
          </button>
        </div>
      </div>

      {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice.order_id} className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-ink">{invoice.order_number}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(invoice.created_at)} &middot; {invoice.billing_name} &middot; {invoice.billing_email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-brand-accent">{formatCurrency(invoice.total)}</span>
                <button type="button" onClick={() => setExpandedId(expandedId === invoice.order_id ? null : invoice.order_id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:text-brand-ink">Details</button>
                <button type="button" disabled={downloadingInvoiceId === invoice.order_id} onClick={() => handleDownloadInvoice(invoice)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:text-brand-ink disabled:opacity-50">
                  <Download className="h-3 w-3" /> {downloadingInvoiceId === invoice.order_id ? "Downloading..." : "PDF"}
                </button>
              </div>
            </div>
            {expandedId === invoice.order_id ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <p>Address: {invoice.billing_address}</p>
                  <p>Payment: {invoice.payment_brand} ****{invoice.payment_last4}</p>
                  <p>Status: {invoice.status}</p>
                  <p>Subtotal: {formatCurrency(invoice.subtotal)} &middot; Tax: {formatCurrency(invoice.tax)}</p>
                </div>
                <div className="mt-3 space-y-1">
                  {invoice.items.map((item) => (
                    <div key={item.order_item_id} className="flex items-center justify-between gap-3 text-xs text-slate-600">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span>{formatCurrency(item.line_total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
        {invoices.length === 0 ? <p className="text-center text-sm text-slate-500">No invoices in this date range.</p> : null}
      </div>
    </div>
  );
}

function AnalyticsTab({ user }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(dateInputValue(-30));
  const [endDate, setEndDate] = useState(dateInputValue());
  const [costRate, setCostRate] = useState("0.70");
  const [error, setError] = useState("");

  useEffect(() => { loadSummary(); }, []);

  async function loadSummary() {
    setIsLoading(true);
    setError("");
    try {
      const res = await http.get("/admin/analytics", {
        params: {
          admin_user_id: user.user_id,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          cost_rate: Number(costRate) || 0,
        },
      });
      setSummary(res.data);
    } catch (err) {
      setSummary(null);
      setError(getErrorMessage(err, "Could not load revenue summary."));
    } finally {
      setIsLoading(false);
    }
  }

  const maxValue = useMemo(() => {
    if (!summary?.daily?.length) return 1;
    return Math.max(
      1,
      ...summary.daily.flatMap((day) => [
        Math.abs(Number(day.revenue) || 0),
        Math.abs(Number(day.refunded_loss) || 0),
        Math.abs(Number(day.estimated_profit) || 0),
      ]),
    );
  }, [summary]);

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div>
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1fr_10rem_auto] lg:items-end">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">End date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cost rate</label>
          <input type="number" min="0" max="1" step="0.01" value={costRate} onChange={(e) => setCostRate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-300" />
        </div>
        <button type="button" onClick={loadSummary} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900">
          <BarChart3 className="h-4 w-4" /> Calculate
        </button>
      </div>

      {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      {summary ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Revenue" value={formatCurrency(summary.revenue)} tone="cyan" />
            <Metric label="Net revenue" value={formatCurrency(summary.net_revenue)} tone="emerald" />
            <Metric label="Refund loss" value={formatCurrency(summary.refunded_loss)} tone="rose" />
            <Metric label="Estimated profit" value={formatCurrency(summary.estimated_profit)} tone={Number(summary.estimated_profit) >= 0 ? "emerald" : "rose"} />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Revenue</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Profit</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Refund loss</span>
            </div>
            <div className="space-y-3">
              {summary.daily.map((day) => {
                const revenueWidth = `${Math.max(4, (Math.abs(Number(day.revenue) || 0) / maxValue) * 100)}%`;
                const profit = Number(day.estimated_profit) || 0;
                const profitWidth = `${Math.max(4, (Math.abs(profit) / maxValue) * 100)}%`;
                const lossWidth = `${Math.max(4, (Math.abs(Number(day.refunded_loss) || 0) / maxValue) * 100)}%`;
                return (
                  <div key={day.day} className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 lg:grid-cols-[9rem_1fr] lg:items-center">
                    <div>
                      <p className="text-xs font-semibold text-brand-ink">{day.day}</p>
                      <p className="mt-1 text-xs text-slate-500">{day.order_count} orders</p>
                    </div>
                    <div className="grid gap-1.5">
                      <div className="h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-cyan-400" style={{ width: revenueWidth }} /></div>
                      <div className="h-3 rounded-full bg-slate-200"><div className={`h-3 rounded-full ${profit >= 0 ? "bg-emerald-400" : "bg-rose-400"}`} style={{ width: profitWidth }} /></div>
                      <div className="h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-rose-400" style={{ width: lossWidth }} /></div>
                    </div>
                  </div>
                );
              })}
              {summary.daily.length === 0 ? <p className="text-center text-sm text-slate-500">No financial activity in this date range.</p> : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, tone, value }) {
  const toneMap = {
    cyan: "border-cyan-200 bg-cyan-50 text-brand-accent",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 ${toneMap[tone] || toneMap.cyan}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function RefundsTab({ user }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { loadRefunds(); }, [includeResolved]);

  async function loadRefunds() {
    setIsLoading(true);
    setError("");
    try {
      const res = await http.get("/admin/refunds", {
        params: { admin_user_id: user.user_id, include_resolved: includeResolved },
      });
      setOrders(res.data);
    } catch (err) {
      setOrders([]);
      setError(getErrorMessage(err, "Could not load refund requests."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefund(orderId, action) {
    setActionId(orderId);
    setError("");
    try {
      const res = await http.patch(`/admin/refunds/${orderId}/${action}`, null, {
        params: { admin_user_id: user.user_id },
      });
      setOrders((prev) => (
        includeResolved
          ? prev.map((order) => (order.order_id === orderId ? res.data : order))
          : prev.filter((order) => order.order_id !== orderId)
      ));
    } catch (err) {
      setError(getErrorMessage(err, "Could not update refund request."));
    } finally {
      setActionId(null);
    }
  }

  if (isLoading) return <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-brand-accent" />;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" checked={includeResolved} onChange={(e) => setIncludeResolved(e.target.checked)} />
          Include resolved refunds
        </label>
        <button type="button" onClick={loadRefunds} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-brand-ink">
          <RotateCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <div className="space-y-3">
        {orders.map((order) => {
          const pending = order.status === "refund_requested";
          return (
            <div key={order.order_id} className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-brand-ink">{order.order_number}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${pending ? "border-amber-200 bg-amber-50 text-amber-700" : order.status === "refunded" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(order.created_at)} &middot; {order.billing_name} &middot; {formatCurrency(order.total)}</p>
                  <div className="mt-3 space-y-1">
                    {order.items.map((item) => (
                      <p key={item.order_item_id} className="text-xs text-slate-500">{item.product_name} x {item.quantity}</p>
                    ))}
                  </div>
                </div>
                {pending ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" disabled={actionId === order.order_id} onClick={() => handleRefund(order.order_id, "approve")} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </button>
                    <button type="button" disabled={actionId === order.order_id} onClick={() => handleRefund(order.order_id, "reject")} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                      <XCircle className="h-3 w-3" /> Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {orders.length === 0 ? <p className="text-center text-sm text-slate-500">No refund requests found.</p> : null}
      </div>
    </div>
  );
}
