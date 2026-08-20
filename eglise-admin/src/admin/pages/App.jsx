// src/App.jsx - FIXED IMPORTS
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import FamilyPage from "./pages/FamilyPage";
import WardPage from "./pages/WardPage";
import GradePage from "./pages/GradePage";
import RelationshipPage from "./pages/RelationshipPage";
import MembersPage from "./pages/MembersPage";
import MemberDetailsPage from "./pages/MemberDetailsPage";
import authService from "./auth/authService";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import BaptismPage from "./pages/BaptismPage";
import ChurchInfoPage from "./pages/ChurchInfoPage";

import MarriagePage from "./pages/MarriagePage";
import TombTypePage from "./pages/TombTypePage";
import TombFeesPage from "./pages/TombFeesPage";
import DesignationPage from "./pages/DesignationPage";
import PriestPage from "./pages/PriestPage";

import RegisterSettingsPage from "./pages/RegisterSettingsPage";
import DeathRegisterPage from "./pages/DeathRegisterPage";
import EventsPage from "./pages/EventsPage";
import DiocesePage from "./pages/DiocesePage";
import OfferingPage from "./pages/OfferingPage";
import VisitorPage from "./pages/VisitorPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AccountGroupPage from "./pages/AccountGroupPage";
import AccountLedgerPage from "./pages/AccountLedgerPage";
import PaymentPage from "./pages/PaymentPage";
import QurbanaReceiptsPage from "./pages/QurbanaReceiptsPage";
import CommitteePage from "./pages/CommitteePage";
import CommitteeMemberPage from "./pages/CommitteeMemberPage";
import CommitteeListReportPage from "./pages/CommitteeListReportPage";
import MemberDirectoryPage from "./pages/MemberDirectoryPage";
import MemberAgeWisePage from "./pages/MemberAgeWisePage";
import MemberPhoneDirectoryPage from "./pages/MemberPhoneDirectoryPage";

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

// Package Imports - FIXED: Changed from "./admin/packages/" to "./admin/pages/"
import PackagesPage from "./admin/pages/PackagesPage";
import PackageCreatePage from "./admin/pages/PackageCreatePage";
import PackageEditPage from "./admin/pages/PackageEditPage";
import PackageDetailPage from "./admin/pages/PackageDetailPage";

import BillsPage from "./admin/pages/BillsPage";
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
        {/* ===== CHURCH/USER ROUTES ===== */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family"
          element={
            <ProtectedRoute>
              <FamilyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ward"
          element={
            <ProtectedRoute>
              <WardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grade"
          element={
            <ProtectedRoute>
              <GradePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relationship"
          element={
            <ProtectedRoute>
              <RelationshipPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members/:headId"
          element={
            <ProtectedRoute>
              <MemberDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/baptism"
          element={
            <ProtectedRoute>
              <BaptismPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/church-info"
          element={
            <ProtectedRoute>
              <ChurchInfoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marriage"
          element={
            <ProtectedRoute>
              <MarriagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tomb-type"
          element={
            <ProtectedRoute>
              <TombTypePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tomb-fees"
          element={
            <ProtectedRoute>
              <TombFeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designation"
          element={
            <ProtectedRoute>
              <DesignationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/priest-master"
          element={
            <ProtectedRoute>
              <PriestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-settings"
          element={
            <ProtectedRoute>
              <RegisterSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/death-register"
          element={
            <ProtectedRoute>
              <DeathRegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dioceses"
          element={
            <ProtectedRoute>
              <DiocesePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offerings"
          element={
            <ProtectedRoute>
              <OfferingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visitors"
          element={
            <ProtectedRoute>
              <VisitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-groups"
          element={
            <ProtectedRoute>
              <AccountGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-ledgers"
          element={
            <ProtectedRoute>
              <AccountLedgerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qurbana-receipts"
          element={
            <ProtectedRoute>
              <QurbanaReceiptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committees"
          element={
            <ProtectedRoute>
              <CommitteePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committee-members"
          element={
            <ProtectedRoute>
              <CommitteeMemberPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member-directory"
          element={
            <ProtectedRoute>
              <MemberDirectoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/age-wise-list"
          element={
            <ProtectedRoute>
              <MemberAgeWisePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/phone-directory"
          element={
            <ProtectedRoute>
              <MemberPhoneDirectoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committee-list-report"
          element={
            <ProtectedRoute>
              <CommitteeListReportPage />
            </ProtectedRoute>
          }
        />

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
        
        {/* ===== ADMIN PACKAGE ROUTES ===== */}
        <Route
          path="/admin/packages"
          element={
            <AdminProtectedRoute>
              <PackagesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/packages/create"
          element={
            <AdminProtectedRoute>
              <PackageCreatePage />
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
        <Route
          path="/admin/packages/view/:id"
          element={
            <AdminProtectedRoute>
              <PackageDetailPage />
            </AdminProtectedRoute>
          }
        />
        
        {/* Admin Bills */}
        <Route
          path="/admin/bills"
          element={
            <AdminProtectedRoute>
              <BillsPage />
            </AdminProtectedRoute>
          }
        />
        
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