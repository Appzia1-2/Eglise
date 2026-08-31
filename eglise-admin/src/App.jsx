// src/App.jsx - Updated with Member View Route and Headless Route

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";


// Admin Imports
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import DioceseManagement from "./admin/pages/DioceseManagement";
import DioceseAdd from "./admin/pages/DioceseAdd";
import DioceseEdit from "./admin/pages/DioceseEdit";
import ChurchesPage from "./admin/pages/ChurchesPage";
import ChurchAdd from "./admin/pages/ChurchAdd";
import ChurchEdit from "./admin/pages/ChurchEdit";
import ChurchView from "./admin/pages/ChurchView";

// Package Imports
import PackagesPage from "./admin/pages/PackagesPage";
import PackageAddPage from "./admin/pages/PackageAddPage";
import PackageEditPage from "./admin/pages/PackageEditPage";

// Subscription Imports
import SubscriptionsPage from "./admin/pages/SubscriptionsPage";
import SubscriptionAddPage from "./admin/pages/SubscriptionAddPage";
import SubscriptionDetailPage from "./admin/pages/SubscriptionDetailPage";

// Tax Type & Tax Rate Imports
import TaxTypesPage from "./admin/pages/TaxTypesPage";
import TaxTypeAddPage from "./admin/pages/TaxTypeAddPage";
import TaxTypeEditPage from "./admin/pages/TaxTypeEditPage";
import TaxRatesPage from "./admin/pages/TaxRatesPage";
import TaxRateAddPage from "./admin/pages/TaxRateAddPage";
import TaxRateEditPage from "./admin/pages/TaxRateEditPage";

// Payment Imports
import PaymentsPage from "./admin/pages/PaymentsPage";
// import PaymentDetailPage from "./admin/pages/PaymentDetailPage";
import PaymentAddPage from "./admin/pages/PaymentAddPage";
// import PaymentEditPage from "./admin/pages/PaymentEditPage";

import UpgradeRequestsPage from "./admin/pages/UpgradeRequestsPage";
import AdminProtectedRoute from "./admin/routes/ProtectedRoute";
import { Toaster } from "./components/ui/toaster";

const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
       <Routes>
      <Route path="/" element={<AdminLogin />} />

        {/* ===== ADMIN ROUTES ===== */}
        
        {/* Admin Login - Public */}
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Admin Dashboard - Protected */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        
        {/* Admin Diocese Routes */}
        <Route
          path="/admin/dioceses/add"
          element={
            <AdminProtectedRoute>
              <DioceseAdd />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/dioceses/edit/:id"
          element={
            <AdminProtectedRoute>
              <DioceseEdit />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/dioceses"
          element={
            <AdminProtectedRoute>
              <DioceseManagement />
            </AdminProtectedRoute>
          }
        />
        
        {/* Admin Church Routes */}
        <Route
          path="/admin/churches/add"
          element={
            <AdminProtectedRoute>
              <ChurchAdd />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/churches/edit/:id"
          element={
            <AdminProtectedRoute>
              <ChurchEdit />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/churches/view/:id"
          element={
            <AdminProtectedRoute>
              <ChurchView />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/churches"
          element={
            <AdminProtectedRoute>
              <ChurchesPage />
            </AdminProtectedRoute>
          }
        />
        
        {/* Admin Package Routes */}
        <Route
          path="/admin/packages"
          element={
            <AdminProtectedRoute>
              <PackagesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/packages/add"
          element={
            <AdminProtectedRoute>
              <PackageAddPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/packages/edit/:id"
          element={
            <AdminProtectedRoute>
              <PackageEditPage />
            </AdminProtectedRoute>
          }
        />
        
        
        {/* Admin Subscription Routes */}
        <Route
          path="/admin/subscriptions"
          element={
            <AdminProtectedRoute>
              <SubscriptionsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions/add"
          element={
            <AdminProtectedRoute>
              <SubscriptionAddPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions/:id"
          element={
            <AdminProtectedRoute>
              <SubscriptionDetailPage />
            </AdminProtectedRoute>
          }
        />
        
        {/* Admin Tax Type Routes */}
        <Route
          path="/admin/tax-types"
          element={
            <AdminProtectedRoute>
              <TaxTypesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/tax-types/add"
          element={
            <AdminProtectedRoute>
              <TaxTypeAddPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/tax-types/edit/:id"
          element={
            <AdminProtectedRoute>
              <TaxTypeEditPage />
            </AdminProtectedRoute>
          }
        />
        
        {/* Admin Tax Rate Routes */}
        <Route
          path="/admin/tax-rates"
          element={
            <AdminProtectedRoute>
              <TaxRatesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/tax-rates/add"
          element={
            <AdminProtectedRoute>
              <TaxRateAddPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/tax-rates/edit/:id"
          element={
            <AdminProtectedRoute>
              <TaxRateEditPage />
            </AdminProtectedRoute>
          }
        />
        
        {/* Admin Payment Routes */}
        <Route
          path="/admin/payments"
          element={
            <AdminProtectedRoute>
              <PaymentsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/payments/add"
          element={
            <AdminProtectedRoute>
              <PaymentAddPage />
            </AdminProtectedRoute>
          }
        />
        {/* <Route
          path="/admin/payments/:id"
          element={
            <AdminProtectedRoute>
              <PaymentDetailPage />
            </AdminProtectedRoute>
          }
        /> */}
        {/* <Route
          path="/admin/payments/edit/:id"
          element={
            <AdminProtectedRoute>
              <PaymentEditPage />
            </AdminProtectedRoute>
          }
        /> */}
        
        {/* Admin Upgrade Requests */}
        <Route
          path="/admin/upgrade-requests"
          element={
            <AdminProtectedRoute>
              <UpgradeRequestsPage />
            </AdminProtectedRoute>
          }
        />

        {/* Admin catch-all - redirect to admin dashboard - MUST BE LAST */}
        <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
      
      {/* Toaster for notifications */}
      <Toaster />
    </Router>
  );
}

export default App;