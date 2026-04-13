import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { useCategories } from "../context/CategoriesContext";
import { resolveIcon } from "../data/iconMap";
import { CategoryProductsPage } from "../components/CategoryProductsPage";
import { StorefrontShell } from "../components/StorefrontShell";

export function DynamicCategoryPage() {
  const { slug } = useParams();
  const { categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <StorefrontShell>
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 px-6 py-12 text-center shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-brand-accent">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>
          <p className="mt-4 text-lg font-semibold text-brand-ink">Loading category...</p>
        </div>
      </StorefrontShell>
    );
  }

  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <StorefrontShell>
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-[0_18px_45px_rgba(7,17,31,0.08)]">
          <p className="text-lg font-semibold">Category not found</p>
          <p className="mt-2 text-sm">The category you are looking for does not exist.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-glow"
          >
            Back to home
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  const Icon = resolveIcon(category.icon);
  const lowerLabel = category.label.toLowerCase();

  return (
    <CategoryProductsPage
      category={category.name}
      categoryId={category.category_id}
      badgeLabel={category.label}
      heading={category.description || `Browse ${lowerLabel} from the live catalog.`}
      loadingLabel={`Loading ${lowerLabel}...`}
      errorLabel={`We could not load ${lowerLabel}.`}
      emptyLabel={`No ${lowerLabel} found.`}
      Icon={Icon}
      itemTypes={category.item_types}
    />
  );
}
