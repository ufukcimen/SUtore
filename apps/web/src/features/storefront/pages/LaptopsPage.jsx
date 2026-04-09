import { Laptop } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function LaptopsPage() {
  return (
    <CategoryProductsPage
      category="laptop"
      badgeLabel="Laptop collection"
      heading="Browse laptops from the live catalog."
      loadingLabel="Loading laptops..."
      errorLabel="We could not load laptops."
      emptyLabel="No laptops found."
      Icon={Laptop}
    />
  );
}
