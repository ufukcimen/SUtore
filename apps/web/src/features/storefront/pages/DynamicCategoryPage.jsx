import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { RefreshCcw } from "lucide-react";
import { useCategories } from "../context/CategoriesContext";
import { resolveFallbackCategory } from "../data/categoryFallbacks";
import { resolveIcon } from "../data/iconMap";
import { CategoryProductsPage } from "../components/CategoryProductsPage";
import { StorefrontShell } from "../components/StorefrontShell";

export function DynamicCategoryPage() {
  const { slug } = useParams();
  const { categories, isLoading } = useCategories();
  const category = categories.find((currentCategory) => currentCategory.slug === slug)
    ?? resolveFallbackCategory(slug);

  if (isLoading && !category) {
    return (
      <StorefrontShell>
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
            <RefreshCcw className="h-6 w-6 animate-spin" />
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-950">Loading category...</p>
        </div>
      </StorefrontShell>
    );
  }

  if (!category) {
    return (
      <StorefrontShell>
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-900 shadow-sm">
          <p className="text-lg font-semibold">Category not found</p>
          <p className="mt-2 text-sm">The category you are looking for does not exist.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to home
          </Link>
        </div>
      </StorefrontShell>
    );
  }

  const Icon = resolveIcon(category.icon);
  const lowerLabel = category.label.toLowerCase();
  const categoryId =
    typeof category.category_id === "number" ? category.category_id : null;

  return (
    <CategoryProductsPage
      category={category.name}
      categoryId={categoryId}
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
