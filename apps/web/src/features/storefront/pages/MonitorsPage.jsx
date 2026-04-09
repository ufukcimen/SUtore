import { Monitor } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function MonitorsPage() {
  return (
    <CategoryProductsPage
      category="monitor"
      badgeLabel="Monitor collection"
      heading="Browse monitors from the live catalog."
      loadingLabel="Loading monitors..."
      errorLabel="We could not load monitors."
      emptyLabel="No monitors found."
      Icon={Monitor}
    />
  );
}
