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

const calculateAge = (dobString) => {
  if (!dobString) return "";
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
};

const PRE_ANNOUNCEMENT_FIELDS = [
  {
    name: "marriage_date",
    label: "Marriage Date",
    type: "date",
    required: true,
    fullWidth: true,
  },

  // Groom Fields
  { 
    name: "groom_name", 
    label: "Groom Name", 
    required: true,
    placeholder: "Enter groom's full name"
  },
  {
    name: "groom_dob",
    label: "Groom DOB",
    type: "date",
    placeholder: "Select date of birth",
    onChange: (value, updated, setFormData) => {
      setFormData((prev) => ({ ...prev, groom_age: calculateAge(value) }));
    },
  },
  {
    name: "groom_age",
    label: "Groom Age",
    type: "number",
    coerce: Number,
    placeholder: "Auto-calculated"
  },
  { 
    name: "groom_house_name", 
    label: "Groom House Name",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter groom's house name"
  },
  { 
    name: "groom_family_name", 
    label: "Groom Family Name",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter groom's family name"
  },
  { 
    name: "groom_father", 
    label: "Groom Father",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter groom's father name"
  },
  { 
    name: "groom_mother", 
    label: "Groom Mother",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter groom's mother name"
  },
  { 
    name: "groom_place", 
    label: "Groom Place",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter groom's place"
  },
  {
    name: "groom_marriage_count",
    label: "Groom Marriage Count",
    type: "number",
    coerce: Number,
    placeholder: "Enter marriage count"
  },

  // Bride Fields
  { 
    name: "bride_name", 
    label: "Bride Name", 
    required: true,
    placeholder: "Enter bride's full name"
  },
  {
    name: "bride_dob",
    label: "Bride DOB",
    type: "date",
    placeholder: "Select date of birth",
    onChange: (value, updated, setFormData) => {
      setFormData((prev) => ({ ...prev, bride_age: calculateAge(value) }));
    },
  },
  {
    name: "bride_age",
    label: "Bride Age",
    type: "number",
    coerce: Number,
    placeholder: "Auto-calculated"
  },
  { 
    name: "bride_house_name", 
    label: "Bride House Name",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter bride's house name"
  },
  { 
    name: "bride_family_name", 
    label: "Bride Family Name",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter bride's family name"
  },
  { 
    name: "bride_father", 
    label: "Bride Father",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter bride's father name"
  },
  { 
    name: "bride_mother", 
    label: "Bride Mother",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter bride's mother name"
  },
  { 
    name: "bride_place", 
    label: "Bride Place",
    required: true,  // 👈 Made mandatory
    placeholder: "Enter bride's place"
  },
  {
    name: "bride_marriage_count",
    label: "Bride Marriage Count",
    type: "number",
    coerce: Number,
    placeholder: "Enter marriage count"
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
      nameKey="groom_name"
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