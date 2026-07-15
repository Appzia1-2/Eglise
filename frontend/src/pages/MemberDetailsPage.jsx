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
  markMemberAsDeceased,
  promoteToHead,
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

  const getMemberFields = (formData, itemData) => [
    {
      name: "family",
      label: "Family",
      type: "select",
      required: true,
      options: families.map((f) => ({ value: f.id, label: f.family_name })),
      coerce: Number,
    },
    { name: "name", label: "Name", required: true },
    { name: "baptismal_name", label: "Baptismal Name" },
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
    {
      name: "spouse_name",
      label: "Spouse",
      type: "select",
      options: allMembers
        .filter(
          (m) =>
            (m.family?.id || m.family) === familyId && m.id !== itemData?.id,
        )
        .map((m) => ({
          value: m.name,
          label: `${m.name}`,
        })),
      required: false,
    },
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
    {
      name: "is_deceased",
      label: "Mark as Deceased",
      type: "checkbox",
      fullWidth: true,
      showIf: (formData) => !formData.is_deceased,
      onChange: async (checked, formData, setFormData, itemData) => {
        if (checked && itemData?.id) {
          if (
            window.confirm(
              "Are you sure you want to mark this member as deceased?",
            )
          ) {
            try {
              const res = await markMemberAsDeceased(itemData.id);
              window.alert(res.data.message);
              // Closing the modal or refreshing is usually handled by the user or onSave,
              // but here we did an out-of-band action.
            } catch (error) {
              console.error("Error marking member as deceased:", error);
              window.alert("Failed to mark member as deceased.");
              // Revert checkbox
              setFormData((prev) => ({ ...prev, is_deceased: false }));
            }
          } else {
            // Revert checkbox
            setFormData((prev) => ({ ...prev, is_deceased: false }));
          }
        }
      },
    },
  ];

  const handleCreateMember = (formData) => {
    const data = {
      ...formData,
      family: familyId,
      house_name: head?.house_name,
      is_active: true,
    };
    return createMember(data);
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
      // familyId is always a plain integer now
      const filtered = res.data.filter(
        (m) =>
          m.id !== Number(headId) && m.is_active !== false && m.expire !== true,
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
          window.confirm(
            `Are you sure you want to promote ${item.name} to Head?`,
          )
        ) {
          try {
            const res = await promoteToHead(item.id);
            window.alert(res.data.message || "Member promoted to Head.");
            // Refresh would be nice, but RegistryTable doesn't expose it easily
            // except via re-fetch in listFn.
            window.location.reload(); // Simple way to refresh the whole state
          } catch (error) {
            console.error("Error promoting to head:", error);
            window.alert("Failed to promote member to Head.");
          }
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
      updateFn={updateMember}
      deleteFn={deleteMember}
      fields={getMemberFields}
      columns={memberColumns}
      extraActions={extraActions}
    />
  );
};

export default MemberDetailsPage;
