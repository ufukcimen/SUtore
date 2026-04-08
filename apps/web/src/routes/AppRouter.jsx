import { Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { CartPage } from "../features/cart/pages/CartPage";
import { CheckoutPage } from "../features/cart/pages/CheckoutPage";
import { CheckoutSuccessPage } from "../features/cart/pages/CheckoutSuccessPage";
import { HomePage } from "../features/storefront/pages/HomePage";
import { LaptopsPage } from "../features/storefront/pages/LaptopsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
      <Route path="/laptops" element={<LaptopsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}
