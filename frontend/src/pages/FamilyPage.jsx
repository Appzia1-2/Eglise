import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listFamilies,
  createFamily,
  updateFamily,
  deleteFamily,
} from "../api/registryServices";

const FamilyPage = () => {
  const familyFields = [
    { name: "family_name", label: "Family Name", required: true },
    { name: "origin", label: "Origin" },
    {
      name: "history",
      label: "History",
      type: "textarea",
      rows: 3,
      fullWidth: true,
    },
  ];

  const familyColumns = [
    { header: "Family Name", key: "family_name", textAlign: "center" },
  ];

  return (
    <RegistryTable
      title="Family"
      addLabel="Add New"
      nameKey="family_name"
      columns={familyColumns}
      emptyMessage="No families found."
      listFn={listFamilies}
      createFn={createFamily}
      updateFn={updateFamily}
      deleteFn={deleteFamily}
      fields={familyFields}
      isMaster={true}
    />
  );
};

export default FamilyPage;
