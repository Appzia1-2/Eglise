import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listTombTypes,
  createTombType,
  updateTombType,
  deleteTombType,
} from "../api/churchServices";

const TOMB_TYPE_FIELDS = [
  { name: "name", label: "Tomb Type Name", type: "text", required: true },
];

const TOMB_TYPE_COLUMNS = [{ header: "Tomb Type Name", key: "name" }];

const TombTypePage = () => (
  <RegistryTable
    title="Tomb type"
    addLabel="Add Record"
    nameKey="name"
    columns={TOMB_TYPE_COLUMNS}
    emptyMessage="No tomb types found."
    listFn={listTombTypes}
    createFn={createTombType}
    updateFn={updateTombType}
    deleteFn={deleteTombType}
    fields={TOMB_TYPE_FIELDS}
    isMaster={true}
  />
);

export default TombTypePage;
