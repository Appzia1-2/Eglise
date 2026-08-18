// frontend/src/api/registryServices.js

import apiClient from "./apiClient";

// ============================================================
// WARD APIs
// ============================================================
export const listWards = () =>
  apiClient.get("/api/registry/wards/");

export const createWard = (data) =>
  apiClient.post("/api/registry/wards/", data);

export const getWard = (id) =>
  apiClient.get(`/api/registry/wards/${id}/`);

export const updateWard = (id, data) =>
  apiClient.patch(`/api/registry/wards/${id}/`, data);

export const deleteWard = (id) =>
  apiClient.delete(`/api/registry/wards/${id}/`);

// ============================================================
// GRADE APIs
// ============================================================

export const listGrades = () =>
  apiClient.get("/api/registry/grade/");

export const createGrade = (data) =>
  apiClient.post("/api/registry/grade/", data);

export const getGrade = (id) =>
  apiClient.get(`/api/registry/grade/${id}/`);

export const updateGrade = (id, data) =>
  apiClient.patch(`/api/registry/grade/${id}/`, data);

export const deleteGrade = (id) =>
  apiClient.delete(`/api/registry/grade/${id}/`);


// ============================================================
// RELATIONSHIPS APIs
// ============================================================

export const listRelationships = () =>
  apiClient.get("/api/registry/relationships/");

export const createRelationship = (data) =>
  apiClient.post("/api/registry/relationships/", data);

export const getRelationship = (id) =>
  apiClient.get(`/api/registry/relationships/${id}/`);

export const updateRelationship = (id, data) =>
  apiClient.patch(
    `/api/registry/relationships/${id}/`,
    data
  );

export const deleteRelationship = (id) =>
  apiClient.delete(
    `/api/registry/relationships/${id}/`
  );


// ============================================================
// FAMILY MASTER
// ============================================================

// List families
export const listFamilies = () =>
  apiClient.get("/api/registry/families/");

// Create family
export const createFamily = (data) =>
  apiClient.post(
    "/api/registry/families/",
    data
  );

// Get single family
export const getFamily = (id) =>
  apiClient.get(
    `/api/registry/families/${id}/`
  );

// Update family
export const updateFamily = (id, data) =>
  apiClient.patch(
    `/api/registry/families/${id}/`,
    data
  );

// Delete family
export const deleteFamily = (id) =>
  apiClient.delete(
    `/api/registry/families/${id}/`
  );

// ============================================================
// MEMBERS / FAMILY HEAD SERVICES
// ============================================================


// ============================================================
// LIST ALL MEMBERS
// ============================================================

export const listMembers = () => {
  return apiClient.get(
    "/api/registry/members/"
  );
};


// ============================================================
// LIST MEMBERS BY FAMILY
// ============================================================

export const listFamilyMembers = (familyId) => {
  return apiClient.get(
    "/api/registry/members/",
    {
      params: {
        family: familyId,
      },
    }
  );
};


// ============================================================
// GET SINGLE MEMBER
// ============================================================

export const getMember = (id) => {
  return apiClient.get(
    `/api/registry/members/${id}/`
  );
};


// ============================================================
// CREATE NORMAL MEMBER
// ============================================================

export const createMember = (data) => {
  return apiClient.post(
    "/api/registry/members/",
    data
  );
};


// ============================================================
// CREATE FAMILY HEAD
// ============================================================
//
// IMPORTANT:
// This function accepts BOTH:
//
// 1. Normal JSON
// 2. FormData
//
// For your RegisterFamilyHeadPage,
// it will receive FormData containing:
//
// family
// ward
// grade
// house_name
// name
// ...
// family_image
//
// Do NOT convert FormData to JSON here.
//

export const createHead = (data) => {
  return apiClient.post(
    "/api/registry/members/create-head/",
    data
  );
};


// ============================================================
// UPDATE MEMBER
// ============================================================

export const updateMember = (
  id,
  data
) => {
  return apiClient.patch(
    `/api/registry/members/${id}/`,
    data
  );
};


// ============================================================
// UPDATE FAMILY HEAD
// ============================================================

export const updateHead = (
  id,
  data
) => {
  return apiClient.patch(
    `/api/registry/family-head/${id}/`,
    data
  );
};


// ============================================================
// DELETE MEMBER
// ============================================================

export const deleteMember = (id) => {
  return apiClient.delete(
    `/api/registry/members/${id}/`
  );
};


// ============================================================
// MARK MEMBER AS DECEASED
// ============================================================

export const markMemberAsDeceased = (
  id
) => {
  return apiClient.post(
    `/api/registry/members/mark-dead/${id}/`
  );
};


// ============================================================
// PROMOTE MEMBER TO FAMILY HEAD
// ============================================================

export const promoteToHead = (
  id
) => {
  return apiClient.post(
    `/api/registry/members/promote-head/${id}/`
  );
};

// ============================================================
// GET MEMBER DETAIL (with nested relationships)
// ============================================================

export const getMemberDetail = async (memberId) => {
  const response = await apiClient.get(`/api/registry/members/${memberId}/detail/`);
  return response;
};

// ============================================================
// LIST MEMBERS BY FAMILY HEAD
// ============================================================

export const listMembersByHead = (
  headId
) => {
  return apiClient.get(
    `/api/registry/members/by-head/${headId}/`
  );
};

// ============================================================
// FAMILY HEAD LIST - FOR DROPDOWN / SELECTION
// ============================================================

/**
 * List all active family heads for the current church
 * Used for dropdowns when changing a member's head
 * 
 * Uses the members endpoint with filter for family heads
 * 
 * @returns {Promise} - Array of family head objects with id, name, family_name, house_name
 */
export const listFamilyHeads = async () => {
  // Use the members list endpoint with filter for family heads
  const response = await apiClient.get("/api/registry/members/", {
    params: {
      is_family_head: true,
      is_active: true,
    }
  });
  
  // Transform the response to match expected format
  const members = response.data?.results || response.data || [];
  
  // If members is not an array, return empty array
  if (!Array.isArray(members)) {
    return { data: [] };
  }
  
  // Transform to expected format: { id, name, family_name, house_name }
  const transformedData = members.map(member => ({
    id: member.id,
    name: member.name,
    family_name: member.family?.family_name || member.family_name || "—",
    house_name: member.house_name || "—"
  }));
  
  return {
    data: transformedData,
    ...response
  };
};

// ============================================================
// DEATH REGISTER APIs
// ============================================================

export const listDeaths = (status) => {
  const url = status
    ? `/api/registry/death-register/?status=${status}`
    : "/api/registry/death-register/";

  return apiClient.get(url);
};

export const getDeath = (id) =>
  apiClient.get(
    `/api/registry/death-registers/${id}/`
  );

export const updateDeath = (id, data) =>
  apiClient.patch(
    `/api/registry/death-registers/${id}/`,
    data
  );

export const deleteDeath = (id) =>
  apiClient.delete(
    `/api/registry/death-registers/${id}/`
  );

export const createDeathRecord = (data) =>
  apiClient.post(
    "/api/registry/death-register/create/",
    data
  );


// ============================================================
// HEADLESS HOUSES
// ============================================================

export const listHeadlessHouses = () =>
  apiClient.get(
    "/api/registry/members/headless-houses/"
  );

export const listMembersByHouse = (
  familyId,
  houseName,
  houseSequence
) =>
  apiClient.get(
    "/api/registry/members/by-house/",
    {
      params: {
        family: familyId,
        house_name: houseName,
        house_sequence: houseSequence,
      },
    }
  );

// ============================================================
// BAPTISM APIs
// ============================================================

export const listBaptisms = () =>
  apiClient.get("/api/registry/baptisms/");

export const createBaptism = (data) =>
  apiClient.post(
    "/api/registry/baptisms/",
    data
  );

export const getBaptism = (id) =>
  apiClient.get(
    `/api/registry/baptisms/${id}/`
  );

export const updateBaptism = (id, data) =>
  apiClient.patch(
    `/api/registry/baptisms/${id}/`,
    data
  );

export const deleteBaptism = (id) =>
  apiClient.delete(
    `/api/registry/baptisms/${id}/`
  );


// ============================================================
// MARRIAGE PRE-ANNOUNCEMENT APIs
// ============================================================

export const listPreAnnouncements = () =>
  apiClient.get(
    "/api/registry/marriages/vilich-chollu-kuri/"
  );

export const createPreAnnouncement = (data) =>
  apiClient.post(
    "/api/registry/marriages/vilich-chollu-kuri/",
    data
  );

export const getPreAnnouncement = (id) =>
  apiClient.get(
    `/api/registry/marriages/vilich-chollu-kuri/${id}/`
  );

export const updatePreAnnouncement = (id, data) =>
  apiClient.patch(
    `/api/registry/marriages/vilich-chollu-kuri/${id}/detail/`,
    data
  );

export const deletePreAnnouncement = (id) =>
  apiClient.delete(
    `/api/registry/marriages/vilich-chollu-kuri/${id}/`
  );


// ============================================================
// MARRIAGE APIs
// ============================================================

export const listMarriages = () =>
  apiClient.get("/api/registry/marriages/");

export const createMarriage = (data) =>
  apiClient.post(
    "/api/registry/marriages/",
    data
  );

export const getMarriage = (id) =>
  apiClient.get(
    `/api/registry/marriages/${id}/`
  );

export const updateMarriage = (id, data) =>
  apiClient.patch(
    `/api/registry/marriages/${id}/`,
    data
  );

export const deleteMarriage = (id) =>
  apiClient.delete(
    `/api/registry/marriages/${id}/`
  );


// ============================================================
// DHESHA KURI
// ============================================================

export const getDheshaKuri = (id) =>
  apiClient.get(
    `/api/registry/marriages/${id}/dhesha-kuri`
  );


// ============================================================
// DESIGNATION APIs
// ============================================================

export const listDesignations = () =>
  apiClient.get("/api/registry/designations/");

export const createDesignation = (data) =>
  apiClient.post(
    "/api/registry/designations/",
    data
  );

export const getDesignation = (id) =>
  apiClient.get(
    `/api/registry/designations/${id}/`
  );

export const updateDesignation = (id, data) =>
  apiClient.patch(
    `/api/registry/designations/${id}/`,
    data
  );

export const deleteDesignation = (id) =>
  apiClient.delete(
    `/api/registry/designations/${id}/`
  );

// ============================================================
// PRIEST / VICAR MASTER
// ============================================================

export const getPriestMaster = async () => {
  const response = await apiClient.get(
    "/api/registry/priests/"
  );

  return response;
};


// ============================================================
// PRIEST DROPDOWN
// ============================================================

export const getPriestDropdown = async () => {
  const response = await apiClient.get(
    "/api/registry/priests/dropdown/"
  );

  return response;
};


// ============================================================
// REGISTER NEW VICAR
// ============================================================

export const createVicar = async (formData) => {
  const response = await apiClient.post(
    "/api/registry/priests/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response;
};

// ============================================================
// UPDATE VICAR
// ============================================================

export const updateVicar = (id, formData) => {
  return apiClient.patch(
    `/api/registry/priests/${id}/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};



// ============================================================
// REGISTER SETTINGS
// ============================================================

export const listRegisterSettings = () =>
  apiClient.get(
    "/api/registry/register-settings/"
  );

export const createRegisterSettings = (data) =>
  apiClient.post(
    "/api/registry/register-settings/create/",
    data
  );

export const updateRegisterSettings = (
  type,
  data
) =>
  apiClient.patch(
    `/api/registry/register-settings/${type}/`,
    data
  );


// ============================================================
// EVENTS
// ============================================================

export const listEvents = () =>
  apiClient.get("/api/registry/events/");

export const createEvent = (data) =>
  apiClient.post(
    "/api/registry/events/",
    data
  );

export const getEvent = (id) =>
  apiClient.get(
    `/api/registry/events/${id}/`
  );

export const updateEvent = (id, data) =>
  apiClient.patch(
    `/api/registry/events/${id}/`,
    data
  );

export const deleteEvent = (id) =>
  apiClient.delete(
    `/api/registry/events/${id}/`
  );


// ============================================================
// OFFERINGS
// ============================================================

export const listOfferings = () =>
  apiClient.get("/api/registry/offerings/");

export const createOffering = (data) =>
  apiClient.post(
    "/api/registry/offerings/",
    data
  );

export const getOffering = (id) =>
  apiClient.get(
    `/api/registry/offerings/${id}/`
  );

export const updateOffering = (id, data) =>
  apiClient.patch(
    `/api/registry/offerings/${id}/`,
    data
  );

export const deleteOffering = (id) =>
  apiClient.delete(
    `/api/registry/offerings/${id}/`
  );


// ============================================================
// VISITORS
// ============================================================

export const listVisitors = () =>
  apiClient.get("/api/registry/visitors/");

export const createVisitor = (data) =>
  apiClient.post(
    "/api/registry/visitors/",
    data
  );

export const getVisitor = (id) =>
  apiClient.get(
    `/api/registry/visitors/${id}/`
  );

export const updateVisitor = (id, data) =>
  apiClient.patch(
    `/api/registry/visitors/${id}/`,
    data
  );

export const deleteVisitor = (id) =>
  apiClient.delete(
    `/api/registry/visitors/${id}/`
  );


// ============================================================
// SUBSCRIPTIONS
// ============================================================

export const listSubscriptions = () =>
  apiClient.get(
    "/api/registry/subscriptions/"
  );

export const createSubscription = (data) =>
  apiClient.post(
    "/api/registry/subscriptions/",
    data
  );

export const getSubscription = (id) =>
  apiClient.get(
    `/api/registry/subscriptions/${id}/`
  );

export const updateSubscription = (
  id,
  data
) =>
  apiClient.patch(
    `/api/registry/subscriptions/${id}/`,
    data
  );

export const deleteSubscription = (id) =>
  apiClient.delete(
    `/api/registry/subscriptions/${id}/`
  );


// ============================================================
// ACCOUNT GROUPS
// ============================================================

export const listAccountGroups = () =>
  apiClient.get(
    "/api/registry/account-groups/"
  );

export const createAccountGroup = (data) =>
  apiClient.post(
    "/api/registry/account-groups/",
    data
  );

export const getAccountGroup = (id) =>
  apiClient.get(
    `/api/registry/account-groups/${id}/`
  );

export const updateAccountGroup = (
  id,
  data
) =>
  apiClient.patch(
    `/api/registry/account-groups/${id}/`,
    data
  );

export const deleteAccountGroup = (id) =>
  apiClient.delete(
    `/api/registry/account-groups/${id}/`
  );


// ============================================================
// ACCOUNT LEDGERS
// ============================================================

export const listAccountLedgers = () =>
  apiClient.get(
    "/api/registry/account-ledgers/"
  );

export const createAccountLedger = (data) =>
  apiClient.post(
    "/api/registry/account-ledgers/",
    data
  );

export const getAccountLedger = (id) =>
  apiClient.get(
    `/api/registry/account-ledgers/${id}/`
  );

export const updateAccountLedger = (
  id,
  data
) =>
  apiClient.patch(
    `/api/registry/account-ledgers/${id}/`,
    data
  );

export const deleteAccountLedger = (id) =>
  apiClient.delete(
    `/api/registry/account-ledgers/${id}/`
  );


// ============================================================
// PAYMENTS
// ============================================================

export const listPayments = () =>
  apiClient.get(
    "/api/registry/payments/"
  );

export const createPayment = (data) =>
  apiClient.post(
    "/api/registry/payments/",
    data
  );

export const getPayment = (id) =>
  apiClient.get(
    `/api/registry/payments/${id}/`
  );

export const updatePayment = (
  id,
  data
) =>
  apiClient.patch(
    `/api/registry/payments/${id}/`,
    data
  );

export const deletePayment = (id) =>
  apiClient.delete(
    `/api/registry/payments/${id}/`
  );


// ============================================================
// QURBANA RECEIPTS
// ============================================================

export const listQurbanaReceipts = () =>
  apiClient.get(
    "/api/registry/qurbana-receipts/"
  );

export const createQurbanaReceipt = (data) =>
  apiClient.post(
    "/api/registry/qurbana-receipts/",
    data
  );

export const updateQurbanaReceipt = (
  id,
  data
) =>
  apiClient.patch(
    `/api/registry/qurbana-receipts/${id}/`,
    data
  );

export const deleteQurbanaReceipt = (id) =>
  apiClient.delete(
    `/api/registry/qurbana-receipts/${id}/`
  );


// ============================================================
// COMMITTEES
// ============================================================

export const listCommittees = () =>
  apiClient.get(
    "/api/registry/committees/"
  );

export const createCommittee = (data) =>
  apiClient.post(
    "/api/registry/committees/",
    data
  );

export const updateCommittee = (
  id,
  data
) =>
  apiClient.patch(
    `/api/registry/committees/${id}/`,
    data
  );

export const deleteCommittee = (id) =>
  apiClient.delete(
    `/api/registry/committees/${id}/`
  );


// ============================================================
// COMMITTEE MEMBERS
// ============================================================

export const listCommitteeMembers = () =>
  apiClient.get(
    "/api/registry/committee-members/"
  );

export const createCommitteeMember = (
  data
) =>
  apiClient.post(
    "/api/registry/committee-members/",
    data
  );

export const updateCommitteeMember = (
  id,
  data
) =>
  apiClient.patch(
    `/api/registry/committee-members/${id}/`,
    data
  );

export const deleteCommitteeMember = (
  id
) =>
  apiClient.delete(
    `/api/registry/committee-members/${id}/`
  );


// ============================================================
// MEMBER DIRECTORY
// ============================================================

export const listMemberDirectory = (
  params = {}
) =>
  apiClient.get(
    "/api/registry/members/directory/",
    { params }
  );

export const listMemberAgeWise = (
  params = {}
) =>
  apiClient.get(
    "/api/registry/members/age-wise/",
    { params }
  );

export const listMemberPhoneDirectory = (
  params = {}
) =>
  apiClient.get(
    "/api/registry/members/phone-directory/",
    { params }
  );

export const listWaitingListMembers = () =>
  apiClient.get(
    "/api/registry/members/waiting-list/"
  );

export const transferAndPromoteHead = (
  id,
  data
) =>
  apiClient.post(
    `/api/registry/members/transfer-promote/${id}/`,
    data
  );

// ============================================================
// CHANGE MEMBER'S FAMILY HEAD
// ============================================================

/**
 * Change a member's family head
 * @param {number} memberId - The ID of the member to transfer
 * @param {number} newHeadId - The ID of the new family head
 * @returns {Promise} - API response
 */
export const changeMemberHead = (
  memberId,
  newHeadId
) =>
  apiClient.post(
    `/api/registry/members/change-head/${memberId}/`,
    {
      head: newHeadId,
    }
  );