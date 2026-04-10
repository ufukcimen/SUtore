export function CartItemCountBadge({ count, className = "" }) {
  if (!count) {
    return null;
  }

  return (
    <span
      className={`inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 py-0.5 text-[11px] font-bold leading-none text-slate-950 shadow-[0_8px_20px_rgba(34,211,238,0.3)] ${className}`}
    >
      {count}
    </span>
  );
}
