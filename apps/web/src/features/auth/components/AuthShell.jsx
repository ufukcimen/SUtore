import { ArrowLeft, Cpu, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { authHighlights, trustedBrands } from "../data/authContent";

const iconMap = [ShieldCheck, Cpu, Truck];

export function AuthShell({ eyebrow, title, description, children, alternateLink }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f7fbff_0%,#ecfeff_45%,#fff8eb_100%)] text-slate-950">
      <div className="absolute inset-0 bg-grid bg-[size:28px_28px] opacity-40" />
      <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-brand-glow/30 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-gold/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-8">
        <section className="flex flex-1 flex-col justify-between rounded-[1.5rem] bg-brand-panel px-5 py-7 text-white shadow-float sm:rounded-[2rem] sm:px-8 lg:min-h-[720px] lg:px-10 lg:py-10">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-brand-glow/80 sm:text-sm sm:tracking-[0.35em]">
                  SUtore
                </p>
                <div className="mt-5">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-white/10 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to store
                  </Link>
                </div>
                <h1 className="mt-3 max-w-md text-3xl font-semibold leading-tight sm:text-5xl">
                  Trusted tech shopping for parts, performance, and fast delivery.
                </h1>
              </div>
              <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right backdrop-blur sm:block">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-glow/70">
                  Customer Access
                </p>
                <p className="mt-2 text-lg font-semibold">Accounts & Orders</p>
              </div>
            </div>

            <p className="max-w-xl text-base leading-7 text-slate-300">
              Sign in or create an account to manage orders, saved products, delivery
              details, and checkout information with confidence.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {authHighlights.map((item, index) => {
                const Icon = iconMap[index];

                return (
                  <article
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                  >
                    <Icon className="h-5 w-5 text-brand-glow" />
                    <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Trusted ecosystem
            </p>
            <div className="flex flex-wrap gap-3">
              {trustedBrands.map((brand) => (
                <span
                  key={brand}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center py-8 lg:py-0">
          <div className="w-full max-w-xl rounded-[1.5rem] border border-white/60 bg-white/80 p-5 shadow-float backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
            <div className="mb-8 space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-brand-accent sm:text-sm sm:tracking-[0.35em]">
                {eyebrow}
              </p>
              <h2 className="text-2xl font-semibold text-brand-ink sm:text-4xl">
                {title}
              </h2>
              <p className="max-w-lg text-sm leading-6 text-slate-600">{description}</p>
            </div>

            {children}
            <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">
              {alternateLink}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
