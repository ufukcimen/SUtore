import { Headphones } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function AudioPage() {
  return (
    <CategoryProductsPage
      category="audio"
      badgeLabel="Audio"
      heading="Browse audio products from the live catalog."
      loadingLabel="Loading audio products..."
      errorLabel="We could not load audio products."
      emptyLabel="No audio products found."
      Icon={Headphones}
    />
  );
}
