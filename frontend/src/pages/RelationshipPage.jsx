import React from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
} from "../api/registryServices";

const RELATIONSHIP_FIELDS = [
  { name: "name", label: "Relationship Name", type: "text", required: true },
];

const RelationshipPage = () => (
  <RegistryTable
    title="Relationship"
    addLabel="Add New"
    nameKey="name"
    columnLabel="Relationship Name"
    emptyMessage="No relationships found."
    listFn={listRelationships}
    createFn={createRelationship}
    updateFn={updateRelationship}
    deleteFn={deleteRelationship}
    fields={RELATIONSHIP_FIELDS}
    isMaster={true}
  />
);

export default RelationshipPage;
