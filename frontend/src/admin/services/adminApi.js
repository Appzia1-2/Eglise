// src/admin/services/adminApi.js
import apiClient from "../../api/apiClient";

const getAdminToken = () => localStorage.getItem("admin_token");

const adminApi = {
  // ============ DASHBOARD ============
  getDashboardStats: async () => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/dashboard/stats/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Dashboard Stats:", error.response?.data || error.message);
      throw error;
    }
  },

  // ============ DIOCESE ============
  getDioceses: async () => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/dioceses/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Dioceses:", error.response?.data || error.message);
      throw error;
    }
  },

  getDioceseDetail: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get(`/api/admin/dioceses/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Diocese Detail:", error.response?.data || error.message);
      throw error;
    }
  },

  createDiocese: async (data) => {
    try {
      const token = getAdminToken();
      const payload = {
        name: data.name,
        metropolitan_name: data.metropolitan_name || '',
        email: data.email,
        phone_number: data.phone_number || '',
        address_line1: data.address_line1 || '',
        address_line2: data.address_line2 || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        postal_code: data.postal_code || '',
        website: data.website || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
      };
      const response = await apiClient.post("/api/admin/dioceses/create/", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Create Diocese:", error.response?.data || error.message);
      throw error;
    }
  },

  updateDiocese: async (id, data) => {
    try {
      const token = getAdminToken();
      const payload = {};
      
      if (data.name !== undefined) payload.name = data.name;
      if (data.metropolitan_name !== undefined) payload.metropolitan_name = data.metropolitan_name;
      if (data.email !== undefined) payload.email = data.email;
      if (data.phone_number !== undefined) payload.phone_number = data.phone_number;
      if (data.address_line1 !== undefined) payload.address_line1 = data.address_line1;
      if (data.address_line2 !== undefined) payload.address_line2 = data.address_line2;
      if (data.city !== undefined) payload.city = data.city;
      if (data.state !== undefined) payload.state = data.state;
      if (data.country !== undefined) payload.country = data.country;
      if (data.postal_code !== undefined) payload.postal_code = data.postal_code;
      if (data.website !== undefined) payload.website = data.website;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      
      const response = await apiClient.put(`/api/admin/dioceses/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Update Diocese:", error.response?.data || error.message);
      throw error;
    }
  },

  deleteDiocese: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.delete(`/api/admin/dioceses/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Delete Diocese:", error.response?.data || error.message);
      throw error;
    }
  },

  // ============ CHURCHES ============
  getChurches: async (params = {}) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/churches/", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Churches:", error.response?.data || error.message);
      throw error;
    }
  },

  getChurchDetail: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get(`/api/admin/churches/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Church Detail:", error.response?.data || error.message);
      throw error;
    }
  },

  createChurch: async (data) => {
    try {
      const token = getAdminToken();
      
      const payload = {
        name: data.name || '',
        diocese: data.diocese || null,
        established_year: data.established_year ? parseInt(data.established_year) : null,
        registration_number: data.registration_number || '',
        currency: data.currency || '',
        address: data.address || '',
        address_line1: data.address_line1 || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        postal_code: data.postal_code || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        alternate_phone: data.alternate_phone || '',
        website: data.website || '',
        is_active: false,
      };

      console.log("Sending payload:", payload);

      const response = await apiClient.post("/api/admin/churches/create/", payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Create Church:", error.response?.data || error.message);
      throw error;
    }
  },

  updateChurch: async (id, data) => {
    try {
      const token = getAdminToken();
      const payload = {};
      
      if (data.name !== undefined) payload.name = data.name;
      if (data.diocese !== undefined) payload.diocese = data.diocese;
      if (data.established_year !== undefined) payload.established_year = data.established_year;
      if (data.registration_number !== undefined) payload.registration_number = data.registration_number;
      if (data.currency !== undefined) payload.currency = data.currency;
      if (data.address !== undefined) payload.address = data.address;
      if (data.address_line1 !== undefined) payload.address_line1 = data.address_line1;
      if (data.city !== undefined) payload.city = data.city;
      if (data.state !== undefined) payload.state = data.state;
      if (data.country !== undefined) payload.country = data.country;
      if (data.postal_code !== undefined) payload.postal_code = data.postal_code;
      if (data.email !== undefined) payload.email = data.email;
      if (data.phone_number !== undefined) payload.phone_number = data.phone_number;
      if (data.alternate_phone !== undefined) payload.alternate_phone = data.alternate_phone;
      if (data.website !== undefined) payload.website = data.website;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      
      const response = await apiClient.patch(`/api/admin/churches/${id}/`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Update Church:", error.response?.data || error.message);
      throw error;
    }
  },

  deleteChurch: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.delete(`/api/admin/churches/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Delete Church:", error.response?.data || error.message);
      throw error;
    }
  },

  activateChurch: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.post(`/api/admin/churches/${id}/activate/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Activate Church:", error.response?.data || error.message);
      throw error;
    }
  },

  suspendChurch: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.post(`/api/admin/churches/${id}/suspend/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Suspend Church:", error.response?.data || error.message);
      throw error;
    }
  },

  // ============ PACKAGES ============
  getPackages: async (params = {}) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/packages/", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Packages:", error.response?.data || error.message);
      throw error;
    }
  },

  getPackageDetail: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get(`/api/admin/packages/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Package Detail:", error.response?.data || error.message);
      throw error;
    }
  },

  createPackage: async (data) => {
    try {
      const token = getAdminToken();
      const payload = {
        name: data.name,
        member_limit: data.member_limit || null,
        rate_per_member_monthly: data.rate_per_member_monthly,
        rate_per_member_yearly: data.rate_per_member_yearly,
        is_active: data.is_active !== undefined ? data.is_active : true,
      };
      
      const response = await apiClient.post("/api/admin/packages/create/", payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Create Package:", error.response?.data || error.message);
      throw error;
    }
  },

  updatePackage: async (id, data) => {
    try {
      const token = getAdminToken();
      const payload = {};
      
      if (data.name !== undefined) payload.name = data.name;
      if (data.member_limit !== undefined) payload.member_limit = data.member_limit;
      if (data.rate_per_member_monthly !== undefined) payload.rate_per_member_monthly = data.rate_per_member_monthly;
      if (data.rate_per_member_yearly !== undefined) payload.rate_per_member_yearly = data.rate_per_member_yearly;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      
      const response = await apiClient.patch(`/api/admin/packages/${id}/`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Update Package:", error.response?.data || error.message);
      throw error;
    }
  },

  deletePackage: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.delete(`/api/admin/packages/${id}/delete/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Delete Package:", error.response?.data || error.message);
      throw error;
    }
  },

  // ============ SUBSCRIPTIONS ============
  getSubscriptions: async (params = {}) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/subscriptions/", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Subscriptions:", error.response?.data || error.message);
      throw error;
    }
  },

  getSubscriptionDetail: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get(`/api/admin/subscriptions/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Subscription Detail:", error.response?.data || error.message);
      throw error;
    }
  },

  createSubscription: async (data) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.post("/api/admin/subscriptions/create/", data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Create Subscription:", error.response?.data || error.message);
      throw error;
    }
  },

  markSubscriptionPaid: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.post(`/api/admin/subscriptions/${id}/mark-paid/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Mark Subscription Paid:", error.response?.data || error.message);
      throw error;
    }
  },

  activateSubscription: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.post(`/api/admin/subscriptions/${id}/activate/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Activate Subscription:", error.response?.data || error.message);
      throw error;
    }
  },

  cancelSubscription: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.post(`/api/admin/subscriptions/${id}/cancel/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Cancel Subscription:", error.response?.data || error.message);
      throw error;
    }
  },

  // ============ TAX TYPES ============
  getTaxTypes: async (params = {}) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/tax-types/", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Tax Types:", error.response?.data || error.message);
      throw error;
    }
  },

  getTaxTypeDetail: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get(`/api/admin/tax-types/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Tax Type Detail:", error.response?.data || error.message);
      throw error;
    }
  },

  createTaxType: async (data) => {
    try {
      const token = getAdminToken();
      const payload = {
        tax_type_code: data.tax_type_code,
        tax_type_name: data.tax_type_name,
        country: data.country || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        description: data.description || '',
      };
      
      const response = await apiClient.post("/api/admin/tax-types/create/", payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Create Tax Type:", error.response?.data || error.message);
      throw error;
    }
  },

  updateTaxType: async (id, data) => {
    try {
      const token = getAdminToken();
      const payload = {};
      
      if (data.tax_type_code !== undefined) payload.tax_type_code = data.tax_type_code;
      if (data.tax_type_name !== undefined) payload.tax_type_name = data.tax_type_name;
      if (data.country !== undefined) payload.country = data.country;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      if (data.description !== undefined) payload.description = data.description;
      
      const response = await apiClient.patch(`/api/admin/tax-types/${id}/`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Update Tax Type:", error.response?.data || error.message);
      throw error;
    }
  },

  deleteTaxType: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.delete(`/api/admin/tax-types/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Delete Tax Type:", error.response?.data || error.message);
      throw error;
    }
  },

  // ============ TAX RATES ============
  getTaxRates: async (params = {}) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/tax-rates/", {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Tax Rates:", error.response?.data || error.message);
      throw error;
    }
  },

  getTaxRateDetail: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get(`/api/admin/tax-rates/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Tax Rate Detail:", error.response?.data || error.message);
      throw error;
    }
  },

  createTaxRate: async (data) => {
  try {
    const token = getAdminToken();
    const payload = {
      tax_rate_code: data.tax_rate_code,
      tax_rate_name: data.tax_rate_name,
      tax_type_id: parseInt(data.tax_type_id), // Ensure it's an integer
      rate_percentage: parseFloat(data.rate_percentage),
      effective_from: data.effective_from,
      effective_until: data.effective_until || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      description: data.description || '',
    };
    
    console.log("📤 Sending tax rate payload:", payload);
    
    const response = await apiClient.post("/api/admin/tax-rates/create/", payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("API Error - Create Tax Rate:", error.response?.data || error.message);
    throw error;
  }
},

  updateTaxRate: async (id, data) => {
    try {
      const token = getAdminToken();
      const payload = {};
      
      if (data.tax_rate_code !== undefined) payload.tax_rate_code = data.tax_rate_code;
      if (data.tax_rate_name !== undefined) payload.tax_rate_name = data.tax_rate_name;
      if (data.tax_type_id !== undefined) payload.tax_type_id = data.tax_type_id;
      if (data.rate_percentage !== undefined) payload.rate_percentage = data.rate_percentage;
      if (data.effective_from !== undefined) payload.effective_from = data.effective_from;
      if (data.effective_until !== undefined) payload.effective_until = data.effective_until;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      if (data.description !== undefined) payload.description = data.description;
      
      const response = await apiClient.patch(`/api/admin/tax-rates/${id}/`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Update Tax Rate:", error.response?.data || error.message);
      throw error;
    }
  },

  deleteTaxRate: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.delete(`/api/admin/tax-rates/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Delete Tax Rate:", error.response?.data || error.message);
      throw error;
    }
  },

  // ============ UPGRADE REQUESTS ============
  getUpgradeRequests: async () => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/upgrade-requests/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Upgrade Requests:", error.response?.data || error.message);
      throw error;
    }
  },

  getUpgradeRequestDetail: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get(`/api/admin/upgrade-requests/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Upgrade Request Detail:", error.response?.data || error.message);
      throw error;
    }
  },

  approveUpgradeRequest: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.post(`/api/admin/upgrade-requests/${id}/approve/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Approve Upgrade:", error.response?.data || error.message);
      throw error;
    }
  },

  rejectUpgradeRequest: async (id) => {
    try {
      const token = getAdminToken();
      const response = await apiClient.post(`/api/admin/upgrade-requests/${id}/reject/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Reject Upgrade:", error.response?.data || error.message);
      throw error;
    }
  },

  // src/admin/services/adminApi.js - Add these methods

// ============ PAYMENTS (BILLS) ============
getBills: async (params = {}) => {
  try {
    const token = getAdminToken();
    const response = await apiClient.get("/api/admin/bills/", {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("API Error - Get Bills:", error.response?.data || error.message);
    throw error;
  }
},

getBillDetail: async (id) => {
  try {
    const token = getAdminToken();
    const response = await apiClient.get(`/api/admin/bills/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("API Error - Get Bill Detail:", error.response?.data || error.message);
    throw error;
  }
},

createBill: async (data) => {
  try {
    const token = getAdminToken();
    const payload = {
      church_id: data.church_id,
      subscription_id: data.subscription_id,
      bill_type: data.bill_type || 'NEW',
      billing_cycle: data.billing_cycle,
      duration_months: data.duration_months,
      amount: data.amount,
      payment_method: data.payment_method || 'CASH',
      transaction_id: data.transaction_id || '',
      note: data.note || '',
      tax_type_id: data.tax_type_id || null,
      tax_rate_id: data.tax_rate_id || null,
    };
    
    const response = await apiClient.post("/api/admin/bills/create/", payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("API Error - Create Bill:", error.response?.data || error.message);
    throw error;
  }
},

updateBill: async (id, data) => {
  try {
    const token = getAdminToken();
    const payload = {};
    
    if (data.status !== undefined) payload.status = data.status;
    if (data.payment_method !== undefined) payload.payment_method = data.payment_method;
    if (data.transaction_id !== undefined) payload.transaction_id = data.transaction_id;
    if (data.note !== undefined) payload.note = data.note;
    if (data.paid_at !== undefined) payload.paid_at = data.paid_at;
    
    const response = await apiClient.patch(`/api/admin/bills/${id}/`, payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("API Error - Update Bill:", error.response?.data || error.message);
    throw error;
  }
},

deleteBill: async (id) => {
  try {
    const token = getAdminToken();
    const response = await apiClient.delete(`/api/admin/bills/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("API Error - Delete Bill:", error.response?.data || error.message);
    throw error;
  }
},

markBillPaid: async (id) => {
  try {
    const token = getAdminToken();
    const response = await apiClient.post(`/api/admin/bills/${id}/mark-paid/`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("API Error - Mark Bill Paid:", error.response?.data || error.message);
    throw error;
  }
},

  // ============ EXPIRING CHURCHES ============
  getExpiringChurches: async () => {
    try {
      const token = getAdminToken();
      const response = await apiClient.get("/api/admin/churches/expiring/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error("API Error - Get Expiring Churches:", error.response?.data || error.message);
      throw error;
    }
  },
};

export default adminApi;