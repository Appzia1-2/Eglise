// src/App.jsx - Updated with Member View Route and Headless Route

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import FamilyPage from "./pages/FamilyPage";
import FamilyAddPage from "./pages/FamilyAddPage";
import FamilyViewPage from "./pages/FamilyViewPage";
import FamilyEditPage from "./pages/FamilyEditPage";


import WardPage from "./pages/WardPage";
import WardAddPage from "./pages/WardAddPage";
import WardViewPage from "./pages/WardViewPage";
import WardEditPage from "./pages/WardEditPage";


import GradePage from "./pages/GradePage";
import GradeAdd from "./pages/GradeAdd";
import GradeEdit from "./pages/GradeEdit";
import GradeView from "./pages/GradeView";

import RelationshipPage from "./pages/RelationshipPage";
import RelationshipAddPage from "./pages/RelationshipAddPage";
import RelationshipViewPage from "./pages/RelationshipViewPage";
import RelationshipEditPage from "./pages/RelationshipEditPage";


// import MembersPage from "./pages/MembersPage";
// import MemberDetailsPage from "./pages/MemberDetailsPage";
import FamilyHeadDashboard from "./pages/FamilyHeadDashboard";
 
// Family Head Pages
import RegisterFamilyHeadPage from "./pages/RegisterFamilyHeadPage"; // 2-step form
import FamilyHeadDetailsPage from "./pages/FamilyHeadDetailsPage";    // View + Edit button
import EditFamilyHeadPage from "./pages/EditFamilyHeadPage";          // Full edit form
 
// Member Pages
import MemberListUnderHeadPage from "./pages/MemberListUnderHeadPage"; // List members of a head
import AddMemberPage from "./pages/AddMemberPage";                     // Create member under head
import EditMemberPage from "./pages/EditMemberPage";                   // Edit member
import MemberDetailPage from "./pages/MemberDetailPage";               // ✅ NEW: View member details
import FamilyHeadPrintPreviewPage from "./pages/FamilyHeadPrintPreviewPage";
 
import HeadlessHouseMembersPage from "./pages/HeadlessHouseMembersPage";
import HeadlessPromote from "./pages/HeadlessPromote";

import authService from "./auth/authService";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import BaptismPage from "./pages/BaptismPage";
import ChurchInfoPage from "./pages/ChurchInfoPage";

import MarriagePage from "./pages/MarriagePage";
import TombTypePage from "./pages/TombTypePage";
import TombFeesPage from "./pages/TombFeesPage";
import DesignationPage from "./pages/DesignationPage";
import PriestPage from "./pages/PriestPage";
import RegisterPriestPage from "./pages/RegisterPriestPage";
import EditPriestPage from "./pages/EditPriestPage";
import ViewPriestPage from "./pages/ViewPriestPage";

import RegisterSettingsPage from "./pages/RegisterSettingsPage";

import DeathRegisterPage from "./pages/DeathRegisterPage";
import DeathAddPage from "./pages/DeathAddPage";


import EventsPage from "./pages/EventsPage";
// import DiocesePage from "./pages/DiocesePage";
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
            <Navigate
              to="/family-master"
              replace
            />
          }
        />

        <Route
          path="/family-master"
          element={
            <ProtectedRoute>
              <FamilyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/family-master/add"
          element={
            <ProtectedRoute>
              <FamilyAddPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/family-master/:id/edit"
          element={
            <ProtectedRoute>
              <FamilyEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/family-master/:id"
          element={
            <ProtectedRoute>
              <FamilyViewPage />
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
          path="/ward/add"
          element={
            <ProtectedRoute>
              <WardAddPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ward/:id"
          element={
            <ProtectedRoute>
              <WardViewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ward/:id/edit"
          element={
            <ProtectedRoute>
              <WardEditPage />
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
          path="/grade/add"
          element={
            <ProtectedRoute>
              <GradeAdd />
            </ProtectedRoute>
          }
        />

        <Route
          path="/grade/:id/edit"
          element={
            <ProtectedRoute>
              <GradeEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/grade/:id"
          element={
            <ProtectedRoute>
              <GradeView />
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
          path="/relationship/add"
          element={<RelationshipAddPage />}
        />

        <Route
          path="/relationship/:id"
          element={<RelationshipViewPage />}
        />

        <Route
          path="/relationship/:id/edit"
          element={<RelationshipEditPage />}
        />
        
        {/* =========================================================
            FAMILY HEAD ROUTES
        ========================================================= */}

        <Route
          path="/family-heads"
          element={
            <ProtectedRoute>
              <FamilyHeadDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/family-heads/create"
          element={
            <ProtectedRoute>
              <RegisterFamilyHeadPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ IMPORTANT: Headless route MUST come BEFORE the :headId route */}
        <Route
          path="/family-heads/headless"
          element={
            <ProtectedRoute>
              <HeadlessHouseMembersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/family-heads/headless/:familyId/:houseName/members"
          element={
            <ProtectedRoute>
              <HeadlessHouseMembersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/family-heads/:headId"
          element={
            <ProtectedRoute>
              <FamilyHeadDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/family-heads/:headId/edit"
          element={
            <ProtectedRoute>
              <EditFamilyHeadPage />
            </ProtectedRoute>
          }
        />

         <Route
          path="/headless/promote"
          element={
            <ProtectedRoute>
              <HeadlessPromote />
            </ProtectedRoute>
          }
        />

        <Route
          path="/family-heads/:headId/print"
          element={
            <ProtectedRoute>
              <FamilyHeadPrintPreviewPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            MEMBERS UNDER FAMILY HEAD
        ========================================================= */}

        {/* List members under a head */}
        <Route
          path="/family-heads/:headId/members"
          element={
            <ProtectedRoute>
              <MemberListUnderHeadPage />
            </ProtectedRoute>
          }
        />

        {/* Create new member under a head */}
        <Route
          path="/family-heads/:headId/members/create"
          element={
            <ProtectedRoute>
              <AddMemberPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ NEW: View member details */}
        <Route
          path="/family-heads/:headId/members/:memberId"
          element={
            <ProtectedRoute>
              <MemberDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Edit member */}
        <Route
          path="/family-heads/:headId/members/:memberId/edit"
          element={
            <ProtectedRoute>
              <EditMemberPage />
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
          path="/priest-master/register"
          element={
            <ProtectedRoute>
              <RegisterPriestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/priest-master/edit/:id"
          element={<EditPriestPage />}
        />
        <Route
          path="/priest-master/:id"
          element={<ViewPriestPage />}
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
          path="/death/add"
          element={
            <ProtectedRoute>
              <DeathAddPage />
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
        {/* <Route
          path="/dioceses"
          element={
            <ProtectedRoute>
              <DiocesePage />
            </ProtectedRoute>
          }
        /> */}
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