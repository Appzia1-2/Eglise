import React, { useState, useEffect } from "react";
import { HStack, Button, Text } from "@chakra-ui/react";
import RegistryTable from "../components/RegistryTable";
import {
  listDeaths,
  updateDeath,
  deleteDeath,
  listFamilies,
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
  const [filterStatus, setFilterStatus] = useState(null); // null for ALL, 'pending' for Pending

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [tRes, fRes] = await Promise.all([
          listTombTypes(),
          listFamilies(),
        ]);
        setTombTypes(tRes.data || []);
        setFamilies(fRes.data || []);
      } catch (error) {
        console.error("Error fetching options for DeathRegisterPage:", error);
      }
    };
    fetchOptions();
  }, []);

  const deathFields = [
    { name: "died_on", label: "Date of Death", type: "date" },
    { name: "funeral_on", label: "Date of Funeral", type: "date" },
    {
      name: "tomb_type",
      label: "Tomb Type",
      type: "select",
      options: tombTypes.map((t) => ({ label: t.name, value: t.id })),
      coerce: Number,
    },
    {
      name: "tomb_charge",
      label: "Tomb Charge",
      type: "number",
      coerce: Number,
    },
    { name: "tomb_idn", label: "Tomb IDN" },
    { name: "reason_of_death", label: "Reason of Death" },
    { name: "remarks", label: "Remarks", type: "textarea", fullWidth: true },
  ];

  const listDeathsFiltered = async () => {
    try {
      const res = await listDeaths(filterStatus);
      if (res.data) {
        const mapped = res.data.map((d) => {
          // Find family by object ID or direct ID
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

  const topContent = (
    <HStack mb={4} spacing={4}>
      <Button
        size="sm"
        variant={filterStatus === null ? "solid" : "outline"}
        onClick={() => setFilterStatus(null)}
        bg={filterStatus === null ? "var(--primary-maroon)" : "transparent"}
        color={filterStatus === null ? "white" : "gray.600"}
      >
        All Records
      </Button>
      <Button
        size="sm"
        variant={filterStatus === "pending" ? "solid" : "outline"}
        onClick={() => setFilterStatus("pending")}
        bg={
          filterStatus === "pending" ? "var(--primary-maroon)" : "transparent"
        }
        color={filterStatus === "pending" ? "white" : "gray.600"}
      >
        Pending Approval
      </Button>
    </HStack>
  );

  return (
    <RegistryTable
      key={`${filterStatus}-${families.length}`} // Force re-fetch when filter OR families load
      title="Death Register"
      addLabel="Add Record"
      nameKey="member_name"
      columns={DEATH_COLUMNS}
      columnLabel="Deceased Name"
      emptyMessage="No death records found."
      listFn={listDeathsFiltered}
      updateFn={updateDeath}
      deleteFn={deleteDeath}
      fields={deathFields}
      topContent={topContent}
    />
  );
};

export default DeathRegisterPage;
