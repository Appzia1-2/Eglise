import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listQurbanaReceipts,
  createQurbanaReceipt,
  updateQurbanaReceipt,
  deleteQurbanaReceipt,
} from "../api/registryServices";

const QURBANA_COLUMNS = [
  { header: "Category", key: "category" },
  { header: "Date", key: "qurbana_date" },
  { header: "Narration", key: "narration" },
];

const qurbanaFields = [
  { name: "name", label: "Name", required: true },
  { name: "category", label: "Category", required: true },
  { name: "qurbana_date", label: "Date", type: "date", required: true },
  { name: "narration", label: "Narration", type: "textarea", fullWidth: true },
];

const QurbanaReceiptsPage = () => {
  return (
    <RegistryTable
      title="Qurbana Receipts"
      addLabel="Add Receipt"
      nameKey="name"
      columns={QURBANA_COLUMNS}
      columnLabel="Name"
      emptyMessage="No qurbana receipts found."
      listFn={listQurbanaReceipts}
      createFn={createQurbanaReceipt}
      updateFn={updateQurbanaReceipt}
      deleteFn={deleteQurbanaReceipt}
      fields={qurbanaFields}
    />
  );
};

export default QurbanaReceiptsPage;