import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listWards,
  createWard,
  updateWard,
  deleteWard,
} from "../api/registryServices";

const WARD_FIELDS = [
  { name: "ward_name", label: "Ward Name", type: "text", required: true },
  {
    name: "ward_number",
    label: "Ward Number",
    type: "number",
    required: true,
    coerce: Number,
  },
  { name: "place", label: "Place", type: "text" },
];

const WARD_COLUMNS = [
  { header: "Ward Number", key: "ward_number", textAlign: "center" },
  { header: "Ward Name", key: "ward_name", textAlign: "center" },
  { header: "Place", key: "place", textAlign: "center" },
];

const WardPage = () => (
  <RegistryTable
    title="Ward"
    addLabel="Add New"
    nameKey="ward_name"
    columns={WARD_COLUMNS}
    emptyMessage="No wards found."
    listFn={listWards}
    createFn={createWard}
    updateFn={updateWard}
    deleteFn={deleteWard}
    fields={WARD_FIELDS}
    isMaster={true}
  />
);

export default WardPage;
