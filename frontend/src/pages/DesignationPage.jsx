import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../api/registryServices";

const DESIGNATION_FIELDS = [
  {
    name: "designation_name",
    label: "Designation Name",
    type: "text",
    required: true,
  },
];

const DESIGNATION_COLUMNS = [
  { header: "Designation Name", key: "designation_name", textAlign: "center" },
];

const DesignationPage = () => (
  <RegistryTable
    title="Designation"
    addLabel="Add New"
    nameKey="designation_name"
    columns={DESIGNATION_COLUMNS}
    emptyMessage="No designations found."
    listFn={listDesignations}
    createFn={createDesignation}
    updateFn={updateDesignation}
    deleteFn={deleteDesignation}
    fields={DESIGNATION_FIELDS}
    isMaster={true}
  />
);

export default DesignationPage;
