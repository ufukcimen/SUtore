import { FloatingStorefrontHeader } from "../features/storefront/components/FloatingStorefrontHeader";
import { CategoriesProvider } from "../features/storefront/context/CategoriesContext";
import { AppRouter } from "../routes/AppRouter";

export default function App() {
  return (
    <CategoriesProvider>
      <FloatingStorefrontHeader />
      <AppRouter />
    </CategoriesProvider>
  );
}

