import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuUserPlus } from "react-icons/lu";
import RegistryTable from "../components/RegistryTable";
import {
  listMembers,
  createHead,
  updateMember,
  deleteMember,
  listFamilies,
  listWards,
  listGrades,
  updateHead,
  markMemberAsDeceased,
  listFamilyMembers,
  listMembersByHead,
  promoteToHead,
} from "../api/registryServices";

const MembersPage = () => {
  const navigate = useNavigate();
  const [wards, setWards] = useState([]);
  const [families, setFamilies] = useState([]);
  const [grades, setGrades] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [wRes, fRes, gRes, mRes] = await Promise.all([
          listWards(),
          listFamilies(),
          listGrades(),
          listMembers(),
        ]);
        setWards(wRes.data || []);
        setFamilies(fRes.data || []);
        setGrades(gRes.data || []);
        setAllMembers(mRes.data || []);
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, []);

  const getHeadFields = (formData, itemData) => [
    {
      name: "family",
      label: "Family",
      type: "select",
      required: true,
      options: families.map((f) => ({ value: f.id, label: f.family_name })),
      coerce: Number,
    },
    {
      name: "ward",
      label: "Ward",
      type: "select",
      required: true,
      options: wards.map((w) => ({ value: w.id, label: w.ward_name })),
      coerce: Number,
    },
    { name: "house_name", label: "House Name", required: true },
    { name: "name", label: "Name", required: true },
    { name: "baptismal_name", label: "Baptismal Name" },
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
            (m.family?.id || m.family) === Number(formData?.family) &&
            m.id !== itemData?.id,
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
      name: "family_image",
      label: "Family Image",
      type: "file",
      fullWidth: true,
    },
    {
      name: "is_deceased",
      label: "Mark as Deceased",
      type: "checkbox",
      fullWidth: true,
      showIf: (fd) => itemData && (!fd.is_deceased || familyMembers.length > 0),
      onChange: async (checked, fd, setFd, itemData) => {
        if (checked && itemData?.id) {
          try {
            const res = await listMembersByHead(itemData.id);
            const members = (res.data || []).filter(
              (m) =>
                m.id !== itemData.id &&
                m.is_active !== false &&
                m.expire !== true,
            );

            if (members.length === 0) {
              window.alert(
                "No other family members available to promote as head. Please add members first.",
              );
              setFd((prev) => ({ ...prev, is_deceased: false }));
              return;
            }

            setFamilyMembers(members);
            setFd((prev) => ({ ...prev, is_deceased: true }));
          } catch (error) {
            console.error("Error fetching family members:", error);
            window.alert("Failed to fetch family members.");
            setFd((prev) => ({ ...prev, is_deceased: false }));
          }
        } else {
          setFd((prev) => ({ ...prev, is_deceased: false, new_head_id: "" }));
        }
      },
    },
    {
      name: "new_head_id",
      label: "Select New Head of Family",
      type: "select",
      required: true,
      fullWidth: true,
      showIf: (fd) => itemData && fd.is_deceased,
      options: familyMembers.map((m) => ({ value: m.id, label: m.name })),
      coerce: Number,
    },
  ];

  const extraActions = [
    {
      icon: LuUserPlus,
      title: "Add Members",
      color: "green.500",
      hoverColor: "green.700",
      onClick: (item) => {
        // Navigate to add members for this head
        navigate(`/members/${item.id}`, { state: { head: item } });
      },
    },
  ];

  // We filter to show only those who are likely heads or just all members if the API lists everyone.
  // The user request says "list all head" and "each head have its own members".
  // Usually, a "head" might be identified by relationship or a flag.
  // But the "Create Head" API suggests we are creating heads here.
  // If listMembers returns all, we might need to filter.
  // However, for now I'll list all and let the user see.

  const handleUpdateHead = async (id, formData) => {
    // 1. Prepare data
    let isDeceased = false;
    let newHeadId = null;

    if (formData instanceof FormData) {
      isDeceased = formData.get("is_deceased") === "true";
      newHeadId = formData.get("new_head_id");
    } else {
      isDeceased = formData.is_deceased;
      newHeadId = formData.new_head_id;
    }

    // 2. Special handling for marking head as deceased
    if (isDeceased) {
      if (!newHeadId) {
        window.alert("Please select a new head of family.");
        return;
      }

      if (
        window.confirm(
          "This will promote the selected member as the new head and mark the current head as deceased. Proceed?",
        )
      ) {
        try {
          // Promote new head
          await promoteToHead(newHeadId);
          // Mark old head as deceased
          const res = await markMemberAsDeceased(id);
          window.alert(res.data.message || "Head updated successfully.");
          return res;
        } catch (error) {
          console.error("Error processing deceased head flow:", error);
          window.alert("Failed to update deceased head status.");
          throw error;
        }
      } else {
        return; // User cancelled
      }
    }

    // Normal update flow
    let ward, familyId;
    if (formData instanceof FormData) {
      ward = formData.get("ward");
      familyId = formData.get("family");
    } else {
      const { ward: w, family: f } = formData;
      ward = w;
      familyId = f;
    }

    // 2. Call updateHead (handles Ward and other fields)
    const hRes = await updateHead(id, formData);

    // 3. Call updateMember (specifically for Family field which updateHead ignores)
    if (familyId) {
      await updateMember(id, { family: Number(familyId) });
    }

    return hRes;
  };

  const headColumns = [
    { header: "Family Photo", key: "family_image" },
    { header: "Reg No", key: "reg_no" },
    { header: "Family Name", key: "family_name" },
    { header: "Ward", key: "ward_name" },
    { header: "Grade", key: "grade_name" },
    { header: "Total Members", key: "total_members" },
  ];

  const listHeadsWithNames = async () => {
    // Fetch fresh options to ensure names are correct after an update
    const [wRes, fRes, gRes, mRes] = await Promise.all([
      listWards(),
      listFamilies(),
      listGrades(),
      listMembers(),
    ]);

    const freshWards = wRes.data || [];
    const freshFamilies = fRes.data || [];
    const freshGrades = gRes.data || [];
    const allMembers = mRes.data || [];

    // Filter for heads using is_family_head and not expired/inactive
    const heads = allMembers.filter(
      (m) => m.is_family_head && m.is_active !== false && m.expire !== true,
    );

    // Map names and extra details
    const mapped = heads.map((h) => {
      const familyObj = freshFamilies.find(
        (f) => f.id === (h.family?.id || h.family),
      );
      const wardObj = freshWards.find((w) => w.id === (h.ward?.id || h.ward));
      const gradeObj = freshGrades.find(
        (g) => g.id === (h.grade?.id || h.grade),
      );
      const familyCount = allMembers.filter(
        (m) => (m.family?.id || m.family) === (h.family?.id || h.family),
      ).length;

      return {
        ...h,
        family_name: h.family?.family_name || familyObj?.family_name || "N/A",
        ward_name: h.ward?.ward_name || wardObj?.ward_name || "N/A",
        grade_name: h.grade?.name || gradeObj?.name || "N/A",
        reg_no: familyObj?.reg_no || "N/A",
        total_members: familyCount,
      };
    });

    return { ...mRes, data: mapped };
  };

  return (
    <RegistryTable
      title="Member Information"
      addLabel="Create Head"
      nameKey="name"
      columnLabel="Head of Family"
      columns={headColumns}
      emptyMessage="No members found."
      listFn={listHeadsWithNames}
      createFn={createHead}
      updateFn={handleUpdateHead}
      deleteFn={deleteMember}
      fields={getHeadFields}
      extraActions={extraActions}
    />
  );
};

export default MembersPage;
