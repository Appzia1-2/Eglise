import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import RegistryTable from "../components/RegistryTable";
import {
  listMembers,
  listFamilyMembers,
  listMembersByHead,
  createMember,
  updateMember,
  deleteMember,
  listRelationships,
  listGrades,
  listFamilies,
  transferAndPromoteHead,
  changeMemberHead,
  getMember, // 🔥 ADD THIS - was missing!
} from "../api/registryServices";
import { LuTrendingUp } from "react-icons/lu";

const MemberDetailsPage = () => {
  const { headId } = useParams();
  const location = useLocation();
  const [head, setHead] = useState(location.state?.head || null);
  const [familyId, setFamilyId] = useState(
    head?.family?.id ?? head?.family ?? null,
  );

  const [relationships, setRelationships] = useState([]);
  const [grades, setGrades] = useState([]);
  const [families, setFamilies] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const fetchOptionsAndHead = async () => {
      try {
        let fetchedHead = head;
        if (!fetchedHead) {
          const hRes = await getMember(headId);
          fetchedHead = hRes.data;
          setHead(fetchedHead);
          const f = fetchedHead?.family;
          setFamilyId(f?.id ?? f ?? null);
        } else {
          const f = fetchedHead?.family;
          setFamilyId(f?.id ?? f ?? null);
        }

        const [rRes, gRes, fRes, mRes] = await Promise.all([
          listRelationships(),
          listGrades(),
          listFamilies(),
          listMembers(),
        ]);
        setRelationships(rRes.data || []);
        setGrades(gRes.data || []);
        setFamilies(fRes.data || []);
        setAllMembers(mRes.data || []);
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Error fetching options or head:", error);
      }
    };
    fetchOptionsAndHead();
  }, [headId]);

  // 🔥 Item 8: auto-fill father/mother name based on relationship + head's gender
  const applyRelationshipDefaults = (relationshipId, formData, setFormData) => {
    const rel = relationships.find((r) => Number(r.id) === Number(relationshipId));
    if (!rel || !head) return;

    if (rel.name === "Son" || rel.name === "Daughter") {
      const headIsFather = head.gender === "MALE";
      setFormData((prev) => ({
        ...prev,
        father_name: headIsFather ? head.name : head.spouse_name || "",
        mother_name: headIsFather ? head.spouse_name || "" : head.name,
      }));
    }
  };

  // 🔥 Active heads available to reassign a dependent to (excludes the
  // member being edited, in case they were ever somehow flagged as head)
  const getActiveHeads = (itemData) =>
    allMembers.filter(
      (m) =>
        m.is_family_head &&
        m.is_active !== false &&
        m.expired !== true &&
        m.id !== itemData?.id,
    );

  const getMemberFields = (formData, itemData) => [
    { name: "name", label: "Name", required: true },
    { name: "baptismal_name", label: "Baptismal Name" },
    // 🔥 Only show the "Head" reassignment dropdown when EDITING an
    // existing member (not when creating a new one)
    ...(itemData
      ? [
          {
            name: "head",
            label: "Head",
            type: "select",
            options: getActiveHeads(itemData).map((h) => ({
              value: h.id,
              label: `${h.name} (${h.house_name})`,
            })),
            coerce: Number,
          },
        ]
      : []),
    {
      name: "relationship",
      label: "Relationship",
      type: "select",
      required: true,
      options: relationships.map((r) => ({
        value: r.id,
        label: r.name,
      })),
      coerce: Number,
      onChange: (value, fd, setFd) => {
        setFd((prev) => ({ ...prev, relationship: value }));
        applyRelationshipDefaults(value, fd, setFd);
      },
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        { value: "MALE", label: "Male" },
        { value: "FEMALE", label: "Female" },
        { value: "OTHER", label: "Other" },
      ],
    },
    { name: "email", label: "Email", type: "email" },
    {
      name: "marital_status",
      label: "Marital Status",
      type: "select",
      options: [
        { value: "SINGLE", label: "Single" },
        { value: "MARRIED", label: "Married" },
        { value: "WIDOWED", label: "Widowed" },
        { value: "DIVORCED", label: "Divorced" },
      ],
    },
    { name: "spouse_name", label: "Spouse", type: "text", required: false },
    { name: "dob", label: "Date of Birth", type: "date" },
    { name: "mobile_no", label: "Mobile No", required: true },
    { name: "phone_no", label: "Phone No" },
    { name: "blood_group", label: "Blood Group" },
    { name: "father_name", label: "Father Name" },
    { name: "mother_name", label: "Mother Name" },
    { name: "date_of_baptism", label: "Date of Baptism", type: "date" },
    { name: "parish_of_baptism", label: "Parish of Baptism" },
    { name: "educational_qualification", label: "Educational Qualification" },
    {
      name: "sunday_school_qualification",
      label: "Sunday School Qualification",
    },
    { name: "profession", label: "Profession" },
    {
      name: "grade",
      label: "Grade",
      type: "select",
      options: grades.map((g) => ({ value: g.id, label: g.name })),
      coerce: Number,
    },
    { name: "joining_date", label: "Joining Date", type: "date" },
    { name: "transferred_from", label: "Transferred From" },
    { name: "address", label: "Address", type: "textarea", fullWidth: true },
  ];

  // 🔥 FIXED: Include house_sequence when creating a member under this head
  const handleCreateMember = (formData) => {
    const data = {
      ...formData,
      family: familyId,
      house_name: head?.house_name,
      house_sequence: head?.house_sequence || 1, // 🔥 CRITICAL FIX: Use head's sequence
      is_active: true,
    };
    return createMember(data);
  };

  // 🔥 If "head" was changed on an existing member, reassign their
  // household via changeMemberHead first, then save any other edited
  // fields normally.
  const handleUpdateMember = async (id, formData) => {
    const { head: newHeadId, ...rest } = formData;

    if (newHeadId) {
      await changeMemberHead(id, newHeadId);
    }

    if (Object.keys(rest).length > 0) {
      return updateMember(id, rest);
    }

    return { data: { message: "Head updated successfully." } };
  };

  if (!isDataLoaded) return null;

  const calculateAge = (dob) => {
    if (!dob) return "—";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const listFamilyMembersStrict = async () => {
    const res = await listMembersByHead(headId);
    if (res.data && Array.isArray(res.data)) {
      // 🔥 FIX: Use 'expired' not 'expire'
      const filtered = res.data.filter(
        (m) =>
          m.id !== Number(headId) && 
          m.is_active !== false && 
          m.expired !== true, // 🔥 FIXED: was 'expire'
      );

      const mapped = filtered.map((m) => {
        const relId =
          typeof m.relationship === "object"
            ? Number(m.relationship?.id)
            : Number(m.relationship);
        const relObj = relationships.find((r) => Number(r.id) === relId);
        return {
          ...m,
          relationship_name: m.relationship?.name || relObj?.name || "—",
          age: calculateAge(m.dob),
        };
      });

      return { ...res, data: mapped };
    }
    return res;
  };

  const memberColumns = [
    { header: "Relationship", key: "relationship_name" },
    { header: "Age", key: "age" },
    { header: "DOB", key: "dob" },
    { header: "Qualification", key: "educational_qualification" },
    { header: "Profession", key: "profession" },
  ];

  const extraActions = [
    {
      label: "Promote",
      icon: LuTrendingUp,
      title: "Promote to Head",
      color: "blue.500",
      onClick: async (item) => {
        if (
          !window.confirm(
            `Promote ${item.name} to head of a new household under "${head?.house_name}"?`,
          )
        ) {
          return;
        }

        try {
          const res = await transferAndPromoteHead(item.id, {
            family: familyId,
            house_name: head?.house_name,
          });
          window.alert(res.data.message || "Member promoted to Head.");
          window.location.reload();
        } catch (error) {
          console.error("Error promoting to head:", error);
          const backendMessage =
            error.response?.data?.error ||
            error.response?.data?.detail ||
            "Failed to promote member to Head.";
          window.alert(backendMessage);
        }
      },
    },
  ];

  return (
    <RegistryTable
      title={`Members of ${head?.name || "Family"}`}
      addLabel="Add Member"
      nameKey="name"
      columnLabel="Member Name"
      emptyMessage="No family members found."
      listFn={listFamilyMembersStrict}
      createFn={handleCreateMember}
      updateFn={handleUpdateMember}
      deleteFn={deleteMember}
      fields={getMemberFields}
      columns={memberColumns}
      extraActions={extraActions}
    />
  );
};

export default MemberDetailsPage;