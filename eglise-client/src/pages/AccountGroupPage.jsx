import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listAccountGroups,
  createAccountGroup,
  updateAccountGroup,
  deleteAccountGroup,
} from "../api/registryServices";

const ACCOUNT_GROUP_COLUMNS = [
  { header: "Account Code", key: "account_code" },
  { header: "Alias", key: "alias" },
  { header: "Under Group", key: "under_group_name" },
  { header: "Status", key: "status_label" },
];

const AccountGroupPage = () => {
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

  const accountGroupFields = [
    { name: "group_name", label: "Group Name", required: true },
    { name: "account_code", label: "Account Code", type: "number", coerce: Number },
    { name: "alias", label: "Alias" },
    {
      name: "under_group",
      label: "Under Group",
      type: "select",
      options: groups.map((g) => ({ value: g.id, label: g.group_name })),
      coerce: Number,
    },
    { name: "status", label: "Active", type: "checkbox" },
    { name: "reserved", label: "Reserved", type: "checkbox" },
  ];

  const listAccountGroupsEnriched = async () => {
    try {
      const res = await listAccountGroups();
      const data = res.data || [];
      const mapped = data.map((g) => ({
        ...g,
        status_label: g.status ? "Active" : "Inactive",
      }));
      return { ...res, data: mapped };
    } catch (error) {
      console.error("Error enriching account groups:", error);
      return listAccountGroups();
    }
  };

  return (
    <RegistryTable
      title="Account Group Master"
      addLabel="Add Account Group"
      nameKey="group_name"
      columns={ACCOUNT_GROUP_COLUMNS}
      columnLabel="Group Name"
      emptyMessage="No account groups found."
      listFn={listAccountGroupsEnriched}
      createFn={createAccountGroup}
      updateFn={updateAccountGroup}
      deleteFn={deleteAccountGroup}
      fields={accountGroupFields}
      isMaster={true}
    />
  );
};

export default AccountGroupPage;