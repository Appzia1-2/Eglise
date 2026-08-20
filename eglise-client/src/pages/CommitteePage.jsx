import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listCommittees,
  createCommittee,
  updateCommittee,
  deleteCommittee,
} from "../api/registryServices";

const COMMITTEE_COLUMNS = [
  { header: "Code", key: "committee_code" },
  { header: "From Date", key: "committee_from_date" },
  { header: "To Date", key: "committee_to_date" },
];

const committeeFields = [
  { name: "committee_name", label: "Committee Name", required: true },
  {
    name: "committee_code",
    label: "Committee Code",
    type: "number",
    required: true,
    coerce: Number,
  },
  {
    name: "committee_from_date",
    label: "From Date",
    type: "date",
    required: true,
  },
  {
    name: "committee_to_date",
    label: "To Date",
    type: "date",
    required: true,
  },
];

const CommitteePage = () => {
  return (
    <RegistryTable
      title="Committee Master"
      addLabel="Add Committee"
      nameKey="committee_name"
      columns={COMMITTEE_COLUMNS}
      columnLabel="Committee Name"
      emptyMessage="No committees found."
      listFn={listCommittees}
      createFn={createCommittee}
      updateFn={updateCommittee}
      deleteFn={deleteCommittee}
      fields={committeeFields}
      isMaster={true}
    />
  );
};

export default CommitteePage;