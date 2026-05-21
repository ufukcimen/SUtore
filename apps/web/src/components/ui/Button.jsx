export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 hover:brightness-110 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

