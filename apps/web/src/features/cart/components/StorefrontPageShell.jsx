import { StorefrontShell } from "../../storefront/components/StorefrontShell";

export function StorefrontPageShell({
  children,
  contextLabel,
  description,
  eyebrow,
  title,
}) {
  return (
    <StorefrontShell
      headerClassName="checkout-shell-header"
      mainClassName="max-w-7xl"
      rootClassName="storefront-page-shell"
    >
      <section className="checkout-shell-intro rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {eyebrow || contextLabel ? (
          <div className="flex flex-wrap items-center gap-2">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                {eyebrow}
              </p>
            ) : null}
            {contextLabel ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {contextLabel}
              </span>
            ) : null}
          </div>
        ) : null}
        <h1 className="mt-2 max-w-4xl text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </section>

      <div className="mt-5">{children}</div>
    </StorefrontShell>
  );
}
