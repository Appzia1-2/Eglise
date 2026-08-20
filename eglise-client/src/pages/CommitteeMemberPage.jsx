import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listCommitteeMembers,
  createCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
  listMembers,
  listDesignations,
  listCommittees,
} from "../api/registryServices";

const COMMITTEE_MEMBER_COLUMNS = [
  { header: "Designation", key: "designation_name" },
  { header: "Committee", key: "committee_name" },
];

const CommitteeMemberPage = () => {
  const [members, setMembers] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [mRes, dRes, cRes] = await Promise.all([
          listMembers(),
          listDesignations(),
          listCommittees(),
        ]);
        setMembers(mRes.data || []);
        setDesignations(dRes.data || []);
        setCommittees(cRes.data || []);
      } catch (err) {
        console.error("Error fetching committee member options:", err);
      }
    };
    fetchOptions();
  }, []);

  const committeeMemberFields = [
    {
      name: "member",
      label: "Member",
      type: "select",
      required: true,
      options: members.map((m) => ({ value: m.id, label: m.name })),
      coerce: Number,
    },
    {
      name: "designation",
      label: "Designation",
      type: "select",
      required: true,
      options: designations.map((d) => ({ value: d.id, label: d.designation_name })),
      coerce: Number,
    },
    {
      name: "committee",
      label: "Committee",
      type: "select",
      required: true,
      options: committees.map((c) => ({ value: c.id, label: c.committee_name })),
      coerce: Number,
    },
  ];

  const listCommitteeMembersEnriched = async () => {
    try {
      const res = await listCommitteeMembers();
      return res;
    } catch (error) {
      console.error("Error fetching committee members:", error);
      return listCommitteeMembers();
    }
  };

  return (
    <RegistryTable
      title="Committee Members"
      addLabel="Add Committee Member"
      nameKey="member_name"
      columns={COMMITTEE_MEMBER_COLUMNS}
      columnLabel="Member"
      emptyMessage="No committee members found."
      listFn={listCommitteeMembersEnriched}
      createFn={createCommitteeMember}
      updateFn={updateCommitteeMember}
      deleteFn={deleteCommitteeMember}
      fields={committeeMemberFields}
    />
  );
};

export default CommitteeMemberPage;