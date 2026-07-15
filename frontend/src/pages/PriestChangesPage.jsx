import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listPriestChanges,
  createPriestChange,
  updatePriestChange,
  deletePriestChange,
  listPriests,
  listDesignations,
} from "../api/registryServices";

const PriestChangesPage = () => {
  const [priests, setPriests] = useState([]);
  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [priestsRes, designationsRes] = await Promise.all([
          listPriests(),
          listDesignations(),
        ]);
        setPriests(priestsRes.data || []);
        setDesignations(designationsRes.data || []);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  const fields = [
    {
      name: "priest",
      label: "Priest",
      type: "select",
      options: priests.map((p) => ({ label: p.name, value: p.id })),
      required: true,
      coerce: Number,
    },
    {
      name: "designation",
      label: "Designation",
      type: "select",
      options: designations.map((d) => ({
        label: d.designation_name,
        value: d.id,
      })),
      required: true,
      coerce: Number,
    },
    {
      name: "date_from",
      label: "Date From",
      type: "date",
      required: true,
    },
    {
      name: "date_to",
      label: "Date To",
      type: "date",
    },
  ];

  const columns = [
    { header: "Priest", key: "priest_name" },
    { header: "Designation", key: "designation_name" },
    { header: "Date From", key: "date_from" },
    { header: "Date To", key: "date_to" },
  ];

  const listPriestChangesWithNames = async () => {
    try {
      const [changesRes, priestsRes, designationsRes] = await Promise.all([
        listPriestChanges(),
        listPriests(),
        listDesignations(),
      ]);

      const priestsMap = (priestsRes.data || []).reduce((acc, p) => {
        acc[p.id] = p.name;
        return acc;
      }, {});

      const designationsMap = (designationsRes.data || []).reduce((acc, d) => {
        acc[d.id] = d.designation_name;
        return acc;
      }, {});

      if (changesRes.data) {
        const mappedData = changesRes.data.map((c) => ({
          ...c,
          priest_name:
            typeof c.priest === "object"
              ? c.priest?.name
              : priestsMap[c.priest],
          designation_name:
            typeof c.designation === "object"
              ? c.designation?.designation_name
              : designationsMap[c.designation],
        }));
        return { ...changesRes, data: mappedData };
      }
      return changesRes;
    } catch (error) {
      console.error("Error fetching priest changes with names:", error);
      throw error;
    }
  };

  return (
    <RegistryTable
      title="Priest Change"
      addLabel="Add Record"
      nameKey="priest_name"
      columns={columns}
      emptyMessage="No priest changes found."
      listFn={listPriestChangesWithNames}
      createFn={createPriestChange}
      updateFn={updatePriestChange}
      deleteFn={deletePriestChange}
      fields={fields}
      isMaster={true}
    />
  );
};

export default PriestChangesPage;
