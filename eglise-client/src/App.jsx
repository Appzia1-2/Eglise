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


import EventsPage from "./pages/EventsPage";
import EventsAddPage from "./pages/EventsAddPage";
import EventsEditPage from "./pages/EventsEditPage";


// import DiocesePage from "./pages/DiocesePage";
import OfferingPage from "./pages/OfferingPage";
import OfferingAddPage from "./pages/OfferingAddPage";
import OfferingEditPage from "./pages/OfferingEditPage";




import VisitorPage from "./pages/VisitorPage";

import SubscriptionPage from "./pages/SubscriptionPage";
import SubscriptionCreatePage from "./pages/SubscriptionAddPage";
import SubscriptionEditPage from "./pages/SubscriptionEditPage";

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
          path="/church/dashboard"
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


        
        
        

     
      </Routes>
      
      {/* Toaster for notifications */}
      <Toaster />
    </Router>
  );
}

export default App;