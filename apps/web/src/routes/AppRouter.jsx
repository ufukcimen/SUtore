import { Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { CartPage } from "../features/cart/pages/CartPage";
import { CheckoutPage } from "../features/cart/pages/CheckoutPage";
import { CheckoutSuccessPage } from "../features/cart/pages/CheckoutSuccessPage";
import { HomePage } from "../features/storefront/pages/HomePage";
import { LaptopsPage } from "../features/storefront/pages/LaptopsPage";
import { MonitorsPage } from "../features/storefront/pages/MonitorsPage";
import { OemPcsPage } from "../features/storefront/pages/OemPcsPage";
import { PcComponentsPage } from "../features/storefront/pages/PcComponentsPage";
import { GamingAccessoriesPage } from "../features/storefront/pages/GamingAccessoriesPage";
import { StorageDevicesPage } from "../features/storefront/pages/StorageDevicesPage";
import { NetworkPage } from "../features/storefront/pages/NetworkPage";
import { PeripheralsPage } from "../features/storefront/pages/PeripheralsPage";
import { AudioPage } from "../features/storefront/pages/AudioPage";
import { StreamingGearPage } from "../features/storefront/pages/StreamingGearPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
      <Route path="/laptops" element={<LaptopsPage />} />
      <Route path="/oem-pcs" element={<OemPcsPage />} />
      <Route path="/monitors" element={<MonitorsPage />} />
      <Route path="/pc-components" element={<PcComponentsPage />} />
      <Route path="/gaming-accessories" element={<GamingAccessoriesPage />} />
      <Route path="/storage-devices" element={<StorageDevicesPage />} />
      <Route path="/network" element={<NetworkPage />} />
      <Route path="/peripherals" element={<PeripheralsPage />} />
      <Route path="/audio" element={<AudioPage />} />
      <Route path="/streaming-gear" element={<StreamingGearPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}
