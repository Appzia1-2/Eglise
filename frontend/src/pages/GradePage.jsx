import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listGrades,
  createGrade,
  updateGrade,
  deleteGrade,
} from "../api/registryServices";

const GRADE_FIELDS = [
  { name: "name", label: "Grade Name", type: "text", required: true },
];

const GradePage = () => (
  <RegistryTable
    title="Grade"
    addLabel="Add New"
    nameKey="name"
    columnLabel="Grade Name"
    emptyMessage="No grades found."
    listFn={listGrades}
    createFn={createGrade}
    updateFn={updateGrade}
    deleteFn={deleteGrade}
    fields={GRADE_FIELDS}
    isMaster={true}
  />
);

export default GradePage;
