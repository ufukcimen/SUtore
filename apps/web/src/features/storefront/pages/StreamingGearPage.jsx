import { Mic2 } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function StreamingGearPage() {
  return (
    <CategoryProductsPage
      category="streaming"
      badgeLabel="Streaming gear"
      heading="Browse streaming gear from the live catalog."
      loadingLabel="Loading streaming gear..."
      errorLabel="We could not load streaming gear."
      emptyLabel="No streaming gear found."
      Icon={Mic2}
    />
  );
}
