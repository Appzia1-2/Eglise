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
import PreAnnouncementPage from "./pages/PreAnnouncementPage";
import MarriagePage from "./pages/MarriagePage";
import TombTypePage from "./pages/TombTypePage";
import TombFeesPage from "./pages/TombFeesPage";
import DesignationPage from "./pages/DesignationPage";
import PriestPage from "./pages/PriestPage";
import PriestChangesPage from "./pages/PriestChangesPage";
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
        <Route path="/login" element={<LoginPage />} />
        {/* Debug: Moved change-password route up */}
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
          path="/pre-announcement"
          element={
            <ProtectedRoute>
              <PreAnnouncementPage />
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
          path="/priest-change"
          element={
            <ProtectedRoute>
              <PriestChangesPage />
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
        <Route path="/dioceses" element={<DiocesePage />} />
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
<Route path="/qurbana-receipts" element={<ProtectedRoute><QurbanaReceiptsPage /></ProtectedRoute>} />
<Route path="/committees" element={<ProtectedRoute><CommitteePage /></ProtectedRoute>} />
<Route path="/committee-members" element={<ProtectedRoute><CommitteeMemberPage /></ProtectedRoute>} />
<Route
  path="/committee-list-report"
  element={
    <ProtectedRoute>
      <CommitteeListReportPage />
    </ProtectedRoute>
  }
/>
      </Routes>
    </Router>
  );
}

export default App;
