import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listDioceses,
  createDiocese,
  updateDiocese,
  deleteDiocese,
} from "../api/registryServices";

const DIOCESE_COLUMNS = [
  { header: "Name", key: "name" },
  { header: "Phone", key: "phone_number" },
  { header: "Email", key: "mail_id" },
  { header: "Metropolitan", key: "metropolitan" },
];

const dioceseFields = [
  { name: "name", label: "Diocese Name" },
  { name: "address", label: "Address", type: "textarea", fullWidth: true },
  { name: "phone_number", label: "Phone Number" },
  { name: "mail_id", label: "Email", type: "email" },
  { name: "metropolitan", label: "Metropolitan" },
];

const DiocesePage = () => {
  return (
    <RegistryTable
      title="Diocese"
      addLabel="Add Diocese"
      nameKey="name"
      columns={DIOCESE_COLUMNS}
      columnLabel="Diocese Name"
      emptyMessage="No dioceses found."
      listFn={listDioceses}
      createFn={createDiocese}
      updateFn={updateDiocese}
      deleteFn={deleteDiocese}
      fields={dioceseFields}
    />
  );
};

export default DiocesePage;