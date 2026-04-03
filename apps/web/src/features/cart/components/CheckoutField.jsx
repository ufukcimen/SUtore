export function CheckoutField({
  as = "input",
  children,
  className = "",
  error,
  hint,
  id,
  label,
  ...props
}) {
  const Component = as;
  const fieldClassName = `w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-brand-glow/20 ${
    error
      ? "border-rose-300 focus:border-rose-400"
      : "border-slate-200 focus:border-brand-accent"
  } ${className}`;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-ink">{label}</span>
      <Component id={id} className={fieldClassName} {...props}>
        {children}
      </Component>
      {error ? (
        <span className="mt-2 block text-xs font-medium text-rose-700">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}
