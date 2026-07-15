import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listAccountLedgers,
  createAccountLedger,
  updateAccountLedger,
  deleteAccountLedger,
  listAccountGroups,
} from "../api/registryServices";

const LEDGER_COLUMNS = [
  { header: "Ledger Code", key: "ledger_code" },
  { header: "Alias", key: "alias" },
  { header: "Account Group", key: "account_group_name" },
  { header: "Opening Balance", key: "op_balance" },
  { header: "Status", key: "status_label" },
];

const AccountLedgerPage = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await listAccountGroups();
        setGroups(res.data || []);
      } catch (err) {
        console.error("Error fetching account groups:", err);
      }
    };
    fetchOptions();
  }, []);

  const ledgerFields = [
    { name: "ledger_name", label: "Ledger Name", required: true },
    { name: "ledger_code", label: "Ledger Code", type: "number", coerce: Number },
    { name: "alias", label: "Alias" },
    {
      name: "account_group",
      label: "Account Group",
      type: "select",
      required: true,
      options: groups.map((g) => ({ value: g.id, label: g.group_name })),
      coerce: Number,
    },
    {
      name: "op_balance",
      label: "Opening Balance",
      type: "number",
      coerce: Number,
    },
    { name: "status", label: "Active", type: "checkbox" },
    { name: "reserved", label: "Reserved", type: "checkbox" },
  ];

  const listLedgersEnriched = async () => {
    try {
      const [lRes, gRes] = await Promise.all([
        listAccountLedgers(),
        listAccountGroups(),
      ]);
      const ledgers = lRes.data || [];
      const groupsLocal = gRes.data || [];

      const mapped = ledgers.map((l) => {
        const groupObj = groupsLocal.find(
          (g) => g.id === (l.account_group?.id || l.account_group),
        );
        return {
          ...l,
          account_group_name:
            l.account_group_name || groupObj?.group_name || "—",
          status_label: l.status ? "Active" : "Inactive",
        };
      });
      return { ...lRes, data: mapped };
    } catch (error) {
      console.error("Error enriching account ledgers:", error);
      return listAccountLedgers();
    }
  };

  return (
    <RegistryTable
      title="Account Ledger Master"
      addLabel="Add Ledger"
      nameKey="ledger_name"
      columns={LEDGER_COLUMNS}
      columnLabel="Ledger Name"
      emptyMessage="No ledgers found."
      listFn={listLedgersEnriched}
      createFn={createAccountLedger}
      updateFn={updateAccountLedger}
      deleteFn={deleteAccountLedger}
      fields={ledgerFields}
      isMaster={true}
    />
  );
};

export default AccountLedgerPage;