// src/pages/reports/reportConfig.js

import {
  listBaptisms, getBaptism,
  listMarriages, getMarriage,
  listDeaths, getDeath,
  listLegacyBaptisms, getLegacyBaptism,
  listLegacyMarriages, getLegacyMarriage,
  listLegacyDeaths, getLegacyDeath,
} from "../../api/registryServices";

export const pick = (r, keys, fallback = "-") => {
  for (const k of keys) {
    const v = r?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
};

export const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

/*
  Per-type list design.
  - keys arrays: first key found on the record is used
  - stats kinds: total | month | year | match
  - filters: static `options` or dynamic (unique values from the data)
*/
const BASE = {
  baptism: {
    type: "baptism",
    eyebrow: "BAPTISM REPORT",
    title: "Baptism Records",
    subtitle: "View and print baptism certificates.",
    placeholder: "Search name, baptism name, register no. or parish",
    emptyIcon: "baby",
    showYear: false,
    dateKeys: ["date_of_baptism", "baptism_date", "baptised_on"],
    nameKeys: ["name", "baptismal_name", "member_name", "child_name"],
    searchKeys: [
      "name", "baptismal_name", "register_number", "reg_no",
      "parish_of_baptism", "father_name", "mother_name",
    ],
    badge: {
      keys: ["baptism_category"],
      map: {
        PARISH: { label: "Parish Member", tone: "red" },
        OTHER: { label: "Other Parish Member", tone: "blue" },
      },
    },
    stats: [
      { kind: "total", label: "Total Records", icon: "archive" },
      { kind: "match", label: "Parish Members", icon: "users",
        keys: ["baptism_category"], equals: "PARISH" },
      { kind: "match", label: "Other Parish Members", icon: "user",
        keys: ["baptism_category"], equals: "OTHER" },
      { kind: "month", label: "This Month", icon: "calendar" },
    ],
    filters: [
      {
        id: "category", allLabel: "All Member Types",
        keys: ["baptism_category"],
        options: [
          { value: "PARISH", label: "Parish Member" },
          { value: "OTHER", label: "Other Parish Member" },
        ],
      },
      { id: "parish", allLabel: "All Parishes", keys: ["parish_of_baptism"] },
    ],
    cardFields: [
      { label: "Reg No.", keys: ["register_number", "reg_no"], strong: true },
      { label: "Date of Birth", keys: ["dob", "date_of_birth"], date: true },
      { label: "Baptism Name", keys: ["baptismal_name", "name"], strong: true },
      { label: "Baptism Date", keys: ["date_of_baptism", "baptism_date", "baptised_on"], date: true },
    ],
  },

  marriage: {
    type: "marriage",
    eyebrow: "MARRIAGE REPORT",
    title: "Marriage Records",
    subtitle: "View and print marriage certificates.",
    placeholder: "Search groom, bride, register no. or minister",
    emptyIcon: "heart",
    showYear: true,
    dateKeys: ["date", "marriage_date", "date_of_marriage", "married_on"],
    nameKeys: ["groom_name", "bride_name"],
    searchKeys: [
      "groom_name", "bride_name", "register_number", "reg_no",
      "minister_of_marriage",
    ],
    badge: {
      keys: ["marriage_type"],
      map: {
        ADD_BRIDE: { label: "Add Bride", tone: "red" },
        TRANSFER_BRIDE: { label: "Transfer Bride", tone: "blue" },
      },
    },
    stats: [
      { kind: "total", label: "Total Records", icon: "archive" },
      { kind: "match", label: "Add Bride", icon: "users",
        keys: ["marriage_type"], equals: "ADD_BRIDE" },
      { kind: "match", label: "Transfer Bride", icon: "user",
        keys: ["marriage_type"], equals: "TRANSFER_BRIDE" },
      { kind: "month", label: "This Month", icon: "calendar" },
    ],
    filters: [
      {
        id: "type", allLabel: "All Types",
        keys: ["marriage_type"],
        options: [
          { value: "ADD_BRIDE", label: "Add Bride" },
          { value: "TRANSFER_BRIDE", label: "Transfer Bride" },
        ],
      },
    ],
    cardFields: [
      { label: "Reg No.", keys: ["register_number", "reg_no"], strong: true },
      { label: "Date", keys: ["date", "marriage_date", "date_of_marriage", "married_on"], date: true },
      { label: "Groom House", keys: ["groom_house_name"] },
      { label: "Bride House", keys: ["bride_house_name"] },
    ],
  },

  death: {
    type: "death",
    eyebrow: "DEATH REPORT",
    title: "Death Records",
    subtitle: "View and print death certificates.",
    placeholder: "Search name, reg no., family, house or tomb type",
    emptyIcon: "flower",
    showYear: true,
    dateKeys: ["died_on", "date_of_death", "death_date"],
    nameKeys: ["name", "member_name", "deceased_name"],
    searchKeys: [
      "name", "member_name", "reg_no", "register_number",
      "family_name", "house_name", "tomb_type_name",
    ],
    badge: null,
    stats: [
      { kind: "total", label: "Total Records", icon: "archive" },
      { kind: "match", label: "Male", icon: "user", keys: ["gender"], equals: "MALE" },
      { kind: "match", label: "Female", icon: "user", keys: ["gender"], equals: "FEMALE" },
      { kind: "month", label: "This Month", icon: "calendar" },
    ],
    filters: [
      {
        id: "gender", allLabel: "All Genders", keys: ["gender"],
        options: [
          { value: "MALE", label: "Male" },
          { value: "FEMALE", label: "Female" },
        ],
      },
    ],
    cardFields: [
      { label: "Reg No.", keys: ["reg_no", "register_number"], strong: true },
      { label: "Died On", keys: ["died_on", "date_of_death", "death_date"], date: true },
      { label: "Age at Death", keys: ["age_at_death", "age"] },
      { label: "Tomb Type", keys: ["tomb_type_name"] },
    ],
  },
};

const API = {
  live: {
    baptism:  { listFn: listBaptisms,  getFn: getBaptism },
    marriage: { listFn: listMarriages, getFn: getMarriage },
    death:    { listFn: listDeaths,    getFn: getDeath },
  },
  legacy: {
    baptism:  { listFn: listLegacyBaptisms,  getFn: getLegacyBaptism },
    marriage: { listFn: listLegacyMarriages, getFn: getLegacyMarriage },
    death:    { listFn: listLegacyDeaths,    getFn: getLegacyDeath },
  },
};

export const getReportConfig = (type, source = "live") => {
  const base = BASE[type];
  const isLegacy = source === "legacy";

  return {
    ...base,
    ...API[isLegacy ? "legacy" : "live"][type],
    source,
    basePath: isLegacy ? `/reports/legacy/${type}` : `/reports/${type}`,
    eyebrow: isLegacy ? `LEGACY ${base.eyebrow}` : base.eyebrow,
    title: isLegacy ? `Legacy ${base.title}` : base.title,
    subtitle: isLegacy
      ? `Back-filled records from old register books. ${base.subtitle}`
      : base.subtitle,
  };
};

export const getSourceFromPath = (pathname = "") =>
  pathname.startsWith("/reports/legacy/") ? "legacy" : "live";