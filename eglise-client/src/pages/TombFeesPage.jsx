import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import {
  listTombFees,
  createTombFees,
  updateTombFees,
  deleteTombFees,
  listTombTypes,
} from "../api/churchServices";

const TombFeesPage = () => {
  const [tombTypes, setTombTypes] = useState([]);

  useEffect(() => {
    const fetchTombTypes = async () => {
      try {
        const response = await listTombTypes();
        setTombTypes(response.data || []);
      } catch (error) {
        console.error("Error fetching tomb types:", error);
      }
    };
    fetchTombTypes();
  }, []);

  const fields = [
    {
      name: "tomb_type",
      label: "Tomb Type",
      type: "select",
      options: tombTypes.map((t) => ({ label: t.name, value: t.id })),
      required: true,
      coerce: Number,
    },
    {
      name: "tomb_fees",
      label: "Tomb Fees",
      type: "number",
      required: true,
      coerce: Number,
    },
    {
      name: "indication",
      label: "Indication",
      type: "text",
      required: true,
    },
    {
      name: "specification",
      label: "Specification",
      type: "textarea",
      fullWidth: true,
    },
  ];

  const columns = [
    { header: "Tomb Type", key: "tomb_type_name" },
    { header: "Fees", key: "tomb_fees" },
    { header: "Indication", key: "indication" },
  ];

  const listTombFeesWithNames = async () => {
    try {
      const [feesRes, typesRes] = await Promise.all([
        listTombFees(),
        listTombTypes(),
      ]);

      const typesMap = (typesRes.data || []).reduce((acc, t) => {
        acc[t.id] = t.name;
        return acc;
      }, {});

      if (feesRes.data) {
        const mappedData = feesRes.data.map((f) => {
          // Handle both ID and object for tomb_type
          const typeId =
            typeof f.tomb_type === "object" ? f.tomb_type?.id : f.tomb_type;
          const typeName =
            typeof f.tomb_type === "object"
              ? f.tomb_type?.name
              : typesMap[typeId];

          return {
            ...f,
            tomb_type_name: typeName || "Unknown",
          };
        });
        return { ...feesRes, data: mappedData };
      }
      return feesRes;
    } catch (error) {
      console.error("Error fetching tomb fees with types:", error);
      throw error;
    }
  };

  return (
    <RegistryTable
      title="Tomb Fees"
      addLabel="Add Record"
      nameKey="indication"
      columns={columns}
      emptyMessage="No tomb fees found."
      listFn={listTombFeesWithNames}
      createFn={createTombFees}
      updateFn={updateTombFees}
      deleteFn={deleteTombFees}
      fields={fields}
      isMaster={true}
    />
  );
};

export default TombFeesPage;
