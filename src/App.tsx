import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import HomePage from "@/routes/index";
import LoginPage from "@/routes/login";
import RegisterPage from "@/routes/register";
import ForgotPasswordPage from "@/routes/forgot-password";
import ResetPasswordPage from "@/routes/reset-password";
import AuthCallbackPage from "@/routes/auth.callback";
import AboutPage from "@/routes/about";
import ContactPage from "@/routes/contact";
import ProductsPage from "@/routes/products";
import ShopPage from "@/routes/shop";
import DashboardPage from "@/routes/dashboard";
import DashboardProductsPage from "@/routes/dashboard.products";
import DashboardOrdersPage from "@/routes/dashboard.orders";
import DashboardProfilePage from "@/routes/dashboard.profile";
import WalletPage from "@/routes/wallet";
import AdminLoginPage from "@/routes/admin";
import ManageLayout from "@/routes/manage";
import ManageOverviewPage from "@/routes/manage.index";
import ManageProductsPage from "@/routes/manage.products";
import ManageOrdersPage from "@/routes/manage.orders";
import ManageCouponsPage from "@/routes/manage.coupons";
import ManageUsersPage from "@/routes/manage.users";
import ManageAdminsPage from "@/routes/manage.admins";
import ManagePaymentsPage from "@/routes/manage.payments";
import ManagePasswordPage from "@/routes/manage.password";
import TermsPage from "@/routes/terms";
import PrivacyPage from "@/routes/privacy";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        {/* legacy /auth redirect */}
        <Route path="/auth" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:categorySlug" element={<ProductsPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/products" element={<DashboardProductsPage />} />
        <Route path="/dashboard/orders" element={<DashboardOrdersPage />} />
        <Route path="/dashboard/profile" element={<DashboardProfilePage />} />
        <Route path="/orders" element={<DashboardOrdersPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/manage" element={<ManageLayout />}>
          <Route index element={<ManageOverviewPage />} />
          <Route path="products" element={<ManageProductsPage />} />
          <Route path="orders" element={<ManageOrdersPage />} />
          <Route path="coupons" element={<ManageCouponsPage />} />
          <Route path="users" element={<ManageUsersPage />} />
          <Route path="admins" element={<ManageAdminsPage />} />
          <Route path="payments" element={<ManagePaymentsPage />} />
          <Route path="password" element={<ManagePasswordPage />} />
        </Route>
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
