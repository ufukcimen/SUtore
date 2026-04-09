import { Router } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function NetworkPage() {
  return (
    <CategoryProductsPage
      category="network"
      badgeLabel="Network"
      heading="Browse networking products from the live catalog."
      loadingLabel="Loading networking products..."
      errorLabel="We could not load networking products."
      emptyLabel="No networking products found."
      Icon={Router}
    />
  );
}
