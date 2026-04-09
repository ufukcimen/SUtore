import { FloatingStorefrontHeader } from "../features/storefront/components/FloatingStorefrontHeader";
import { AppRouter } from "../routes/AppRouter";

export default function App() {
  return (
    <>
      <FloatingStorefrontHeader />
      <AppRouter />
    </>
  );
}

