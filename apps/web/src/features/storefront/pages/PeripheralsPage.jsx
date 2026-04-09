import { Keyboard } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function PeripheralsPage() {
  return (
    <CategoryProductsPage
      category="peripheral"
      badgeLabel="Peripherals"
      heading="Browse peripherals from the live catalog."
      loadingLabel="Loading peripherals..."
      errorLabel="We could not load peripherals."
      emptyLabel="No peripherals found."
      Icon={Keyboard}
    />
  );
}
