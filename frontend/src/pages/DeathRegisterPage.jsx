import React, { useState, useEffect } from "react";
import { HStack, Button, Text } from "@chakra-ui/react";
import RegistryTable from "../components/RegistryTable";
import {
  listDeaths,
  updateDeath,
  deleteDeath,
  listFamilies,
  listMembers,
  createDeathRecord,
} from "../api/registryServices";
import { listTombTypes } from "../api/churchServices";

const DEATH_COLUMNS = [
  { header: "Reg No", key: "reg_no" },
  { header: "Name", key: "member_name" },
  { header: "Family", key: "family_name" },
  { header: "Date of Death", key: "died_on" },
];

const DeathRegisterPage = () => {
  const [tombTypes, setTombTypes] = useState([]);
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [filterStatus, setFilterStatus] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [tRes, fRes, mRes] = await Promise.all([
          listTombTypes(),
          listFamilies(),
          listMembers(),
        ]);
        setTombTypes(tRes.data || []);
        setFamilies(fRes.data || []);
        const activeMembers = (mRes.data || []).filter(
          (m) => m.is_active !== false && m.expired !== true,
        );
        setMembers(activeMembers);
      } catch (error) {
        console.error("Error fetching options for DeathRegisterPage:", error);
      }
    };
    fetchOptions();
  }, []);

  // 🔥 fields is now a function: "member" picker only shows when CREATING
  // (itemData is null/undefined for a new record, present when editing)
  const getDeathFields = (formData, itemData) => {
    const fields = [];

    if (!itemData) {
      fields.push({
        name: "member",
        label: "Select Member",
        type: "select",
        required: true,
        options: members.map((m) => ({
          value: m.id,
          label: `${m.name} (${m.family?.family_name || "N/A"} - ${m.house_name})`,
        })),
        coerce: Number,
      });
    }

    fields.push(
      { name: "died_on", label: "Date of Death", type: "date", required: true },
      {
        name: "funeral_on",
        label: "Date of Funeral",
        type: "date",
        required: true,
      },
      {
        name: "tomb_type",
        label: "Tomb Type",
        type: "select",
        required: true,
        options: tombTypes.map((t) => ({ label: t.name, value: t.id })),
        coerce: Number,
      },
      {
        name: "tomb_charge",
        label: "Tomb Charge",
        type: "number",
        required: true,
        coerce: Number,
      },
      { name: "tomb_idn", label: "Tomb IDN" },
      {
        name: "reason_of_death",
        label: "Reason of Death",
        required: true,
      },
      { name: "remarks", label: "Remarks", type: "textarea", fullWidth: true },
    );

    return fields;
  };

  // 🔥 Create now sends the FULL form (member + all death details) in one
  // step. Backend marks the member deceased AND completes the record
  // immediately — no separate pending/approval step anymore.
  const handleCreateDeathRecord = (formData) => {
    return createDeathRecord(formData);
  };

  const listDeathsFiltered = async () => {
    try {
      const res = await listDeaths(filterStatus);
      if (res.data) {
        const mapped = res.data.map((d) => {
          const famId = d.family?.id || d.family;
          const famObj = families.find((f) => f.id === famId);

          return {
            ...d,
            family_name:
              d.family_name ||
              d.family?.family_name ||
              famObj?.family_name ||
              "N/A",
            house_name:
              d.house_name || d.family?.house_name || famObj?.house_name || "—",
          };
        });
        return { ...res, data: mapped };
      }
      return res;
    } catch (error) {
      console.error("Error fetching and enriching deaths:", error);
      return listDeaths(filterStatus);
    }
  };

  return (
    <RegistryTable
      key={`${families.length}`}
      title="Death Register"
      addLabel="Mark Member as Deceased"
      nameKey="member_name"
      columns={DEATH_COLUMNS}
      columnLabel="Deceased Name"
      emptyMessage="No death records found."
      listFn={listDeathsFiltered}
      createFn={handleCreateDeathRecord}
      updateFn={updateDeath}
      deleteFn={deleteDeath}
      fields={getDeathFields}
    />
  );
};

export default DeathRegisterPage;