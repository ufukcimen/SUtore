import { Search } from "lucide-react";

function shouldDismissMobileFocus() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(max-width: 767px)").matches;
}

export function StorefrontSearchForm({
  value,
  onChange,
  onSubmit,
  onFocus,
  onKeyDown,
  inputRef,
  inputProps,
  placeholder = "Search products...",
  className = "",
  variant = "dark",
}) {
  const labelClassName =
    variant === "light"
      ? "flex h-12 min-w-0 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-slate-700 shadow-sm transition focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100"
      : "flex h-12 min-w-0 items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 text-slate-200 shadow-sm transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/10";

  const inputClassName =
    variant === "light"
      ? "h-full min-w-0 w-full bg-transparent text-base outline-none placeholder:text-slate-400 sm:text-sm"
      : "h-full min-w-0 w-full bg-transparent text-base outline-none placeholder:text-slate-500 sm:text-sm";

  function handleSubmit(event) {
    onSubmit(event);

    if (!shouldDismissMobileFocus()) {
      return;
    }

    const searchInput = inputRef?.current ?? event.currentTarget.querySelector("input[type='search']");
    searchInput?.blur();
  }

  return (
    <form onSubmit={handleSubmit} className={`min-w-0 ${className}`}>
      <label className={labelClassName}>
        <Search className={`h-5 w-5 shrink-0 ${variant === "light" ? "text-cyan-700" : "text-cyan-300"}`} />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={inputClassName}
          autoComplete="off"
          {...inputProps}
        />
      </label>
    </form>
  );
}
