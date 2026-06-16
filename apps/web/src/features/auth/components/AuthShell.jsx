import { ArrowLeft, Cpu, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { authHighlights, trustedBrands } from "../data/authContent";

const iconMap = [ShieldCheck, Cpu, Truck];

export function AuthShell({ eyebrow, title, description, children, alternateLink }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef7f8_48%,#f8fafc_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[90rem] flex-col px-4 py-5 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(28rem,36rem)] lg:items-stretch lg:gap-8 lg:px-8">
        <section className="relative order-2 flex min-h-[24rem] flex-1 overflow-hidden rounded-lg border border-slate-900 bg-[#07111f] px-5 py-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.2)] sm:min-h-[32rem] sm:px-8 sm:py-8 lg:order-none lg:min-h-[44rem] lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.96)_52%,rgba(20,83,45,0.76)_100%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative flex w-full flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <Link to="/" className="inline-flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-cyan-400 text-sm font-black text-slate-950">
                      SU
                    </span>
                    <span>
                      <span className="block text-xl font-semibold text-white">SUtore</span>
                      <span className="block text-xs font-medium text-slate-400">
                        Performance PC Retail
                      </span>
                    </span>
                  </Link>
                  <div className="mt-6">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:bg-white/10 hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to store
                    </Link>
                  </div>
                  <h1 className="mt-8 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                    Secure access for parts, performance, and fast delivery.
                  </h1>
                </div>
                <div className="hidden rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3 text-right sm:block">
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">
                    Customer Access
                  </p>
                  <p className="mt-2 text-lg font-semibold">Accounts & Orders</p>
                </div>
              </div>

              <p className="max-w-xl text-base leading-7 text-slate-300">
                Sign in or create an account to track orders, keep a compare-ready
                shortlist, and return to checkout with fewer steps.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {authHighlights.map((item, index) => {
                  const Icon = iconMap[index];

                  return (
                    <article
                      key={item.title}
                      className="rounded-lg border border-white/10 bg-white/[0.08] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    >
                      <Icon className="h-5 w-5 text-cyan-300" />
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
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Trusted ecosystem
              </p>
              <div className="flex flex-wrap gap-3">
                {trustedBrands.map((brand) => (
                  <span
                    key={brand}
                    className="rounded-md border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-200"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 flex flex-1 items-center justify-center py-4 lg:order-none lg:py-0">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-8">
            <div className="mb-8 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                {eyebrow}
              </p>
              <h2 className="text-2xl font-semibold text-slate-950 sm:text-4xl">
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
