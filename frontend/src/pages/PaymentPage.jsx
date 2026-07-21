import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
  listAccountLedgers,
} from "../api/registryServices";

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

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await listAccountLedgers();
        setLedgers(res.data || []);
      } catch (err) {
        console.error("Error fetching ledgers:", err);
      }
    };
    fetchOptions();
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

  return (
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
    />
  );
};

export default PaymentPage; 