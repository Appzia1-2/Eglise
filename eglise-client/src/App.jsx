// src/App.jsx

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

import FamilyHeadDashboard from "./pages/FamilyHeadDashboard";

// Family Head Pages
import RegisterFamilyHeadPage from "./pages/RegisterFamilyHeadPage";
import FamilyHeadDetailsPage from "./pages/FamilyHeadDetailsPage";
import EditFamilyHeadPage from "./pages/Editfamilyheadpage";

// Member Pages
import MemberListUnderHeadPage from "./pages/MemberListUnderHeadPage";
import AddMemberPage from "./pages/AddMemberPage";
import EditMemberPage from "./pages/EditMemberPage";
import MemberDetailPage from "./pages/MemberDetailPage";
import FamilyHeadPrintPreviewPage from "./pages/FamilyHeadPrintPreviewPage";

import HeadlessHouseMembersPage from "./pages/HeadlessHouseMembersPage";
import HeadlessPromote from "./pages/HeadlessPromote";

import authService from "./auth/authService";
import ChangePasswordPage from "./pages/ChangePasswordPage";

import BaptismPage from "./pages/BaptismPage";
import BaptismAddPage from "./pages/BaptismAddPage";
import BaptismEditPage from "./pages/BaptismEditPage";
import BaptismViewPage from "./pages/BaptismViewPage";

import ChurchInfoPage from "./pages/ChurchInfoPage";

import MarriagePage from "./pages/MarriagePage";
import MarriageAddPage from "./pages/MarriageAddPage";
import MarriageEditPage from "./pages/MarriageEditPage";
import MarriageViewPage from "./pages/MarriageViewPage";

import TombTypePage from "./pages/TombTypePage";
import TombTypeAddPage from "./pages/TombTypeAddPage";
import TombTypeViewPage from "./pages/TombTypeViewPage";
import TombTypeEditPage from "./pages/TombTypeEditPage";

import TombFeesPage from "./pages/TombFeesPage";
import TombFeesAddPage from "./pages/TombFeesAddPage";
import TombFeeEditPage from "./pages/TombFeeEditPage";

import DesignationPage from "./pages/DesignationPage";
import DesignationAddPage from "./pages/DesignationAddPage";
import DesignationViewPage from "./pages/DesignationViewPage";
import DesignationEditPage from "./pages/DesignationEditPage";

import PriestPage from "./pages/PriestPage";
import RegisterPriestPage from "./pages/RegisterPriestPage";
import EditPriestPage from "./pages/EditPriestPage";
import ViewPriestPage from "./pages/ViewPriestPage";

import RegisterSettingsPage from "./pages/RegisterSettingsPage";

import DeathRegisterPage from "./pages/DeathRegisterPage";
import DeathAddPage from "./pages/DeathAddPage";
import DeathRegisterDetailPage from "./pages/Deathregisterdetailpage";
import DeathEditPage from "./pages/DeathEditPage";

import EventsPage from "./pages/EventsPage";
import EventsAddPage from "./pages/EventsAddPage";
import EventsEditPage from "./pages/EventsEditPage";

import OfferingPage from "./pages/OfferingPage";
import OfferingAddPage from "./pages/OfferingAddPage";
import OfferingEditPage from "./pages/OfferingEditPage";

import ReceiptsPage from "./pages/ReceiptsPage";
import ReceiptCreatePage from "./pages/ReceiptCreatePage";
import ReceiptDetailPage from "./pages/ReceiptDetailPage";

import VisitorPage from "./pages/VisitorPage";
import VisitorAddPage from "./pages/VisitorAddPage";
import VisitorViewPage from "./pages/VisitorViewPage";
import VisitorEditPage from "./pages/VisitorEditPage";

import SubscriptionPage from "./pages/SubscriptionPage";
import SubscriptionCreatePage from "./pages/SubscriptionAddPage";
import SubscriptionEditPage from "./pages/SubscriptionEditPage";

import AccountGroupPage from "./pages/AccountGroupPage";
import AccountGroupAddPage from "./pages/AccountGroupAddPage";
import AccountGroupViewPage from "./pages/AccountGroupViewPage";
import AccountGroupEditPage from "./pages/AccountGroupEditPage";

import AccountLedgerPage from "./pages/AccountLedgerPage";
import AccountLedgerAddPage from "./pages/Accountledgeraddpage";
import AccountLedgerEditPage from "./pages/Accountledgereditpage";
import AccountLedgerViewPage from "./pages/Accountledgerviewpage";

// =========================================================
// BANK ACCOUNTS
// =========================================================
import BankAccountsPage from "./pages/BankAccountsPage";
import BankAccountAddPage from "./pages/BankAccountAddPage";
import BankAccountEditPage from "./pages/BankAccountEditPage";

// =========================================================
// PAYMENT ROUTES — redesigned (List + Add + Edit)
// =========================================================
import PaymentListPage from "./pages/PaymentListPage";
import AddPaymentPage from "./pages/AddPaymentPage";
import PaymentDetailPage from "./pages/PaymentDetailPage";

import QurbanaReceiptsPage from "./pages/QurbanaReceiptsPage";
import CommitteePage from "./pages/CommitteePage";
import CommitteeAddPage from "./pages/CommitteeAddPage";
import CommitteeEditPage from "./pages/CommitteeEditPage";
import CommitteeViewPage from "./pages/CommitteeViewPage";
import CommitteePrintPage from "./pages/CommitteePrintPage";

import CommitteeListReportPage from "./pages/CommitteeListReportPage";
import MemberDirectoryPage from "./pages/MemberDirectoryPage";
import MemberAgeWisePage from "./pages/MemberAgeWisePage";
import MemberPhoneDirectoryPage from "./pages/MemberPhoneDirectoryPage";

// Legacy Baptism
import LegacyBaptismListPage from "./pages/LegacyBaptismListPage";
import LegacyBaptismViewPage from "./pages/LegacyBaptismViewPage";
import LegacyBaptismAddPage from "./pages/LegacyBaptismAddPage";
import LegacyBaptismEditPage from "./pages/LegacyBaptismEditPage";

// Legacy Marriage
import LegacyMarriageListPage from "./pages/LegacyMarriageListPage";
import LegacyMarriageViewPage from "./pages/LegacyMarriageViewPage";
import LegacyMarriageAddPage from "./pages/LegacyMarriageAddPage";
import LegacyMarriageEditPage from "./pages/LegacyMarriageEditPage";

// Legacy Death
import LegacyDeathListPage from "./pages/LegacyDeathListPage";
import LegacyDeathViewPage from "./pages/LegacyDeathViewPage";
import LegacyDeathAddPage from "./pages/LegacyDeathAddPage";
import LegacyDeathEditPage from "./pages/LegacyDeathEditPage";

// Reports (list + print certificate)
import ReportListPage from "./pages/reports/ReportListPage";
import BaptismCertificatePage from "./pages/reports/BaptismCertificatePage";
import MarriageCertificatePage from "./pages/reports/MarriageCertificatePage";
import DeathCertificatePage from "./pages/reports/DeathCertificatePage";

import DayBookPage from "./pages/DayBookPage";
import CashBookPage from "./pages/CashBookPage";
import BankBookPage from "./pages/BankBookPage";
import GeneralLedgerPage from "./pages/GeneralLedgerPage";
import MemberLedgerPage from "./pages/reports/MemberLedgerPage";
import IncomeExpenditurePage from "./pages/reports/IncomeExpenditurePage";
import SubscriptionDueListPage from "./pages/reports/SubscriptionDueListPage";
import SubscriptionPaidListPage from "./pages/reports/SubscriptionPaidListPage";
import DonationRegisterPage from "./pages/reports/DonationRegisterPage";
import ReceiptPaymentPage from "./pages/reports/ReceiptPaymentPage";
import BalanceSheetPage from "./pages/reports/BalanceSheetPage";

// =========================================================
// CONTRA ROUTES
// =========================================================
import ContraListPage from "./pages/ContraListPage";
import ContraFormPage from "./pages/ContraFormPage";

import ForcePasswordChange from "./components/ForcePasswordChange";

import { Toaster } from "./components/ui/toaster";

const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <ForcePasswordChange>{children}</ForcePasswordChange>;
};

function App() {
  return (
    <Router>
      <Routes>

        {/* =========================================================
            CHURCH/USER ROUTES
        ========================================================= */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/church/dashboard"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route path="/family" element={<Navigate to="/family-master" replace />} />
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
          element={
            <ProtectedRoute>
              <RelationshipAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relationship/:id"
          element={
            <ProtectedRoute>
              <RelationshipViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relationship/:id/edit"
          element={
            <ProtectedRoute>
              <RelationshipEditPage />
            </ProtectedRoute>
          }
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
        <Route
          path="/family-heads/:headId/members"
          element={
            <ProtectedRoute>
              <MemberListUnderHeadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family-heads/:headId/members/create"
          element={
            <ProtectedRoute>
              <AddMemberPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family-heads/:headId/members/:memberId"
          element={
            <ProtectedRoute>
              <MemberDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family-heads/:headId/members/:memberId/edit"
          element={
            <ProtectedRoute>
              <EditMemberPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            BAPTISM
        ========================================================= */}
        <Route
          path="/baptism"
          element={
            <ProtectedRoute>
              <BaptismPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/baptism/add"
          element={
            <ProtectedRoute>
              <BaptismAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/baptism/:id/edit"
          element={
            <ProtectedRoute>
              <BaptismEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/baptism/:id"
          element={
            <ProtectedRoute>
              <BaptismViewPage />
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

        {/* =========================================================
            MARRIAGE
        ========================================================= */}
        <Route
          path="/marriage"
          element={
            <ProtectedRoute>
              <MarriagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marriage/add"
          element={
            <ProtectedRoute>
              <MarriageAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marriage/:id"
          element={
            <ProtectedRoute>
              <MarriageViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marriage/:id/edit"
          element={
            <ProtectedRoute>
              <MarriageEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            TOMB TYPE MASTER ROUTES
        ========================================================= */}
        <Route
          path="/tomb-type"
          element={
            <ProtectedRoute>
              <TombTypePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tomb-type/add"
          element={
            <ProtectedRoute>
              <TombTypeAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tomb-type/:id/edit"
          element={
            <ProtectedRoute>
              <TombTypeEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tomb-type/:id"
          element={
            <ProtectedRoute>
              <TombTypeViewPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            TOMB FEES
        ========================================================= */}
        <Route
          path="/tomb-fees"
          element={
            <ProtectedRoute>
              <TombFeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tomb-fees/add"
          element={
            <ProtectedRoute>
              <TombFeesAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tomb-fees/:id/edit"
          element={
            <ProtectedRoute>
              <TombFeeEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            DESIGNATION MASTER ROUTES
        ========================================================= */}
        <Route
          path="/designation"
          element={
            <ProtectedRoute>
              <DesignationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designation/add"
          element={
            <ProtectedRoute>
              <DesignationAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designation/:id/edit"
          element={
            <ProtectedRoute>
              <DesignationEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designation/:id"
          element={
            <ProtectedRoute>
              <DesignationViewPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            PRIEST MASTER
        ========================================================= */}
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
          element={
            <ProtectedRoute>
              <EditPriestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/priest-master/:id"
          element={
            <ProtectedRoute>
              <ViewPriestPage />
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

        {/* =========================================================
            DEATH REGISTER
        ========================================================= */}
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
          path="/death/:id"
          element={
            <ProtectedRoute>
              <DeathRegisterDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/death/:id/edit"
          element={
            <ProtectedRoute>
              <DeathEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            EVENTS
        ========================================================= */}
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/add"
          element={
            <ProtectedRoute>
              <EventsAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute>
              <EventsEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            OFFERINGS
        ========================================================= */}
        <Route
          path="/offerings"
          element={
            <ProtectedRoute>
              <OfferingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offerings/add"
          element={
            <ProtectedRoute>
              <OfferingAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offerings/:id/edit"
          element={
            <ProtectedRoute>
              <OfferingEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            VISITOR MASTER ROUTES
        ========================================================= */}
        <Route
          path="/visitors"
          element={
            <ProtectedRoute>
              <VisitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visitors/add"
          element={
            <ProtectedRoute>
              <VisitorAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visitors/:id"
          element={
            <ProtectedRoute>
              <VisitorViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visitors/:id/edit"
          element={
            <ProtectedRoute>
              <VisitorEditPage />
            </ProtectedRoute>
          }
        />
        <Route path="/visitor" element={<Navigate to="/visitors" replace />} />

        {/* =========================================================
            SUBSCRIPTIONS
        ========================================================= */}
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription/add"
          element={
            <ProtectedRoute>
              <SubscriptionCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions/:id/edit"
          element={
            <ProtectedRoute>
              <SubscriptionEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            ACCOUNT GROUPS
        ========================================================= */}
        <Route
          path="/account-groups"
          element={
            <ProtectedRoute>
              <AccountGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-groups/add"
          element={
            <ProtectedRoute>
              <AccountGroupAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-groups/:id/edit"
          element={
            <ProtectedRoute>
              <AccountGroupEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-groups/:id"
          element={
            <ProtectedRoute>
              <AccountGroupViewPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            ACCOUNT LEDGERS
        ========================================================= */}
        <Route
          path="/account-ledgers"
          element={
            <ProtectedRoute>
              <AccountLedgerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-ledgers/add"
          element={
            <ProtectedRoute>
              <AccountLedgerAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-ledgers/:id/edit"
          element={
            <ProtectedRoute>
              <AccountLedgerEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-ledgers/:id"
          element={
            <ProtectedRoute>
              <AccountLedgerViewPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            BANK ACCOUNTS
        ========================================================= */}
        <Route
          path="/bank-accounts"
          element={
            <ProtectedRoute>
              <BankAccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bank-accounts/add"
          element={
            <ProtectedRoute>
              <BankAccountAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bank-accounts/:id/edit"
          element={
            <ProtectedRoute>
              <BankAccountEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            PAYMENTS — redesigned
        ========================================================= */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/add"
          element={
            <ProtectedRoute>
              <AddPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:id/edit"
          element={
            <ProtectedRoute>
              <AddPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/:id"
          element={
            <ProtectedRoute>
              <PaymentDetailPage />
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

        {/* =========================================================
            COMMITTEES
        ========================================================= */}
        <Route
          path="/committees"
          element={
            <ProtectedRoute>
              <CommitteePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committees/add"
          element={
            <ProtectedRoute>
              <CommitteeAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committees/:id/edit"
          element={
            <ProtectedRoute>
              <CommitteeEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committees/:id"
          element={
            <ProtectedRoute>
              <CommitteeViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committees/:id/print"
          element={
            <ProtectedRoute>
              <CommitteePrintPage />
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

        {/* =========================================================
            LEGACY BAPTISM ROUTES
        ========================================================= */}
        <Route
          path="/legacy/baptism"
          element={
            <ProtectedRoute>
              <LegacyBaptismListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/baptism/add"
          element={
            <ProtectedRoute>
              <LegacyBaptismAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/baptism/:id"
          element={
            <ProtectedRoute>
              <LegacyBaptismViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/baptism/:id/edit"
          element={
            <ProtectedRoute>
              <LegacyBaptismEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            LEGACY MARRIAGE ROUTES
        ========================================================= */}
        <Route
          path="/legacy/marriage"
          element={
            <ProtectedRoute>
              <LegacyMarriageListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/marriage/add"
          element={
            <ProtectedRoute>
              <LegacyMarriageAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/marriage/:id"
          element={
            <ProtectedRoute>
              <LegacyMarriageViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/marriage/:id/edit"
          element={
            <ProtectedRoute>
              <LegacyMarriageEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            LEGACY DEATH ROUTES
        ========================================================= */}
        <Route
          path="/legacy/death"
          element={
            <ProtectedRoute>
              <LegacyDeathListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/death/add"
          element={
            <ProtectedRoute>
              <LegacyDeathAddPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/death/:id"
          element={
            <ProtectedRoute>
              <LegacyDeathViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy/death/:id/edit"
          element={
            <ProtectedRoute>
              <LegacyDeathEditPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            REPORTS: LIVE REGISTERS
        ========================================================= */}
        <Route
          path="/reports/baptism"
          element={
            <ProtectedRoute>
              <ReportListPage type="baptism" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/baptism/:id/certificate"
          element={
            <ProtectedRoute>
              <BaptismCertificatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/marriage"
          element={
            <ProtectedRoute>
              <ReportListPage type="marriage" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/marriage/:id/certificate"
          element={
            <ProtectedRoute>
              <MarriageCertificatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/death"
          element={
            <ProtectedRoute>
              <ReportListPage type="death" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/death/:id/certificate"
          element={
            <ProtectedRoute>
              <DeathCertificatePage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            REPORTS: LEGACY REGISTERS
        ========================================================= */}
        <Route
          path="/reports/legacy/baptism"
          element={
            <ProtectedRoute>
              <ReportListPage type="baptism" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/legacy/baptism/:id/certificate"
          element={
            <ProtectedRoute>
              <BaptismCertificatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/legacy/marriage"
          element={
            <ProtectedRoute>
              <ReportListPage type="marriage" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/legacy/marriage/:id/certificate"
          element={
            <ProtectedRoute>
              <MarriageCertificatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/legacy/death"
          element={
            <ProtectedRoute>
              <ReportListPage type="death" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/legacy/death/:id/certificate"
          element={
            <ProtectedRoute>
              <DeathCertificatePage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            RECEIPTS
        ========================================================= */}
        <Route
          path="/receipts"
          element={
            <ProtectedRoute>
              <ReceiptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts/add"
          element={
            <ProtectedRoute>
              <ReceiptCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts/:id"
          element={
            <ProtectedRoute>
              <ReceiptDetailPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            REPORTS: BOOKS & LEDGERS
        ========================================================= */}
        <Route
          path="/reports/day-book"
          element={
            <ProtectedRoute>
              <DayBookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/cash-book"
          element={
            <ProtectedRoute>
              <CashBookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/bank-book"
          element={
            <ProtectedRoute>
              <BankBookPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/general-ledger"
          element={
            <ProtectedRoute>
              <GeneralLedgerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/member-ledger"
          element={
            <ProtectedRoute>
              <MemberLedgerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/income-expenditure"
          element={
            <ProtectedRoute>
              <IncomeExpenditurePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/subscription-due"
          element={
            <ProtectedRoute>
              <SubscriptionDueListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/subscription-paid"
          element={
            <ProtectedRoute>
              <SubscriptionPaidListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/donation-register"
          element={
            <ProtectedRoute>
              <DonationRegisterPage />
            </ProtectedRoute>
          }
        />

        {/* ✅ Receipts & Payments Combined Report */}
        <Route
          path="/reports/receipts-payments"
          element={
            <ProtectedRoute>
              <ReceiptPaymentPage />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            CONTRA (Cash ↔ Bank transfers)
        ========================================================= */}
        <Route
          path="/contra"
          element={
            <ProtectedRoute>
              <ContraListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contra/add"
          element={
            <ProtectedRoute>
              <ContraFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contra/:id/edit"
          element={
            <ProtectedRoute>
              <ContraFormPage />
            </ProtectedRoute>
          }
        />
        <Route
  path="/reports/balance-sheet"
  element={
    <ProtectedRoute>
      <BalanceSheetPage />
    </ProtectedRoute>
  }
/>

        {/* =========================================================
            FALLBACK
        ========================================================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toaster for notifications */}
      <Toaster />
    </Router>
  );
}

export default App;