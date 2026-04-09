import { Sparkles } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function PcComponentsPage() {
  return (
    <CategoryProductsPage
      category="component"
      badgeLabel="PC components"
      heading="Browse PC components from the live catalog."
      loadingLabel="Loading PC components..."
      errorLabel="We could not load PC components."
      emptyLabel="No PC components found."
      Icon={Sparkles}
    />
  );
}
