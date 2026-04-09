import { Gamepad2 } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function GamingAccessoriesPage() {
  return (
    <CategoryProductsPage
      category="accessory"
      badgeLabel="Gaming accessories"
      heading="Browse gaming accessories from the live catalog."
      loadingLabel="Loading gaming accessories..."
      errorLabel="We could not load gaming accessories."
      emptyLabel="No gaming accessories found."
      Icon={Gamepad2}
    />
  );
}
