// src/admin/pages/BillsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const BillsPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [churches, setChurches] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [itemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBillData, setNewBillData] = useState({
    church_id: "",
    package_id: "",
    billing_cycle: "MONTHLY",
    duration_months: "12",
  });

  const primaryMaroon = "#ae2050";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [billsData, churchesData, packagesData] = await Promise.all([
        adminApi.getBills(),
        adminApi.getChurches(),
        adminApi.getPackages(),
      ]);
      setBills(billsData.data || billsData || []);
      setChurches(churchesData.data || churchesData || []);
      setPackages(packagesData.results || packagesData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toaster.create({
        title: "Error",
        description: "Failed to load billing data.",
        type: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (billId) => {
    try {
      await adminApi.markBillPaid(billId);
      toaster.create({
        title: "Success",
        description: "Bill marked as paid. Church activated.",
        type: "success",
        duration: 3000,
      });
      fetchData();
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to mark bill as paid.",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleCreateBill = async () => {
    if (!newBillData.church_id || !newBillData.package_id) {
      toaster.create({
        title: "Error",
        description: "Please select both church and package.",
        type: "error",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.createSubscription({
        church_id: parseInt(newBillData.church_id),
        package_id: parseInt(newBillData.package_id),
        billing_cycle: newBillData.billing_cycle,
        duration_months: parseInt(newBillData.duration_months),
      });
      
      toaster.create({
        title: "Success",
        description: "Bill created successfully for the church.",
        type: "success",
        duration: 3000,
      });
      
      setShowModal(false);
      setNewBillData({
        church_id: "",
        package_id: "",
        billing_cycle: "MONTHLY",
        duration_months: "12",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating bill:", error);
      toaster.create({
        title: "Error",
        description: error.response?.data?.error || "Failed to create bill.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch = (bill.church_name || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedBills = filteredBills.slice(indexOfFirstItem, indexOfLastItem);

  // Stats
  const totalRevenue = bills
    .filter(b => b.status === "PAID")
    .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  
  const pendingBills = bills.filter(b => b.status === "PENDING" || b.status === "UNPAID");
  const paidBills = bills.filter(b => b.status === "PAID");

  const getStatusBadge = (status) => {
    const statusMap = {
      PAID: { color: "green", label: "Paid" },
      UNPAID: { color: "red", label: "Unpaid" },
      PENDING: { color: "orange", label: "Pending" },
      EXPIRED: { color: "gray", label: "Expired" },
    };
    const s = statusMap[status] || { color: "gray", label: status };
    return `<span class="badge badge-${s.color}">${s.label}</span>`;
  };

  // Helper function to render status badges as HTML
  const renderStatusBadge = (status) => {
    const statusMap = {
      PAID: { color: "green", label: "Paid" },
      UNPAID: { color: "red", label: "Unpaid" },
      PENDING: { color: "orange", label: "Pending" },
      EXPIRED: { color: "gray", label: "Expired" },
    };
    const s = statusMap[status] || { color: "gray", label: status };
    return `<span style="background: ${s.color === 'green' ? '#48bb78' : s.color === 'red' ? '#fc8181' : s.color === 'orange' ? '#ed8936' : '#a0aec0'}; color: white; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600;">${s.label}</span>`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
            <div style={{ border: "4px solid #e2e8f0", borderTop: "4px solid #ae2050", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ fontSize: "12px", color: "#a0aec0", fontWeight: "600", marginBottom: "4px", letterSpacing: "0.5px" }}>
          Finance / Bills
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#333" }}>Billing Management</h1>
            <p style={{ color: "#718096", fontSize: "14px" }}>Manage invoices, payments, and assign packages to churches.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: primaryMaroon,
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            + Create Bill
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "150px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#a0aec0", textTransform: "uppercase" }}>Total Revenue</p>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#333" }}>${totalRevenue.toFixed(2)}</h2>
            <p style={{ fontSize: "12px", color: "#a0aec0" }}>All time</p>
          </div>
          <div style={{ flex: "1", minWidth: "150px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#a0aec0", textTransform: "uppercase" }}>Pending Bills</p>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#333" }}>{pendingBills.length}</h2>
            <p style={{ fontSize: "12px", color: "#a0aec0" }}>Awaiting payment</p>
          </div>
          <div style={{ flex: "1", minWidth: "150px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#a0aec0", textTransform: "uppercase" }}>Paid Bills</p>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#333" }}>{paidBills.length}</h2>
            <p style={{ fontSize: "12px", color: "#a0aec0" }}>Completed</p>
          </div>
          <div style={{ flex: "1", minWidth: "150px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#a0aec0", textTransform: "uppercase" }}>Total Bills</p>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#333" }}>{bills.length}</h2>
            <p style={{ fontSize: "12px", color: "#a0aec0" }}>Total invoices</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ position: "relative", maxWidth: "300px", flex: "1" }}>
              <input
                type="text"
                placeholder="Search by church..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 36px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  fontSize: "14px",
                  height: "36px",
                  background: "#f7fafc"
                }}
              />
              <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#a0aec0" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                fontSize: "14px",
                width: "150px",
                borderRadius: "6px",
                background: "#f7fafc",
                border: "1px solid #e2e8f0",
                padding: "6px 10px",
                height: "36px",
                color: "#333"
              }}
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PENDING">Pending</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Bills Table */}
          <div style={{ overflowX: "auto" }}>
            {paginatedBills.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px" }}>
                <p style={{ color: "#a0aec0" }}>No bills found. Create a new bill to assign a package.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f7fafc" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#718096", textTransform: "uppercase" }}>Church</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#718096", textTransform: "uppercase" }}>Package</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#718096", textTransform: "uppercase" }}>Amount</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#718096", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#718096", textTransform: "uppercase" }}>Created</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#718096", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBills.map((bill) => (
                    <tr key={bill.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: "600", color: "#333", fontSize: "14px" }}>{bill.church_name}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#9f7aea", color: "white", padding: "2px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>{bill.package_name || "N/A"}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: "bold", color: "#333", fontSize: "14px" }}>${parseFloat(bill.amount).toFixed(2)}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }} dangerouslySetInnerHTML={{ __html: renderStatusBadge(bill.status) }} />
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "14px", color: "#718096" }}>{new Date(bill.created_at).toLocaleDateString()}</span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => navigate(`/admin/bills/${bill.id}`)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#4299e1",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                              padding: "4px 8px",
                              borderRadius: "4px"
                            }}
                          >
                            View
                          </button>
                          {(bill.status === "UNPAID" || bill.status === "PENDING") && (
                            <button
                              onClick={() => handleMarkPaid(bill.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#48bb78",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "500",
                                padding: "4px 8px",
                                borderRadius: "4px"
                              }}
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredBills.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "14px", color: "#a0aec0", fontWeight: "500" }}>{filteredBills.length} bills</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "transparent",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    color: currentPage === 1 ? "#a0aec0" : "#4a5568"
                  }}
                >
                  {"<<"}
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "transparent",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    color: currentPage === 1 ? "#a0aec0" : "#4a5568"
                  }}
                >
                  {"<"}
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: currentPage === page ? primaryMaroon : "#e2e8f0",
                      background: currentPage === page ? primaryMaroon : "transparent",
                      color: currentPage === page ? "white" : "#4a5568",
                      cursor: "pointer",
                      fontWeight: currentPage === page ? "700" : "500",
                      fontSize: "14px"
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "transparent",
                    cursor: currentPage === totalPages || totalPages === 0 ? "not-allowed" : "pointer",
                    color: currentPage === totalPages || totalPages === 0 ? "#a0aec0" : "#4a5568"
                  }}
                >
                  {">"}
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "transparent",
                    cursor: currentPage === totalPages || totalPages === 0 ? "not-allowed" : "pointer",
                    color: currentPage === totalPages || totalPages === 0 ? "#a0aec0" : "#4a5568"
                  }}
                >
                  {">>"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Bill Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#333" }}>Create New Bill</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#718096" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#333", display: "block", marginBottom: "4px" }}>
                  Select Church *
                </label>
                <select
                  value={newBillData.church_id}
                  onChange={(e) => setNewBillData({ ...newBillData, church_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "14px",
                    background: "white"
                  }}
                >
                  <option value="">Select a church</option>
                  {churches.map((church) => (
                    <option key={church.id} value={church.id}>
                      {church.name} {church.is_active ? "(Active)" : "(Inactive)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#333", display: "block", marginBottom: "4px" }}>
                  Select Package *
                </label>
                <select
                  value={newBillData.package_id}
                  onChange={(e) => setNewBillData({ ...newBillData, package_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "14px",
                    background: "white"
                  }}
                >
                  <option value="">Select a package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - ${pkg.rate_per_member_monthly}/mo
                      {pkg.member_limit && ` (Limit: ${pkg.member_limit})`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "14px", fontWeight: "600", color: "#333", display: "block", marginBottom: "4px" }}>
                    Billing Cycle *
                  </label>
                  <select
                    value={newBillData.billing_cycle}
                    onChange={(e) => setNewBillData({ ...newBillData, billing_cycle: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "14px",
                      background: "white"
                    }}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "14px", fontWeight: "600", color: "#333", display: "block", marginBottom: "4px" }}>
                    Duration *
                  </label>
                  <select
                    value={newBillData.duration_months}
                    onChange={(e) => setNewBillData({ ...newBillData, duration_months: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "14px",
                      background: "white"
                    }}
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBill}
                disabled={isSubmitting}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: primaryMaroon,
                  color: "white",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                  fontSize: "14px"
                }}
              >
                {isSubmitting ? "Creating..." : "Create Bill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BillsPage;