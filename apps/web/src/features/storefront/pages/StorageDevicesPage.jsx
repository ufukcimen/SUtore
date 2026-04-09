import { HardDrive } from "lucide-react";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export function StorageDevicesPage() {
  return (
    <CategoryProductsPage
      category="storage"
      badgeLabel="Storage devices"
      heading="Browse storage devices from the live catalog."
      loadingLabel="Loading storage devices..."
      errorLabel="We could not load storage devices."
      emptyLabel="No storage devices found."
      Icon={HardDrive}
    />
  );
}
