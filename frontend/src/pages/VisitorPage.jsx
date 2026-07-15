import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listVisitors,
  createVisitor,
  updateVisitor,
  deleteVisitor,
} from "../api/registryServices";

const VISITOR_COLUMNS = [
  { header: "Visit Date", key: "visitor_date" },
  { header: "Address", key: "visitor_address" },
  { header: "Remarks", key: "remarks" },
];

const visitorFields = [
  { name: "visitor_name", label: "Visitor Name", required: true },
  {
    name: "visitor_date",
    label: "Visit Date",
    type: "date",
    required: true,
  },
  {
    name: "visitor_address",
    label: "Address",
    type: "textarea",
    fullWidth: true,
  },
  {
    name: "remarks",
    label: "Remarks",
    type: "textarea",
    fullWidth: true,
  },
];

const VisitorPage = () => {
  return (
    <RegistryTable
      title="Visitor Management"
      addLabel="Add Visitor"
      nameKey="visitor_name"
      columns={VISITOR_COLUMNS}
      columnLabel="Visitor Name"
      emptyMessage="No visitors found."
      listFn={listVisitors}
      createFn={createVisitor}
      updateFn={updateVisitor}
      deleteFn={deleteVisitor}
      fields={visitorFields}
    />
  );
};

export default VisitorPage;