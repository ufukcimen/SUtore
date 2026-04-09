import { Search } from "lucide-react";

export function StorefrontSearchForm({
  value,
  onChange,
  onSubmit,
  onFocus,
  onKeyDown,
  placeholder = "Search products...",
  className = "",
  variant = "dark",
}) {
  const labelClassName =
    variant === "light"
      ? "flex h-14 items-center gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 text-slate-700 shadow-sm"
      : "flex h-14 items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 text-slate-300 shadow-lg shadow-cyan-950/20";

  const inputClassName =
    variant === "light"
      ? "h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
      : "h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-500";

  return (
    <form onSubmit={onSubmit} className={className}>
      <label className={labelClassName}>
        <Search className="h-5 w-5 text-cyan-200" />
        <input
          type="search"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={inputClassName}
          autoComplete="off"
        />
      </label>
    </form>
  );
}
