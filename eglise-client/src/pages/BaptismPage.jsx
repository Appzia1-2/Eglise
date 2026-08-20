import React, { useState, useEffect } from "react";
import RegistryTable from "../components/RegistryTable";
import BaptismFormModal from "../components/BaptismFormModal";
import {
  listBaptisms,
  createBaptism,
  updateBaptism,
  deleteBaptism,
  listFamilies,
} from "../api/registryServices";

const BAPTISM_COLUMNS = [
  { header: "Reg No", key: "register_number" },
  { header: "Family Name", key: "family_name" },
  { header: "Date", key: "date_of_baptism" },
];

const BaptismPage = () => {
  const [families, setFamilies] = useState([]);

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const res = await listFamilies();
        setFamilies(res.data || []);
      } catch (error) {
        console.error("Error fetching families for BaptismPage:", error);
      }
    };
    fetchFamilies();
  }, []);

  const listBaptismsEnriched = async () => {
    try {
      const res = await listBaptisms();
      if (res.data) {
        const mapped = res.data.map((b) => {
          const famObj = families.find(
            (f) => f.id === (b.family?.id || b.family),
          );
          return {
            ...b,
            family_name: b.family?.family_name || famObj?.family_name || "N/A",
          };
        });
        return { ...res, data: mapped };
      }
      return res;
    } catch (error) {
      console.error("Error enriching baptisms:", error);
      return listBaptisms();
    }
  };

  return (
    <RegistryTable
      title="Baptism Register"
      addLabel="Add Record"
      nameKey="name"
      columns={BAPTISM_COLUMNS}
      columnLabel="Person Name"
      emptyMessage="No baptism records found."
      listFn={listBaptismsEnriched}
      createFn={createBaptism}
      updateFn={updateBaptism}
      deleteFn={deleteBaptism}
      FormModal={BaptismFormModal}
    />
  );
};

export default BaptismPage;
