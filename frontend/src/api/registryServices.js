import apiClient from "./apiClient";

// Ward APIs
export const listWards = () => apiClient.get("/api/registry/wards/");
export const createWard = (data) =>
  apiClient.post("/api/registry/wards/", data);
export const getWard = (id) => apiClient.get(`/api/registry/wards/${id}/`);
export const updateWard = (id, data) =>
  apiClient.patch(`/api/registry/wards/${id}/`, data);
export const deleteWard = (id) =>
  apiClient.delete(`/api/registry/wards/${id}/`);

// Grade APIs
export const listGrades = () => apiClient.get("/api/registry/grade/");
export const createGrade = (data) =>
  apiClient.post("/api/registry/grade/", data);
export const getGrade = (id) => apiClient.get(`/api/registry/grade/${id}/`);
export const updateGrade = (id, data) =>
  apiClient.patch(`/api/registry/grade/${id}/`, data);
export const deleteGrade = (id) =>
  apiClient.delete(`/api/registry/grade/${id}/`);

// Relationships APIs
export const listRelationships = () =>
  apiClient.get("/api/registry/relationships/");
export const createRelationship = (data) =>
  apiClient.post("/api/registry/relationships/", data);
export const getRelationship = (id) =>
  apiClient.get(`/api/registry/relationships/${id}/`);
export const updateRelationship = (id, data) =>
  apiClient.patch(`/api/registry/relationships/${id}/`, data);
export const deleteRelationship = (id) =>
  apiClient.delete(`/api/registry/relationships/${id}/`);

// Families APIs
export const listFamilies = () => apiClient.get("/api/registry/families/");
export const createFamily = (data) =>
  apiClient.post("/api/registry/families/", data);
export const getFamily = (id) => apiClient.get(`/api/registry/families/${id}/`);
export const updateFamily = (id, data) =>
  apiClient.patch(`/api/registry/families/${id}/`, data);
export const deleteFamily = (id) =>
  apiClient.delete(`/api/registry/families/${id}/`);

// Members APIs
export const listMembers = () => apiClient.get("/api/registry/members/");
export const listFamilyMembers = (familyId) =>
  apiClient.get(`/api/registry/members/?family=${familyId}`);
export const createMember = (data) =>
  apiClient.post("/api/registry/members/", data);
export const getMember = (id) => apiClient.get(`/api/registry/members/${id}/`);
export const updateMember = (id, data) =>
  apiClient.patch(`/api/registry/members/${id}/`, data);
export const deleteMember = (id) =>
  apiClient.delete(`/api/registry/members/${id}/`);
export const createHead = (data) =>
  apiClient.post("/api/registry/members/create-head/", data);
export const updateHead = (id, data) =>
  apiClient.patch(`/api/registry/family-head/${id}/`, data);
export const markMemberAsDeceased = (id) =>
  apiClient.post(`/api/registry/members/mark-dead/${id}/`);
export const promoteToHead = (id) =>
  apiClient.post(`/api/registry/members/promote-head/${id}/`);
export const listMembersByHead = (headId) =>
  apiClient.get(`/api/registry/members/by-head/${headId}/`);

// Death Register APIs
export const listDeaths = (status) => {
  const url = status
    ? `/api/registry/death-register/?status=${status}`
    : "/api/registry/death-register/";
  return apiClient.get(url);
};
export const getDeath = (id) =>
  apiClient.get(`/api/registry/death-register/${id}/`);
export const updateDeath = (id, data) =>
  apiClient.patch(`/api/registry/death-registers/${id}/`, data);
export const deleteDeath = (id) =>
  apiClient.delete(`/api/registry/death-register/${id}/`);

// Baptism APIs
export const listBaptisms = () => apiClient.get("/api/registry/baptisms/");
export const createBaptism = (data) =>
  apiClient.post("/api/registry/baptisms/", data);
export const getBaptism = (id) =>
  apiClient.get(`/api/registry/baptisms/${id}/`);
export const updateBaptism = (id, data) =>
  apiClient.patch(`/api/registry/baptisms/${id}/`, data);
export const deleteBaptism = (id) =>
  apiClient.delete(`/api/registry/baptisms/${id}/`);

// Marriage APIs (Pre-announcement)
export const listPreAnnouncements = () =>
  apiClient.get("/api/registry/marriages/vilich-chollu-kuri/");
export const createPreAnnouncement = (data) =>
  apiClient.post("/api/registry/marriages/vilich-chollu-kuri/", data);
export const getPreAnnouncement = (id) =>
  apiClient.get(`/api/registry/marriages/vilich-chollu-kuri/${id}/`);
export const updatePreAnnouncement = (id, data) =>
  apiClient.patch(
    `/api/registry/marriages/vilich-chollu-kuri/${id}/detail/`,
    data,
  );
export const deletePreAnnouncement = (id) =>
  apiClient.delete(`/api/registry/marriages/vilich-chollu-kuri/${id}/`);

// Marriage APIs
export const listMarriages = () => apiClient.get("/api/registry/marriages/");
export const createMarriage = (data) =>
  apiClient.post("/api/registry/marriages/", data);
export const getMarriage = (id) =>
  apiClient.get(`/api/registry/marriages/${id}/`);
export const updateMarriage = (id, data) =>
  apiClient.patch(`/api/registry/marriages/${id}/`, data);
export const deleteMarriage = (id) =>
  apiClient.delete(`/api/registry/marriages/${id}/`);

// Dhesha Kuri
export const getDheshaKuri = (id) =>
  apiClient.get(`/api/registry/marriages/${id}/dhesha-kuri`);

// Designation APIs
export const listDesignations = () =>
  apiClient.get("/api/registry/designations/");
export const createDesignation = (data) =>
  apiClient.post("/api/registry/designations/", data);
export const getDesignation = (id) =>
  apiClient.get(`/api/registry/designations/${id}/`);
export const updateDesignation = (id, data) =>
  apiClient.patch(`/api/registry/designations/${id}/`, data);
export const deleteDesignation = (id) =>
  apiClient.delete(`/api/registry/designations/${id}/`);

// Priest APIs
export const listPriests = () => apiClient.get("/api/registry/priests/");
export const listPriestsDropdown = () =>
  apiClient.get("/api/registry/priests/dropdown/");
export const createPriest = (data) =>
  apiClient.post("/api/registry/priests/", data);
export const getPriest = (id) => apiClient.get(`/api/registry/priests/${id}/`);
export const updatePriest = (id, data) =>
  apiClient.patch(`/api/registry/priests/${id}/`, data);
export const deletePriest = (id) =>
  apiClient.delete(`/api/registry/priests/${id}/`);

// Priest Change APIs
export const listPriestChanges = () =>
  apiClient.get("/api/registry/priest-changes/");
export const createPriestChange = (data) =>
  apiClient.post("/api/registry/priest-changes/", data);
export const getPriestChange = (id) =>
  apiClient.get(`/api/registry/priest-changes/${id}/`);
export const updatePriestChange = (id, data) =>
  apiClient.put(`/api/registry/priest-changes/${id}/`, data);
export const deletePriestChange = (id) =>
  apiClient.delete(`/api/registry/priest-changes/${id}/`);

// Register Settings APIs
export const listRegisterSettings = () =>
  apiClient.get("/api/registry/register-settings/");
export const createRegisterSettings = (data) =>
  apiClient.post("/api/registry/register-settings/create/", data);
export const updateRegisterSettings = (type, data) =>
  apiClient.patch(`/api/registry/register-settings/${type}/`, data);

// Events APIs
export const listEvents = () => apiClient.get("/api/registry/events/");
export const createEvent = (data) =>
  apiClient.post("/api/registry/events/", data);
export const getEvent = (id) => apiClient.get(`/api/registry/events/${id}/`);
export const updateEvent = (id, data) =>
  apiClient.patch(`/api/registry/events/${id}/`, data);
export const deleteEvent = (id) =>
  apiClient.delete(`/api/registry/events/${id}/`);

// Diocese APIs
export const listDioceses = () => apiClient.get("/api/registry/dioceses/");
export const createDiocese = (data) =>
  apiClient.post("/api/registry/dioceses/", data);
export const getDiocese = (id) =>
  apiClient.get(`/api/registry/dioceses/${id}/`);
export const updateDiocese = (id, data) =>
  apiClient.patch(`/api/registry/dioceses/${id}/`, data);
export const deleteDiocese = (id) =>
  apiClient.delete(`/api/registry/dioceses/${id}/`);


//Offering APIS
export const listOfferings = () => apiClient.get("/api/registry/offerings/");
export const createOffering = (data) =>
  apiClient.post("/api/registry/offerings/", data);
export const getOffering = (id) =>
  apiClient.get(`/api/registry/offerings/${id}/`);
export const updateOffering = (id, data) =>
  apiClient.patch(`/api/registry/offerings/${id}/`, data);
export const deleteOffering = (id) =>
  apiClient.delete(`/api/registry/offerings/${id}/`);


// Visitor Master APIs
export const listVisitors = () => apiClient.get("/api/registry/visitors/");
export const createVisitor = (data) =>
  apiClient.post("/api/registry/visitors/", data);
export const getVisitor = (id) =>
  apiClient.get(`/api/registry/visitors/${id}/`);
export const updateVisitor = (id, data) =>
  apiClient.patch(`/api/registry/visitors/${id}/`, data);
export const deleteVisitor = (id) =>
  apiClient.delete(`/api/registry/visitors/${id}/`);


// Subscription APIs
export const listSubscriptions = () =>
  apiClient.get("/api/registry/subscriptions/");
export const createSubscription = (data) =>
  apiClient.post("/api/registry/subscriptions/", data);
export const getSubscription = (id) =>
  apiClient.get(`/api/registry/subscriptions/${id}/`);
export const updateSubscription = (id, data) =>
  apiClient.patch(`/api/registry/subscriptions/${id}/`, data);
export const deleteSubscription = (id) =>
  apiClient.delete(`/api/registry/subscriptions/${id}/`);


// Account Group Master APIs
export const listAccountGroups = () =>
  apiClient.get("/api/registry/account-groups/");
export const createAccountGroup = (data) =>
  apiClient.post("/api/registry/account-groups/", data);
export const getAccountGroup = (id) =>
  apiClient.get(`/api/registry/account-groups/${id}/`);
export const updateAccountGroup = (id, data) =>
  apiClient.patch(`/api/registry/account-groups/${id}/`, data);
export const deleteAccountGroup = (id) =>
  apiClient.delete(`/api/registry/account-groups/${id}/`);


// Account Ledger Master APIs
export const listAccountLedgers = () =>
  apiClient.get("/api/registry/account-ledgers/");
export const createAccountLedger = (data) =>
  apiClient.post("/api/registry/account-ledgers/", data);
export const getAccountLedger = (id) =>
  apiClient.get(`/api/registry/account-ledgers/${id}/`);
export const updateAccountLedger = (id, data) =>
  apiClient.patch(`/api/registry/account-ledgers/${id}/`, data);
export const deleteAccountLedger = (id) =>
  apiClient.delete(`/api/registry/account-ledgers/${id}/`);

// Payment Master APIs
export const listPayments = () => apiClient.get("/api/registry/payments/");
export const createPayment = (data) =>
  apiClient.post("/api/registry/payments/", data);
export const getPayment = (id) =>
  apiClient.get(`/api/registry/payments/${id}/`);
export const updatePayment = (id, data) =>
  apiClient.patch(`/api/registry/payments/${id}/`, data);
export const deletePayment = (id) =>
  apiClient.delete(`/api/registry/payments/${id}/`);


// Qurbana Receipts APIs
export const listQurbanaReceipts = () =>
  apiClient.get("/api/registry/qurbana-receipts/");
export const createQurbanaReceipt = (data) =>
  apiClient.post("/api/registry/qurbana-receipts/", data);
export const updateQurbanaReceipt = (id, data) =>
  apiClient.patch(`/api/registry/qurbana-receipts/${id}/`, data);
export const deleteQurbanaReceipt = (id) =>
  apiClient.delete(`/api/registry/qurbana-receipts/${id}/`);

// Committee Master APIs
export const listCommittees = () => apiClient.get("/api/registry/committees/");
export const createCommittee = (data) =>
  apiClient.post("/api/registry/committees/", data);
export const updateCommittee = (id, data) =>
  apiClient.patch(`/api/registry/committees/${id}/`, data);
export const deleteCommittee = (id) =>
  apiClient.delete(`/api/registry/committees/${id}/`);

// Committee Member APIs
export const listCommitteeMembers = () =>
  apiClient.get("/api/registry/committee-members/");
export const createCommitteeMember = (data) =>
  apiClient.post("/api/registry/committee-members/", data);
export const updateCommitteeMember = (id, data) =>
  apiClient.patch(`/api/registry/committee-members/${id}/`, data);
export const deleteCommitteeMember = (id) =>
  apiClient.delete(`/api/registry/committee-members/${id}/`); 