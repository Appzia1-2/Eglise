import React from "react";
import { useNavigate } from "react-router-dom";
import RegistryTable from "../components/RegistryTable";
import { LuUsers } from "react-icons/lu";
import GenericFormModal from "../components/GenericFormModal";
import {
  listPreAnnouncements,
  createPreAnnouncement,
  updatePreAnnouncement,
  deletePreAnnouncement,
} from "../api/registryServices";

const PRE_ANNOUNCEMENT_COLUMNS = [
  { header: "Groom", key: "groom_name" },
  { header: "Bride", key: "bride_name" },
  { header: "Marriage Date", key: "marriage_date" },
];

const PRE_ANNOUNCEMENT_FIELDS = [
  {
    name: "marriage_date",
    label: "Marriage Date",
    type: "date",
    required: true,
    fullWidth: true,
  },

  // Groom Fields
  { name: "groom_name", label: "Groom Name", required: true },
  { name: "groom_dob", label: "Groom DOB", type: "date" },
  { name: "groom_age", label: "Groom Age", type: "number", coerce: Number },
  { name: "groom_house_name", label: "Groom House Name" },
  { name: "groom_family_name", label: "Groom Family Name" },
  { name: "groom_father", label: "Groom Father" },
  { name: "groom_mother", label: "Groom Mother" },
  { name: "groom_place", label: "Groom Place" },
  {
    name: "groom_marriage_count",
    label: "Groom Marriage Count",
    type: "number",
    coerce: Number,
  },

  // Bride Fields
  { name: "bride_name", label: "Bride Name", required: true },
  { name: "bride_dob", label: "Bride DOB", type: "date" },
  { name: "bride_age", label: "Bride Age", type: "number", coerce: Number },
  { name: "bride_house_name", label: "Bride House Name" },
  { name: "bride_family_name", label: "Bride Family Name" },
  { name: "bride_father", label: "Bride Father" },
  { name: "bride_mother", label: "Bride Mother" },
  { name: "bride_place", label: "Bride Place" },
  {
    name: "bride_marriage_count",
    label: "Bride Marriage Count",
    type: "number",
    coerce: Number,
  },
];

const PreAnnouncementPage = () => {
  const navigate = useNavigate();

  const extraActions = [
    {
      icon: LuUsers,
      title: "Create Marriage",
      color: "pink.500",
      hoverColor: "pink.700",
      onClick: (item) => {
        // Navigate to marriage page with this pre-announcement data
        navigate("/marriage", { state: { preAnnouncement: item } });
      },
    },
  ];

  return (
    <RegistryTable
      title="Marriage Register"
      addLabel="Add Record"
      nameKey="groom_name" // RegistryTable uses this for some display/delete prompts
      columns={PRE_ANNOUNCEMENT_COLUMNS}
      columnLabel="Marriage Info"
      emptyMessage="No marriage register records found."
      listFn={listPreAnnouncements}
      createFn={createPreAnnouncement}
      updateFn={updatePreAnnouncement}
      deleteFn={deletePreAnnouncement}
      FormModal={(props) => (
        <GenericFormModal
          {...props}
          title="Marriage Register"
          fields={PRE_ANNOUNCEMENT_FIELDS}
        />
      )}
      extraActions={extraActions}
    />
  );
};

export default PreAnnouncementPage;
