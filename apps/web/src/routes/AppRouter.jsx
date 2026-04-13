import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { AccountSettingsPage } from "../features/account/pages/AccountSettingsPage";
import { OrdersPage } from "../features/account/pages/OrdersPage";
import { ManagerDashboardPage } from "../features/account/pages/ManagerDashboardPage";
import { ReviewModerationPage } from "../features/account/pages/ReviewModerationPage";
import { WishlistPage } from "../features/account/pages/WishlistPage";
import { CartPage } from "../features/cart/pages/CartPage";
import { CheckoutPage } from "../features/cart/pages/CheckoutPage";
import { CheckoutSuccessPage } from "../features/cart/pages/CheckoutSuccessPage";
import { HomePage } from "../features/storefront/pages/HomePage";
import { DynamicCategoryPage } from "../features/storefront/pages/DynamicCategoryPage";
import { ProductDetailPage } from "../features/storefront/pages/ProductDetailPage";
import { SearchResultsPage } from "../features/storefront/pages/SearchResultsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/account/settings" element={<AccountSettingsPage />} />
      <Route path="/account/orders" element={<OrdersPage />} />
      <Route path="/account/wishlist" element={<WishlistPage />} />
      <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
      <Route path="/manager/reviews" element={<ReviewModerationPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

      {/* Dynamic category route */}
      <Route path="/category/:slug" element={<DynamicCategoryPage />} />

      {/* Legacy redirects — old hardcoded routes point to the dynamic route */}
      <Route path="/laptops" element={<Navigate to="/category/laptops" replace />} />
      <Route path="/oem-pcs" element={<Navigate to="/category/oem-pcs" replace />} />
      <Route path="/monitors" element={<Navigate to="/category/monitors" replace />} />
      <Route path="/pc-components" element={<Navigate to="/category/pc-components" replace />} />
      <Route path="/gaming-accessories" element={<Navigate to="/category/gaming-accessories" replace />} />
      <Route path="/storage-devices" element={<Navigate to="/category/storage-devices" replace />} />
      <Route path="/network" element={<Navigate to="/category/network" replace />} />
      <Route path="/peripherals" element={<Navigate to="/category/peripherals" replace />} />
      <Route path="/audio" element={<Navigate to="/category/audio" replace />} />
      <Route path="/streaming-gear" element={<Navigate to="/category/streaming-gear" replace />} />

      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}
