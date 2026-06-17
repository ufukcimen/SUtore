import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, PackageSearch, ShieldCheck, Truck } from "lucide-react";
import {
  formatPrice,
  getDiscount,
  getEffectivePrice,
  getOriginalPrice,
  getStockLabel,
  getStockTone,
} from "../utils/productPresentation";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
  compact = false,
  className = "",
}) {
  const paddingClassName = compact ? "p-4 sm:p-5" : "p-5 sm:p-6";
  const titleClassName = compact
    ? "mt-2 max-w-4xl text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl"
    : "mt-2 max-w-4xl text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl lg:text-4xl";
  const descriptionClassName = compact
    ? "mt-2 max-w-3xl text-sm leading-6 text-slate-600"
    : "mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base";

  return (
    <header className={`rounded-lg border border-slate-200 bg-white shadow-sm ${paddingClassName} ${className}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
              {Icon ? <Icon className="h-4 w-4" /> : null}
              {eyebrow}
            </div>
          ) : null}
          <h1 className={titleClassName}>
            {title}
          </h1>
          {description ? (
            <p className={descriptionClassName}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}

export function SectionHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function ProductImageFrame({
  src,
  alt,
  className = "",
  imageClassName = "",
  loading = "lazy",
}) {
  const imageRef = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(false);
  }, [src]);

  useEffect(() => {
    const image = imageRef.current;

    if (!src || !image || !image.complete) {
      return;
    }

    if (image.naturalWidth > 0) {
      setImageLoaded(true);
    } else {
      setImageFailed(true);
    }
  }, [src]);

  return (
    <div className={`product-image-frame relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      {src && !imageFailed ? (
        <>
          {!imageLoaded ? (
            <div
              className="absolute inset-4 animate-pulse rounded-md bg-slate-100"
              aria-hidden="true"
            />
          ) : null}
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            loading={loading}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            className={`relative max-h-full max-w-full object-contain drop-shadow-[0_12px_18px_rgba(15,23,42,0.08)] transition-opacity duration-200 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            } ${imageClassName}`}
          />
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
          <PackageSearch className="h-7 w-7 text-slate-400" />
          Image unavailable
        </div>
      )}
    </div>
  );
}

export function PriceBlock({ product, size = "md", align = "left" }) {
  const discount = getDiscount(product);
  const hasDiscount = discount > 0;
  const originalPrice = getOriginalPrice(product);
  const effectivePrice = getEffectivePrice(product);
  const priceSize = size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl";
  const alignClassName = align === "right" ? "text-right" : "text-left";

  return (
    <div className={alignClassName}>
      {hasDiscount ? (
        <p className="text-sm text-slate-400 line-through">{formatPrice(originalPrice)}</p>
      ) : null}
      <p className={`${priceSize} font-bold tracking-tight text-slate-950`}>
        {formatPrice(effectivePrice)}
      </p>
      {hasDiscount ? (
        <p className="mt-1 text-xs font-semibold text-rose-700">{discount}% off</p>
      ) : null}
    </div>
  );
}

export function StockBadge({ product, className = "" }) {
  const tone = getStockTone(product);
  const toneClassName =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const dotClassName =
    tone === "danger"
      ? "bg-rose-500"
      : tone === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${toneClassName} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />
      {getStockLabel(product)}
    </span>
  );
}

export function TrustBadge({ icon: Icon = ShieldCheck, label, detail, tone = "cyan" }) {
  const toneClassName =
    tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-cyan-50 text-cyan-700";

  return (
    <div className="flex h-full items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${toneClassName}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{label}</p>
        {detail ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{detail}</p> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = PackageSearch,
  eyebrow,
  title,
  description,
  action,
  tone = "neutral",
}) {
  const IconComponent = tone === "warning" ? AlertTriangle : tone === "success" ? CheckCircle2 : Icon;

  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <IconComponent className="h-6 w-6" />
      </div>
      {eyebrow ? (
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}

export function StickySummary({ children, className = "" }) {
  return (
    <aside className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 ${className}`}>
      {children}
    </aside>
  );
}

export { Truck };
