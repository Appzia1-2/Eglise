import React, { useState, useEffect, useRef } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
  listAccountLedgers,
} from "../api/registryServices";
import { Box, Button, HStack, Flex, Spacer } from "@chakra-ui/react";
import { LuPrinter } from "react-icons/lu";
import apiClient from "../api/apiClient";

const PAYMENT_MODE_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "CHEQUE", label: "Cheque" },
];

const PAYMENT_COLUMNS = [
  { header: "Voucher No", key: "voucher_number" },
  { header: "Date", key: "payment_date" },
  { header: "Mode", key: "payment_mode" },
  { header: "Ledger", key: "account_ledger_name" },
  { header: "Amount", key: "amount" },
  { header: "Status", key: "status_label" },
];

const PaymentPage = () => {
  const [ledgers, setLedgers] = useState([]);
  const [churchName, setChurchName] = useState("");
  const [printData, setPrintData] = useState(null);
  const [printMode, setPrintMode] = useState(null);
  const printContentRef = useRef(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [lRes, churchRes] = await Promise.all([
          listAccountLedgers(),
          apiClient.get("/api/registry/my-church/"),
        ]);
        setLedgers(lRes.data || []);
        setChurchName(churchRes.data?.name || "");
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchOptions();
  }, []);

  // Add print styles to the page
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 40px;
          background: white;
        }
        .no-print {
          display: none !important;
        }
        .print-header {
          text-align: center;
          border-bottom: 2px solid #7b0d1e;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .print-header h1 {
          color: #7b0d1e;
          font-size: 20px;
          margin: 0;
        }
        .print-header p {
          color: #666;
          font-size: 12px;
          margin: 5px 0 0 0;
        }
        .print-details {
          margin: 20px 0;
        }
        .print-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .print-details td {
          padding: 8px 4px;
          border-bottom: 1px solid #eee;
        }
        .print-details td.label {
          font-weight: bold;
          width: 30%;
          color: #555;
        }
        .print-details td.value {
          width: 70%;
        }
        .print-footer {
          margin-top: 30px;
          text-align: center;
          font-size: 11px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .print-status {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 3px;
          font-weight: bold;
          font-size: 12px;
        }
        .print-status-active {
          background: #c6f6d5;
          color: #22543d;
        }
        .print-status-cancelled {
          background: #fed7d7;
          color: #9b2c2c;
        }
        .print-amount {
          font-size: 18px;
          font-weight: bold;
          color: #7b0d1e;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .print-table th {
          background: #7b0d1e;
          color: white;
          padding: 10px 8px;
          text-align: left;
          font-size: 13px;
        }
        .print-table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .print-table tr:nth-child(even) {
          background: #f8f8f8;
        }
        .print-total-row {
          background: #f0f0f0;
          font-weight: bold;
        }
        .print-total-row td {
          border-top: 2px solid #7b0d1e;
          padding: 10px 8px;
        }
        .print-status-badge {
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: bold;
          font-size: 10px;
        }
        .print-status-badge-active {
          background: #c6f6d5;
          color: #22543d;
        }
        .print-status-badge-cancelled {
          background: #fed7d7;
          color: #9b2c2c;
        }
        .print-amount-col {
          text-align: right;
          font-weight: bold;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const paymentFields = [
    {
      name: "voucher_number",
      label: "Voucher Number",
      type: "number",
      required: true,
      coerce: Number,
    },
    { name: "ref_no", label: "Ref No", type: "number", coerce: Number },
    {
      name: "payment_date",
      label: "Payment Date",
      type: "date",
      required: true,
    },
    { name: "party_name", label: "Party Name", required: true },
    {
      name: "payment_mode",
      label: "Payment Mode",
      type: "select",
      required: true,
      options: PAYMENT_MODE_OPTIONS,
    },
    {
      name: "account_ledger",
      label: "Account Ledger",
      type: "select",
      required: true,
      options: ledgers.map((l) => ({ value: l.id, label: l.ledger_name })),
      coerce: Number,
    },
    {
      name: "amount",
      label: "Amount",
      type: "number",
      required: true,
      coerce: Number,
    },
    { name: "narration", label: "Narration", type: "textarea", fullWidth: true },
    { name: "is_cancelled", label: "Cancelled", type: "checkbox" },
  ];

  const listPaymentsEnriched = async () => {
    try {
      const [pRes, lRes] = await Promise.all([
        listPayments(),
        listAccountLedgers(),
      ]);
      const payments = pRes.data || [];
      const ledgersLocal = lRes.data || [];

      const mapped = payments.map((p) => {
        const ledgerObj = ledgersLocal.find(
          (l) => l.id === (p.account_ledger?.id || p.account_ledger),
        );
        return {
          ...p,
          account_ledger_name:
            p.account_ledger_name || ledgerObj?.ledger_name || "—",
          status_label: p.is_cancelled ? "Cancelled" : "Active",
        };
      });
      return { ...pRes, data: mapped };
    } catch (error) {
      console.error("Error enriching payments:", error);
      return listPayments();
    }
  };

  // Individual Print Handler - prints directly
  const handlePrintIndividual = (item) => {
    setPrintData({ type: 'individual', data: item });
    setPrintMode('individual');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintData(null);
        setPrintMode(null);
      }, 500);
    }, 100);
  };

  // Print All Handler - prints directly
  const handlePrintAll = async () => {
    try {
      const response = await listPaymentsEnriched();
      const allPayments = response.data || [];
      setPrintData({ type: 'all', data: allPayments });
      setPrintMode('all');
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          setPrintData(null);
          setPrintMode(null);
        }, 500);
      }, 100);
    } catch (error) {
      console.error("Error printing all payments:", error);
      alert("Error printing all payments: " + error.message);
    }
  };

  // Custom actions for individual print
  const extraActions = [
    {
      label: "Print",
      icon: LuPrinter,
      color: "purple.500",
      title: "Print Payment Receipt",
      onClick: handlePrintIndividual,
    },
  ];

  // Custom top content with Print All button positioned with flex
  const topContent = (
    <Flex mb={4} className="no-print" alignItems="center" justifyContent="space-between">
      <Box>
        {/* This space is for the Add Payment button that's already in RegistryTable */}
      </Box>
     <Button
  leftIcon={<LuPrinter />}
  variant="outline"
  borderColor="black"
  color="black"
  size="sm"
  _hover={{
    bg: "transparent",
    borderColor: "black",
    color: "black",
  }}
  onClick={handlePrintAll}
>
  Print All Payments
</Button>
    </Flex>
  );

  // Render print content
  const renderPrintContent = () => {
    if (!printData) return null;

    if (printData.type === 'individual') {
      const item = printData.data;
      return (
        <div className="print-content" ref={printContentRef}>
          <div className="print-header">
            <h1>{churchName || "Church Name"}</h1>
            <p>Payment Receipt</p>
            <p style={{ fontSize: '10px', color: '#999' }}>Printed: {new Date().toLocaleString()}</p>
          </div>
          
          <div className="print-details">
            <table>
              <tbody>
                <tr>
                  <td className="label">Voucher Number</td>
                  <td className="value">{item.voucher_number || "—"}</td>
                </tr>
                <tr>
                  <td className="label">Payment Date</td>
                  <td className="value">{item.payment_date || "—"}</td>
                </tr>
                <tr>
                  <td className="label">Party Name</td>
                  <td className="value"><strong>{item.party_name || "—"}</strong></td>
                </tr>
                <tr>
                  <td className="label">Payment Mode</td>
                  <td className="value">{item.payment_mode || "—"}</td>
                </tr>
                <tr>
                  <td className="label">Account Ledger</td>
                  <td className="value">{item.account_ledger_name || "—"}</td>
                </tr>
                <tr>
                  <td className="label">Amount</td>
                  <td className="value print-amount">₹{item.amount || 0}</td>
                </tr>
                <tr>
                  <td className="label">Status</td>
                  <td className="value">
                    <span className={`print-status ${item.is_cancelled ? 'print-status-cancelled' : 'print-status-active'}`}>
                      {item.status_label || "Active"}
                    </span>
                  </td>
                </tr>
                {item.narration && (
                  <tr>
                    <td className="label">Narration</td>
                    <td className="value">{item.narration}</td>
                  </tr>
                )}
                {item.ref_no && (
                  <tr>
                    <td className="label">Reference No</td>
                    <td className="value">{item.ref_no}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="print-footer">
            <p>This is a computer-generated receipt.</p>
            <p>Printed from {churchName || "Church"} Payment System</p>
          </div>
        </div>
      );
    }

    if (printData.type === 'all') {
      const allPayments = printData.data;
      return (
        <div className="print-content" ref={printContentRef}>
          <div className="print-header">
            <h1>{churchName || "Church Name"}</h1>
            <p>Complete Payments List</p>
            <p style={{ fontSize: '10px', color: '#999' }}>Printed: {new Date().toLocaleString()}</p>
            <p style={{ fontSize: '11px', color: '#666' }}>Total Payments: {allPayments.length}</p>
          </div>
          
          <table className="print-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Party Name</th>
                <th>Mode</th>
                <th>Ledger</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((item, index) => (
                <tr key={index}>
                  <td>{item.voucher_number || "—"}</td>
                  <td>{item.payment_date || "—"}</td>
                  <td><strong>{item.party_name || "—"}</strong></td>
                  <td>{item.payment_mode || "—"}</td>
                  <td>{item.account_ledger_name || "—"}</td>
                  <td className="print-amount-col">₹{item.amount || 0}</td>
                  <td>
                    <span className={`print-status-badge ${item.is_cancelled ? 'print-status-badge-cancelled' : 'print-status-badge-active'}`}>
                      {item.status_label || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="print-total-row">
                <td colSpan="5" style={{ textAlign: 'right' }}>Total Amount:</td>
                <td className="print-amount-col">₹{allPayments.reduce((sum, item) => sum + (item.amount || 0), 0)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          
          <div className="print-footer">
            <p>This is a computer-generated report.</p>
            <p>Printed from {churchName || "Church"} Payment System</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <RegistryTable
        title="Payments"
        addLabel="Add Payment"
        nameKey="party_name"
        columns={PAYMENT_COLUMNS}
        columnLabel="Party Name"
        emptyMessage="No payments found."
        listFn={listPaymentsEnriched}
        createFn={createPayment}
        updateFn={updatePayment}
        deleteFn={deletePayment}
        fields={paymentFields}
        extraActions={extraActions}
        topContent={topContent}
        isMaster={true} 
      />
      {renderPrintContent()}
    </>
  );
};

export default PaymentPage;