import { CompareProvider, CompareTray } from "../features/storefront/context/CompareContext";
import { CategoriesProvider } from "../features/storefront/context/CategoriesContext";
import { RecentlyViewedProvider } from "../features/storefront/context/RecentlyViewedContext";
import { ToastProvider } from "../features/storefront/context/ToastContext";
import { AppRouter } from "../routes/AppRouter";

export default function App() {
  return (
    <CategoriesProvider>
      <ToastProvider>
        <CompareProvider>
          <RecentlyViewedProvider>
            <AppRouter />
            <CompareTray />
          </RecentlyViewedProvider>
        </CompareProvider>
      </ToastProvider>
    </CategoriesProvider>
  );
}
