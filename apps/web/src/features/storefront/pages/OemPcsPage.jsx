import { Cpu } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function OemPcsPage() {
  return (
    <CategoryProductsPage
      category="desktop"
      badgeLabel="OEM PC builds"
      heading="Browse OEM PC builds from the live catalog."
      loadingLabel="Loading OEM PC builds..."
      errorLabel="We could not load OEM PC builds."
      emptyLabel="No OEM PC builds found."
      Icon={Cpu}
    />
  );
}
