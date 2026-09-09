
// src/admin/pages/DioceseEdit.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Flex,
  Circle,
  Icon,
  Badge,
  Spinner,
} from "@chakra-ui/react";

import {
  LuHouse,
  LuChevronRight,
  LuLandmark,
  LuLock,
  LuMail,
  LuPhone,
  LuGlobe,
  LuCalendar,
  LuClock,
  LuArrowRight,
  LuArrowLeft,
} from "react-icons/lu";

import AdminLayout from "../components/AdminLayout";
import { toaster } from "../../components/ui/toaster";
import adminApi from "../services/adminApi";

const primaryMaroon = "#ae2050";

/* =======================================================
   COUNTRY OPTIONS
======================================================= */

const countryOptions = [
  { value: "IN", label: "🇮🇳 India" },
  { value: "US", label: "🇺🇸 United States" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "AE", label: "🇦🇪 United Arab Emirates" },
  { value: "SA", label: "🇸🇦 Saudi Arabia" },
  { value: "SG", label: "🇸🇬 Singapore" },
  { value: "MY", label: "🇲🇾 Malaysia" },
  { value: "DE", label: "🇩🇪 Germany" },
  { value: "FR", label: "🇫🇷 France" },
  { value: "IT", label: "🇮🇹 Italy" },
  { value: "ES", label: "🇪🇸 Spain" },
  { value: "PT", label: "🇵🇹 Portugal" },
  { value: "NL", label: "🇳🇱 Netherlands" },
  { value: "BE", label: "🇧🇪 Belgium" },
  { value: "CH", label: "🇨🇭 Switzerland" },
  { value: "SE", label: "🇸🇪 Sweden" },
  { value: "NO", label: "🇳🇴 Norway" },
  { value: "DK", label: "🇩🇰 Denmark" },
  { value: "FI", label: "🇫🇮 Finland" },
  { value: "JP", label: "🇯🇵 Japan" },
  { value: "KR", label: "🇰🇷 South Korea" },
  { value: "CN", label: "🇨🇳 China" },
  { value: "NZ", label: "🇳🇿 New Zealand" },
  { value: "ZA", label: "🇿🇦 South Africa" },
  { value: "BR", label: "🇧🇷 Brazil" },
  { value: "AR", label: "🇦🇷 Argentina" },
  { value: "MX", label: "🇲🇽 Mexico" },
  { value: "EG", label: "🇪🇬 Egypt" },
  { value: "NG", label: "🇳🇬 Nigeria" },
  { value: "KE", label: "🇰🇪 Kenya" },
  { value: "GH", label: "🇬🇭 Ghana" },
];

/* =======================================================
   STATE / PROVINCE OPTIONS BY COUNTRY
======================================================= */

const stateOptionsByCountry = {
  IN: [
    { value: "Kerala", label: "Kerala" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Delhi", label: "Delhi" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "West Bengal", label: "West Bengal" },
    { value: "Telangana", label: "Telangana" },
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Bihar", label: "Bihar" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Punjab", label: "Punjab" },
    { value: "Haryana", label: "Haryana" },
    { value: "Jharkhand", label: "Jharkhand" },
    { value: "Assam", label: "Assam" },
    { value: "Odisha", label: "Odisha" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
    { value: "Uttarakhand", label: "Uttarakhand" },
    { value: "Goa", label: "Goa" },
  ],

  US: [
    { value: "Alabama", label: "Alabama" },
    { value: "Alaska", label: "Alaska" },
    { value: "Arizona", label: "Arizona" },
    { value: "Arkansas", label: "Arkansas" },
    { value: "California", label: "California" },
    { value: "Colorado", label: "Colorado" },
    { value: "Connecticut", label: "Connecticut" },
    { value: "Delaware", label: "Delaware" },
    { value: "Florida", label: "Florida" },
    { value: "Georgia", label: "Georgia" },
    { value: "Hawaii", label: "Hawaii" },
    { value: "Idaho", label: "Idaho" },
    { value: "Illinois", label: "Illinois" },
    { value: "Indiana", label: "Indiana" },
    { value: "Iowa", label: "Iowa" },
    { value: "Kansas", label: "Kansas" },
    { value: "Kentucky", label: "Kentucky" },
    { value: "Louisiana", label: "Louisiana" },
    { value: "Maine", label: "Maine" },
    { value: "Maryland", label: "Maryland" },
    { value: "Massachusetts", label: "Massachusetts" },
    { value: "Michigan", label: "Michigan" },
    { value: "Minnesota", label: "Minnesota" },
    { value: "Mississippi", label: "Mississippi" },
    { value: "Missouri", label: "Missouri" },
    { value: "Montana", label: "Montana" },
    { value: "Nebraska", label: "Nebraska" },
    { value: "Nevada", label: "Nevada" },
    { value: "New Hampshire", label: "New Hampshire" },
    { value: "New Jersey", label: "New Jersey" },
    { value: "New Mexico", label: "New Mexico" },
    { value: "New York", label: "New York" },
    { value: "North Carolina", label: "North Carolina" },
    { value: "North Dakota", label: "North Dakota" },
    { value: "Ohio", label: "Ohio" },
    { value: "Oklahoma", label: "Oklahoma" },
    { value: "Oregon", label: "Oregon" },
    { value: "Pennsylvania", label: "Pennsylvania" },
    { value: "Rhode Island", label: "Rhode Island" },
    { value: "South Carolina", label: "South Carolina" },
    { value: "South Dakota", label: "South Dakota" },
    { value: "Tennessee", label: "Tennessee" },
    { value: "Texas", label: "Texas" },
    { value: "Utah", label: "Utah" },
    { value: "Vermont", label: "Vermont" },
    { value: "Virginia", label: "Virginia" },
    { value: "Washington", label: "Washington" },
    { value: "West Virginia", label: "West Virginia" },
    { value: "Wisconsin", label: "Wisconsin" },
    { value: "Wyoming", label: "Wyoming" },
  ],

  CA: [
    { value: "Alberta", label: "Alberta" },
    { value: "British Columbia", label: "British Columbia" },
    { value: "Manitoba", label: "Manitoba" },
    { value: "New Brunswick", label: "New Brunswick" },
    {
      value: "Newfoundland and Labrador",
      label: "Newfoundland and Labrador",
    },
    { value: "Nova Scotia", label: "Nova Scotia" },
    { value: "Ontario", label: "Ontario" },
    {
      value: "Prince Edward Island",
      label: "Prince Edward Island",
    },
    { value: "Quebec", label: "Quebec" },
    { value: "Saskatchewan", label: "Saskatchewan" },
  ],

  GB: [
    { value: "England", label: "England" },
    { value: "Scotland", label: "Scotland" },
    { value: "Wales", label: "Wales" },
    { value: "Northern Ireland", label: "Northern Ireland" },
  ],

  AU: [
    { value: "New South Wales", label: "New South Wales" },
    { value: "Queensland", label: "Queensland" },
    { value: "South Australia", label: "South Australia" },
    { value: "Tasmania", label: "Tasmania" },
    { value: "Victoria", label: "Victoria" },
    { value: "Western Australia", label: "Western Australia" },
    {
      value: "Australian Capital Territory",
      label: "Australian Capital Territory",
    },
    {
      value: "Northern Territory",
      label: "Northern Territory",
    },
  ],

  AE: [
    { value: "Abu Dhabi", label: "Abu Dhabi" },
    { value: "Ajman", label: "Ajman" },
    { value: "Dubai", label: "Dubai" },
    { value: "Fujairah", label: "Fujairah" },
    { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
    { value: "Sharjah", label: "Sharjah" },
    {
      value: "Umm Al Quwain",
      label: "Umm Al Quwain",
    },
  ],

  SA: [
    { value: "Riyadh", label: "Riyadh" },
    { value: "Makkah", label: "Makkah" },
    { value: "Madinah", label: "Madinah" },
    {
      value: "Eastern Province",
      label: "Eastern Province",
    },
    { value: "Asir", label: "Asir" },
    { value: "Tabuk", label: "Tabuk" },
    { value: "Hail", label: "Hail" },
    { value: "Jazan", label: "Jazan" },
    { value: "Najran", label: "Najran" },
    { value: "Al Bahah", label: "Al Bahah" },
    { value: "Al Jawf", label: "Al Jawf" },
    {
      value: "Northern Borders",
      label: "Northern Borders",
    },
    { value: "Qassim", label: "Qassim" },
  ],

  SG: [
    { value: "Central Region", label: "Central Region" },
    { value: "East Region", label: "East Region" },
    { value: "North Region", label: "North Region" },
    {
      value: "North-East Region",
      label: "North-East Region",
    },
    { value: "West Region", label: "West Region" },
  ],

  MY: [
    { value: "Johor", label: "Johor" },
    { value: "Kedah", label: "Kedah" },
    { value: "Kelantan", label: "Kelantan" },
    { value: "Malacca", label: "Malacca" },
    {
      value: "Negeri Sembilan",
      label: "Negeri Sembilan",
    },
    { value: "Pahang", label: "Pahang" },
    { value: "Penang", label: "Penang" },
    { value: "Perak", label: "Perak" },
    { value: "Perlis", label: "Perlis" },
    { value: "Sabah", label: "Sabah" },
    { value: "Sarawak", label: "Sarawak" },
    { value: "Selangor", label: "Selangor" },
    { value: "Terengganu", label: "Terengganu" },
    { value: "Kuala Lumpur", label: "Kuala Lumpur" },
    { value: "Putrajaya", label: "Putrajaya" },
    { value: "Labuan", label: "Labuan" },
  ],

  DE: [
    { value: "Bavaria", label: "Bavaria" },
    { value: "Berlin", label: "Berlin" },
    { value: "Brandenburg", label: "Brandenburg" },
    { value: "Hesse", label: "Hesse" },
    { value: "Hamburg", label: "Hamburg" },
    { value: "Lower Saxony", label: "Lower Saxony" },
    {
      value: "North Rhine-Westphalia",
      label: "North Rhine-Westphalia",
    },
    {
      value: "Rhineland-Palatinate",
      label: "Rhineland-Palatinate",
    },
    { value: "Saxony", label: "Saxony" },
    {
      value: "Saxony-Anhalt",
      label: "Saxony-Anhalt",
    },
    {
      value: "Schleswig-Holstein",
      label: "Schleswig-Holstein",
    },
    { value: "Thuringia", label: "Thuringia" },
  ],

  FR: [
    {
      value: "Auvergne-Rhône-Alpes",
      label: "Auvergne-Rhône-Alpes",
    },
    {
      value: "Bourgogne-Franche-Comté",
      label: "Bourgogne-Franche-Comté",
    },
    { value: "Brittany", label: "Brittany" },
    {
      value: "Île-de-France",
      label: "Île-de-France",
    },
    { value: "Normandy", label: "Normandy" },
    {
      value: "Nouvelle-Aquitaine",
      label: "Nouvelle-Aquitaine",
    },
    { value: "Occitanie", label: "Occitanie" },
    {
      value: "Provence-Alpes-Côte d'Azur",
      label: "Provence-Alpes-Côte d'Azur",
    },
  ],

  IT: [
    { value: "Abruzzo", label: "Abruzzo" },
    { value: "Apulia", label: "Apulia" },
    { value: "Calabria", label: "Calabria" },
    { value: "Campania", label: "Campania" },
    {
      value: "Emilia-Romagna",
      label: "Emilia-Romagna",
    },
    { value: "Lazio", label: "Lazio" },
    { value: "Liguria", label: "Liguria" },
    { value: "Lombardy", label: "Lombardy" },
    { value: "Piedmont", label: "Piedmont" },
    { value: "Sardinia", label: "Sardinia" },
    { value: "Sicily", label: "Sicily" },
    { value: "Tuscany", label: "Tuscany" },
    { value: "Veneto", label: "Veneto" },
  ],

  ES: [
    { value: "Andalusia", label: "Andalusia" },
    { value: "Aragon", label: "Aragon" },
    { value: "Asturias", label: "Asturias" },
    {
      value: "Balearic Islands",
      label: "Balearic Islands",
    },
    {
      value: "Basque Country",
      label: "Basque Country",
    },
    {
      value: "Canary Islands",
      label: "Canary Islands",
    },
    { value: "Catalonia", label: "Catalonia" },
    { value: "Galicia", label: "Galicia" },
    { value: "Madrid", label: "Madrid" },
    { value: "Valencia", label: "Valencia" },
  ],

  PT: [
    { value: "Lisbon", label: "Lisbon" },
    { value: "Porto", label: "Porto" },
    { value: "Braga", label: "Braga" },
    { value: "Aveiro", label: "Aveiro" },
    { value: "Coimbra", label: "Coimbra" },
    { value: "Faro", label: "Faro" },
    { value: "Madeira", label: "Madeira" },
  ],

  NL: [
    { value: "Drenthe", label: "Drenthe" },
    { value: "Flevoland", label: "Flevoland" },
    { value: "Friesland", label: "Friesland" },
    { value: "Gelderland", label: "Gelderland" },
    { value: "Groningen", label: "Groningen" },
    { value: "Limburg", label: "Limburg" },
    {
      value: "North Brabant",
      label: "North Brabant",
    },
    {
      value: "North Holland",
      label: "North Holland",
    },
    { value: "Overijssel", label: "Overijssel" },
    {
      value: "South Holland",
      label: "South Holland",
    },
    { value: "Utrecht", label: "Utrecht" },
    { value: "Zeeland", label: "Zeeland" },
  ],

  BE: [
    {
      value: "Brussels-Capital",
      label: "Brussels-Capital",
    },
    { value: "Flanders", label: "Flanders" },
    { value: "Wallonia", label: "Wallonia" },
  ],

  CH: [
    { value: "Aargau", label: "Aargau" },
    { value: "Bern", label: "Bern" },
    { value: "Geneva", label: "Geneva" },
    { value: "Lucerne", label: "Lucerne" },
    { value: "St. Gallen", label: "St. Gallen" },
    { value: "Ticino", label: "Ticino" },
    { value: "Valais", label: "Valais" },
    { value: "Vaud", label: "Vaud" },
    { value: "Zurich", label: "Zurich" },
  ],

  SE: [
    {
      value: "Stockholm County",
      label: "Stockholm County",
    },
    {
      value: "Västra Götaland",
      label: "Västra Götaland",
    },
    { value: "Skåne", label: "Skåne" },
    {
      value: "Uppsala County",
      label: "Uppsala County",
    },
  ],

  NO: [
    { value: "Oslo", label: "Oslo" },
    { value: "Rogaland", label: "Rogaland" },
    { value: "Vestland", label: "Vestland" },
    { value: "Trøndelag", label: "Trøndelag" },
    { value: "Nordland", label: "Nordland" },
    { value: "Innlandet", label: "Innlandet" },
  ],

  DK: [
    {
      value: "Capital Region",
      label: "Capital Region",
    },
    {
      value: "Central Denmark",
      label: "Central Denmark",
    },
    {
      value: "North Denmark",
      label: "North Denmark",
    },
    {
      value: "Region Zealand",
      label: "Region Zealand",
    },
    {
      value: "Region of Southern Denmark",
      label: "Region of Southern Denmark",
    },
  ],

  FI: [
    { value: "Uusimaa", label: "Uusimaa" },
    { value: "Pirkanmaa", label: "Pirkanmaa" },
    {
      value: "Southwest Finland",
      label: "Southwest Finland",
    },
    {
      value: "North Ostrobothnia",
      label: "North Ostrobothnia",
    },
    { value: "Lapland", label: "Lapland" },
  ],

  JP: [
    { value: "Tokyo", label: "Tokyo" },
    { value: "Osaka", label: "Osaka" },
    { value: "Kyoto", label: "Kyoto" },
    { value: "Hokkaido", label: "Hokkaido" },
    { value: "Aichi", label: "Aichi" },
    { value: "Fukuoka", label: "Fukuoka" },
    { value: "Okinawa", label: "Okinawa" },
  ],

  KR: [
    { value: "Seoul", label: "Seoul" },
    { value: "Busan", label: "Busan" },
    { value: "Incheon", label: "Incheon" },
    { value: "Daegu", label: "Daegu" },
    { value: "Daejeon", label: "Daejeon" },
    { value: "Gwangju", label: "Gwangju" },
    { value: "Jeju", label: "Jeju" },
  ],

  CN: [
    { value: "Beijing", label: "Beijing" },
    { value: "Shanghai", label: "Shanghai" },
    { value: "Guangdong", label: "Guangdong" },
    { value: "Jiangsu", label: "Jiangsu" },
    { value: "Zhejiang", label: "Zhejiang" },
    { value: "Sichuan", label: "Sichuan" },
    { value: "Hubei", label: "Hubei" },
  ],

  NZ: [
    { value: "Auckland", label: "Auckland" },
    {
      value: "Bay of Plenty",
      label: "Bay of Plenty",
    },
    { value: "Canterbury", label: "Canterbury" },
    {
      value: "Hawke's Bay",
      label: "Hawke's Bay",
    },
    { value: "Otago", label: "Otago" },
    { value: "Waikato", label: "Waikato" },
    { value: "Wellington", label: "Wellington" },
  ],

  ZA: [
    {
      value: "Eastern Cape",
      label: "Eastern Cape",
    },
    { value: "Free State", label: "Free State" },
    { value: "Gauteng", label: "Gauteng" },
    {
      value: "KwaZulu-Natal",
      label: "KwaZulu-Natal",
    },
    { value: "Limpopo", label: "Limpopo" },
    { value: "Mpumalanga", label: "Mpumalanga" },
    { value: "North West", label: "North West" },
    {
      value: "Northern Cape",
      label: "Northern Cape",
    },
    {
      value: "Western Cape",
      label: "Western Cape",
    },
  ],

  BR: [
    { value: "São Paulo", label: "São Paulo" },
    {
      value: "Rio de Janeiro",
      label: "Rio de Janeiro",
    },
    {
      value: "Minas Gerais",
      label: "Minas Gerais",
    },
    { value: "Bahia", label: "Bahia" },
    { value: "Paraná", label: "Paraná" },
    {
      value: "Rio Grande do Sul",
      label: "Rio Grande do Sul",
    },
    { value: "Pernambuco", label: "Pernambuco" },
    { value: "Ceará", label: "Ceará" },
  ],

  AR: [
    {
      value: "Buenos Aires",
      label: "Buenos Aires",
    },
    { value: "Córdoba", label: "Córdoba" },
    { value: "Santa Fe", label: "Santa Fe" },
    { value: "Mendoza", label: "Mendoza" },
    { value: "Tucumán", label: "Tucumán" },
  ],

  MX: [
    {
      value: "Aguascalientes",
      label: "Aguascalientes",
    },
    {
      value: "Baja California",
      label: "Baja California",
    },
    { value: "Chihuahua", label: "Chihuahua" },
    { value: "Jalisco", label: "Jalisco" },
    {
      value: "Mexico City",
      label: "Mexico City",
    },
    {
      value: "Nuevo León",
      label: "Nuevo León",
    },
    { value: "Puebla", label: "Puebla" },
    {
      value: "Quintana Roo",
      label: "Quintana Roo",
    },
    { value: "Yucatán", label: "Yucatán" },
  ],

  EG: [
    { value: "Cairo", label: "Cairo" },
    {
      value: "Alexandria",
      label: "Alexandria",
    },
    { value: "Giza", label: "Giza" },
    { value: "Dakahlia", label: "Dakahlia" },
    { value: "Red Sea", label: "Red Sea" },
    {
      value: "South Sinai",
      label: "South Sinai",
    },
  ],

  NG: [
    { value: "Abuja", label: "Abuja" },
    { value: "Lagos", label: "Lagos" },
    { value: "Kano", label: "Kano" },
    { value: "Rivers", label: "Rivers" },
    { value: "Oyo", label: "Oyo" },
    { value: "Kaduna", label: "Kaduna" },
  ],

  KE: [
    { value: "Nairobi", label: "Nairobi" },
    { value: "Mombasa", label: "Mombasa" },
    { value: "Kisumu", label: "Kisumu" },
    { value: "Nakuru", label: "Nakuru" },
    { value: "Kiambu", label: "Kiambu" },
  ],

    GH: [
    {
      value: "Greater Accra",
      label: "Greater Accra",
    },
    { value: "Ashanti", label: "Ashanti" },
    { value: "Central", label: "Central" },
    { value: "Eastern", label: "Eastern" },
    { value: "Northern", label: "Northern" },
    { value: "Western", label: "Western" },
  ],
};

/* =======================================================
   COUNTRY CALLING CODES
======================================================= */

const countryCallingCodes = {
  IN: "91",
  US: "1",
  GB: "44",
  CA: "1",
  AU: "61",
  AE: "971",
  SA: "966",
  SG: "65",
  MY: "60",
  DE: "49",
  FR: "33",
  IT: "39",
  ES: "34",
  PT: "351",
  NL: "31",
  BE: "32",
  CH: "41",
  SE: "46",
  NO: "47",
  DK: "45",
  FI: "358",
  JP: "81",
  KR: "82",
  CN: "86",
  NZ: "64",
  ZA: "27",
  BR: "55",
  AR: "54",
  MX: "52",
  EG: "20",
  NG: "234",
  KE: "254",
  GH: "233",
};

/* =======================================================
   HELPERS
======================================================= */

const getStateOptions = (country) => {
  return stateOptionsByCountry[country] || [];
};

const getDioceseCode = (id) => {
  if (!id) return "—";

  return `DIO-${String(id).padStart(3, "0")}`;
};

const normalizeWebsite = (website) => {
  if (!website) return "";

  let value = website.trim();

  if (!value) return "";

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  return value;
};

const isValidWebsite = (website) => {
  if (!website) return true;

  let value = website.trim();

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const url = new URL(value);

    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname.includes(".") &&
      !url.hostname.startsWith(".") &&
      !url.hostname.endsWith(".")
    );
  } catch {
    return false;
  }
};

/* =======================================================
   PHONE HELPER
======================================================= */

const getLocalPhoneNumber = (phone, country) => {
  if (!phone) return "";

  const value = String(phone).trim();
  const digits = value.replace(/\D/g, "");

  const callingCode = countryCallingCodes[country];

  if (
    callingCode &&
    digits.startsWith(callingCode)
  ) {
    return digits.slice(callingCode.length);
  }

  return digits;
};

/* =======================================================
   DATE FORMAT
======================================================= */

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =======================================================
   COMPONENT
======================================================= */

const DioceseEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    metropolitan_name: "",
    email: "",
    phone_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    website: "",
    is_active: true,
    created_at: "",
    updated_at: "",
    church_count: 0,
  });

  const [errors, setErrors] = useState({});

  /* =====================================================
     MAP API DATA
  ===================================================== */

  const mapDioceseData = (diocese) => {
    const country = diocese?.country || "";

    return {
      id: diocese?.id || "",
      name: diocese?.name || "",
      metropolitan_name:
        diocese?.metropolitan_name || "",
      email: diocese?.email || "",

      phone_number: getLocalPhoneNumber(
        diocese?.phone_number || "",
        country
      ),

      address_line1:
        diocese?.address_line1 || "",
      address_line2:
        diocese?.address_line2 || "",
      city: diocese?.city || "",
      state: diocese?.state || "",
      country,
      postal_code:
        diocese?.postal_code || "",
      website: diocese?.website || "",
      is_active:
        diocese?.is_active !== false,

      created_at:
        diocese?.created_at ??
        diocese?.created ??
        "",

      updated_at:
        diocese?.updated_at ??
        diocese?.updated ??
        "",

      church_count:
        diocese?.church_count ??
        diocese?.churches_count ??
        diocese?.churches?.length ??
        0,
    };
  };

  /* =====================================================
     EXTRACT DIOCESE
  ===================================================== */

  const extractDiocese = (responseData) => {
    if (!responseData) return null;

    if (
      responseData.id &&
      (
        responseData.name ||
        responseData.created_at ||
        responseData.updated_at
      )
    ) {
      return responseData;
    }

    if (responseData.data) {
      const data = responseData.data;

      if (data.diocese) {
        return data.diocese;
      }

      if (data.data) {
        return data.data;
      }

      if (data.id) {
        return data;
      }
    }

    if (responseData.diocese) {
      return responseData.diocese;
    }

    return null;
  };

  /* =====================================================
     FETCH DIOCESE
  ===================================================== */

  const fetchDiocese = async (dioceseId) => {
    setIsFetching(true);

    try {
      const response =
        await adminApi.getDioceseDetail(
          dioceseId
        );

      console.log(
        "FULL DIOCESE DETAIL RESPONSE:",
        response.data
      );

      const diocese =
        extractDiocese(response.data);

      console.log(
        "EXTRACTED DIOCESE:",
        diocese
      );

      if (!diocese) {
        throw new Error(
          "Diocese data not found in API response."
        );
      }

      setFormData(
        mapDioceseData(diocese)
      );
    } catch (error) {
      console.error(
        "Error fetching diocese:",
        error
      );

      toaster.create({
        title: "Error",
        description:
          "Failed to load diocese details.",
        type: "error",
        duration: 5000,
      });

      navigate("/admin/dioceses");
    } finally {
      setIsFetching(false);
    }
  };

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    if (!id) {
      navigate("/admin/dioceses");
      return;
    }

    if (location.state?.diocese) {
      setFormData(
        mapDioceseData(
          location.state.diocese
        )
      );
    }

    fetchDiocese(id);
  }, [
    id,
    navigate,
    location.state,
  ]);

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone_number") {
      const digitsOnly =
        value.replace(/\D/g, "");

      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /* =====================================================
     COUNTRY / STATE CHANGE
  ===================================================== */

  const handleSelectChange = (
    name,
    value
  ) => {
    if (name === "country") {
      setFormData((prev) => ({
        ...prev,

        country: value,

        /*
         * IMPORTANT:
         * Clear previous state whenever country changes.
         */
        state: "",
      }));

      setErrors((prev) => ({
        ...prev,
        country: "",
        state: "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name =
        "Diocese name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email =
        "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      newErrors.email =
        "Invalid email format";
    }

    if (
      formData.website &&
      !isValidWebsite(
        formData.website
      )
    ) {
      newErrors.website =
        "Please enter a valid website";
    }

    if (
      !formData.phone_number.trim()
    ) {
      newErrors.phone_number =
        "Contact number is required";
    }

    if (
      !formData.address_line1.trim()
    ) {
      newErrors.address_line1 =
        "Address Line 1 is required";
    }

    if (!formData.city.trim()) {
      newErrors.city =
        "City is required";
    }

    if (!formData.country) {
      newErrors.country =
        "Country is required";
    }

    if (!formData.state) {
      newErrors.state =
        "State / Province is required";
    }

    if (
      !formData.postal_code.trim()
    ) {
      newErrors.postal_code =
        "Postal code is required";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const callingCode =
        countryCallingCodes[
          formData.country
        ] || "";

      const localPhone =
        formData.phone_number
          .replace(/\D/g, "")
          .trim();

      /*
       * Country code is added only here.
       * User never sees it inside the input.
       */
      const internationalPhone =
        callingCode
          ? `+${callingCode}${localPhone}`
          : localPhone;

      const submitData = {
        name: formData.name.trim(),

        metropolitan_name:
          formData.metropolitan_name.trim(),

        email: formData.email.trim(),

        phone_number:
          internationalPhone,

        address_line1:
          formData.address_line1.trim(),

        address_line2:
          formData.address_line2.trim(),

        city: formData.city.trim(),

        /*
         * Address order:
         * City
         * Country
         * State
         * Postal Code
         */
        country: formData.country,

        state: formData.state,

        postal_code:
          formData.postal_code.trim(),

        website:
          normalizeWebsite(
            formData.website
          ),

        is_active:
          formData.is_active,
      };

      console.log(
        "Updating diocese:",
        submitData
      );

      await adminApi.updateDiocese(
        formData.id,
        submitData
      );

      toaster.create({
        title: "Diocese updated",
        description:
          "Your changes have been saved successfully.",
        type: "success",
        duration: 3000,
      });

      navigate("/admin/dioceses");
    } catch (error) {
      console.error(
        "Error updating diocese:",
        error
      );

      console.error(
        "Error response:",
        error.response?.data
      );

      let errorMsg =
        "Failed to update diocese.";

      if (error.response?.data) {
        const responseData =
          error.response.data;

        if (
          typeof responseData ===
          "object"
        ) {
          if (responseData.errors) {
            const backendErrors = [];

            Object.entries(
              responseData.errors
            ).forEach(
              ([field, value]) => {
                backendErrors.push(
                  `${field}: ${
                    Array.isArray(value)
                      ? value.join(", ")
                      : value
                  }`
                );
              }
            );

            if (
              backendErrors.length
            ) {
              errorMsg =
                backendErrors.join(
                  "; "
                );
            }
          } else if (
            responseData.message
          ) {
            errorMsg =
              responseData.message;
          } else if (
            responseData.error
          ) {
            errorMsg =
              responseData.error;
          } else if (
            responseData.detail
          ) {
            errorMsg =
              responseData.detail;
          }
        } else if (
          typeof responseData ===
          "string"
        ) {
          errorMsg = responseData;
        }
      }

      toaster.create({
        title: "Save failed",
        description: errorMsg,
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================================================
     FIELD PROPS
  ===================================================== */

  const fieldProps = {
    size: "sm",
    height: "28px",
    fontSize: "12px",
    borderRadius: "md",
    borderWidth: "1.5px",
    borderColor: "gray.200",
    bg: "white",

    _hover: {
      borderColor: "gray.300",
    },

    _focus: {
      borderColor: primaryMaroon,
      boxShadow:
        "0 0 0 1px rgba(174,32,80,0.1)",
    },
  };

  /* =====================================================
     LABEL
  ===================================================== */

  const Label = ({
    children,
    required,
  }) => (
    <Text
      fontSize="2xs"
      fontWeight="600"
      color="gray.700"
      mb={0.5}
    >
      {children}

      {required && (
        <Box
          as="span"
          color="#e53e3e"
          ml={1}
        >
          *
        </Box>
      )}
    </Text>
  );

  /* =====================================================
     SELECT FIELD
  ===================================================== */

  const SelectField = ({
    value,
    onChange,
    options,
    placeholder,
    error,
  }) => (
    <Box
      as="select"
      value={value || ""}
      onChange={(e) =>
        onChange(e.target.value)
      }
      w="100%"
      h="28px"
      px={2.5}
      borderRadius="md"
      border="1.5px solid"
      borderColor={
        error
          ? "red.400"
          : "gray.200"
      }
      bg="white"
      fontSize="12px"
      cursor="pointer"
      _hover={{
        borderColor: "gray.300",
      }}
      _focus={{
        outline: "none",
        borderColor:
          primaryMaroon,
        boxShadow:
          "0 0 0 1px rgba(174,32,80,0.1)",
      }}
    >
      <option value="">
        {placeholder}
      </option>

      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </Box>
  );

  /* =====================================================
     LOADING
  ===================================================== */

  if (isFetching) {
    return (
      <AdminLayout>
        <Container
          maxW="container.xl"
          py={4}
        >
          <Flex
            justify="center"
            align="center"
            minH="400px"
          >
            <Spinner
              size="xl"
              color={primaryMaroon}
            />
          </Flex>
        </Container>
      </AdminLayout>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <AdminLayout>
      <Container
        maxW="container.2xl"
        px={{
          base: 4,
          md: 6,
          xl: 7,
        }}
        py={{
          base: 2,
          md: 3,
        }}
      >
        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <HStack
          spacing={2}
          mb={3}
          color="gray.500"
          fontSize="xs"
          fontWeight="500"
        >
          <Box
            as="button"
            display="flex"
            alignItems="center"
            _hover={{
              color: primaryMaroon,
            }}
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
          >
            <LuHouse size={13} />
          </Box>

          <LuChevronRight size={11} />

          <Box
            as="button"
            _hover={{
              color: primaryMaroon,
            }}
            onClick={() =>
              navigate(
                "/admin/dioceses"
              )
            }
          >
            Churches
          </Box>

          <LuChevronRight size={11} />

          <Text color="gray.600">
            Dioceses
          </Text>

          <LuChevronRight size={11} />

          <Text
            color="gray.700"
            noOfLines={1}
          >
            {formData.name ||
              "Diocese"}
          </Text>

          <LuChevronRight size={11} />

          <Text color="gray.600">
            Edit
          </Text>
        </HStack>

        {/* =================================================
            PAGE HEADING
        ================================================= */}

        <Box mb={3}>
          <Text
            fontSize="2xs"
            fontWeight="700"
            color={primaryMaroon}
            textTransform="uppercase"
            letterSpacing="0.06em"
            mb={0.5}
          >
            Diocese Management
          </Text>

          <Heading
            fontSize={{
              base: "xl",
              md: "2xl",
            }}
            lineHeight="1.15"
            fontWeight="800"
            color="#17243a"
          >
            Edit Diocese
          </Heading>

          <Text
            color="#64748b"
            fontSize="2xs"
            mt={0.5}
          >
            Update diocese, metropolitan,
            contact and address information.
          </Text>
        </Box>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <Box
          bg="white"
          border="1px solid"
          borderColor="#e6e9ee"
          borderRadius="10px"
          boxShadow="0 2px 12px rgba(20, 30, 45, 0.035)"
          px={{
            base: 3,
            md: 4,
          }}
          py={{
            base: 3,
            md: 3.5,
          }}
          mb={3}
        >
          <Flex
            align="center"
            gap={{
              base: 3,
              md: 4,
            }}
            flexWrap="wrap"
          >
            <Circle
              size={{
                base: "50px",
                md: "60px",
              }}
              bg="#fff1f4"
              border="1px solid"
              borderColor="#f7d8df"
              color={primaryMaroon}
              flexShrink={0}
            >
              <Icon
                as={LuLandmark}
                boxSize={{
                  base: 6,
                  md: 7,
                }}
              />
            </Circle>

            <Box
              flex="1"
              minW={{
                base: "180px",
                md: "200px",
              }}
            >
              <Heading
                fontSize={{
                  base: "md",
                  md: "lg",
                }}
                fontWeight="800"
                color="#17243a"
                mb={1}
              >
                {formData.name ||
                  "Diocese"}
              </Heading>

              <Flex
                align="center"
                flexWrap="wrap"
                gap={{
                  base: 2,
                  md: 3,
                }}
                color="#334155"
                fontSize={{
                  base: "2xs",
                  md: "xs",
                }}
              >
                <Text>
                  {getDioceseCode(
                    formData.id
                  )}
                </Text>

                <Box
                  display={{
                    base: "none",
                    md: "block",
                  }}
                  w="1px"
                  h="18px"
                  bg="#d9dde4"
                />

                <Text>
                  {formData.metropolitan_name ||
                    "—"}
                </Text>

                <Badge
                  bg="#fff0f3"
                  color={primaryMaroon}
                  borderRadius="4px"
                  px={2.5}
                  py={1}
                  fontSize="2xs"
                  fontWeight="700"
                >
                  {formData.church_count ??
                    0}{" "}
                  Churches
                </Badge>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* =================================================
            MAIN
        ================================================= */}

        <Flex
          gap={3}
          align="stretch"
          direction={{
            base: "column",
            xl: "row",
          }}
        >
          {/* =================================================
              FORM
          ================================================= */}

          <Box
            as="form"
            onSubmit={handleSubmit}
            flex="1"
            minW={0}
            bg="white"
            border="1px solid"
            borderColor="#e2e6eb"
            borderRadius="10px"
            boxShadow="0 2px 12px rgba(20, 30, 45, 0.035)"
            p={{
              base: 3,
              md: 4,
            }}
          >
            <Heading
              fontSize="md"
              fontWeight="700"
              color="#17243a"
              mb={3}
            >
              Diocese Information
            </Heading>

            {/* =================================================
                DIOCESE CODE + NAME
            ================================================= */}

            <Flex
              gap={3}
              flexWrap={{
                base: "wrap",
                md: "nowrap",
              }}
              mb={2.5}
            >
              <Box
                w={{
                  base: "100%",
                  md: "50%",
                }}
              >
                <Label required>
                  Diocese Code
                </Label>

                <Box position="relative">
                  <Input
                    value={getDioceseCode(
                      formData.id
                    )}
                    isReadOnly
                    {...fieldProps}
                    pr="30px"
                    bg="#fafafa"
                    color="#64748b"
                  />

                  <Box
                    position="absolute"
                    right="10px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="#64748b"
                  >
                    <LuLock size={13} />
                  </Box>
                </Box>
              </Box>

              <Box
                w={{
                  base: "100%",
                  md: "50%",
                }}
              >
                <Label required>
                  Diocese Name
                </Label>

                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter diocese name"
                  {...fieldProps}
                  borderColor={
                    errors.name
                      ? "red.400"
                      : "#dfe3e8"
                  }
                />

                {errors.name && (
                  <Text
                    fontSize="2xs"
                    color="red.500"
                    mt={0.5}
                  >
                    {errors.name}
                  </Text>
                )}
              </Box>
            </Flex>

            {/* =================================================
                METROPOLITAN
            ================================================= */}

            <Box mb={2.5}>
              <Label required>
                Metropolitan Name
              </Label>

              <Input
                name="metropolitan_name"
                value={
                  formData.metropolitan_name
                }
                onChange={handleChange}
                placeholder="Enter metropolitan name"
                {...fieldProps}
              />
            </Box>

            {/* =================================================
                CONTACT INFORMATION
            ================================================= */}

            <Flex
              gap={3}
              flexWrap="wrap"
              mb={3}
            >
              {/* EMAIL */}

              <Box
                flex="1"
                minW={{
                  base: "100%",
                  md: "180px",
                }}
              >
                <Label required>
                  Mail ID
                </Label>

                <Box position="relative">
                  <Box
                    position="absolute"
                    left="10px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="#94a3b8"
                    zIndex={2}
                    pointerEvents="none"
                  >
                    <LuMail size={13} />
                  </Box>

                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="metropolitan@example.org"
                    pl="32px"
                    {...fieldProps}
                    borderColor={
                      errors.email
                        ? "red.400"
                        : "#dfe3e8"
                    }
                  />
                </Box>

                {errors.email && (
                  <Text
                    fontSize="2xs"
                    color="red.500"
                    mt={0.5}
                  >
                    {errors.email}
                  </Text>
                )}
              </Box>

              {/* WEBSITE */}

              <Box
                flex="1"
                minW={{
                  base: "100%",
                  md: "180px",
                }}
              >
                <Label>
                  Website
                </Label>

                <Box position="relative">
                  <Box
                    position="absolute"
                    left="10px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="#94a3b8"
                    zIndex={2}
                    pointerEvents="none"
                  >
                    <LuGlobe size={13} />
                  </Box>

                  <Input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="www.example.org"
                    pl="32px"
                    {...fieldProps}
                    borderColor={
                      errors.website
                        ? "red.400"
                        : "#dfe3e8"
                    }
                  />
                </Box>

                {errors.website && (
                  <Text
                    fontSize="2xs"
                    color="red.500"
                    mt={0.5}
                  >
                    {errors.website}
                  </Text>
                )}
              </Box>

              {/* PHONE */}

              <Box
                flex="1"
                minW={{
                  base: "100%",
                  md: "180px",
                }}
              >
                <Label required>
                  Contact Details
                </Label>

                <Box position="relative">
                  <Box
                    position="absolute"
                    left="10px"
                    top="50%"
                    transform="translateY(-50%)"
                    color="#94a3b8"
                    zIndex={2}
                    pointerEvents="none"
                  >
                    <LuPhone size={13} />
                  </Box>

                  <Input
                    name="phone_number"
                    type="tel"
                    value={
                      formData.phone_number
                    }
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    pl="32px"
                    {...fieldProps}
                    borderColor={
                      errors.phone_number
                        ? "red.400"
                        : "#dfe3e8"
                    }
                  />
                </Box>

                {errors.phone_number && (
                  <Text
                    fontSize="2xs"
                    color="red.500"
                    mt={0.5}
                  >
                    {errors.phone_number}
                  </Text>
                )}
              </Box>
            </Flex>

            {/* =================================================
                ADDRESS
            ================================================= */}

            <Box
              borderTop="1px solid"
              borderColor="#edf0f3"
              pt={3}
            >
              <Heading
                fontSize="sm"
                fontWeight="700"
                color="#17243a"
                mb={2}
              >
                Address
              </Heading>

              {/* ADDRESS LINE 1 */}

              <Box mb={2.5}>
                <Label required>
                  Address Line 1
                </Label>

                <Input
                  name="address_line1"
                  value={
                    formData.address_line1
                  }
                  onChange={handleChange}
                  placeholder="Street address, building name"
                  {...fieldProps}
                  borderColor={
                    errors.address_line1
                      ? "red.400"
                      : "#dfe3e8"
                  }
                />

                {errors.address_line1 && (
                  <Text
                    fontSize="2xs"
                    color="red.500"
                    mt={0.5}
                  >
                    {errors.address_line1}
                  </Text>
                )}
              </Box>

              {/* ADDRESS LINE 2 */}

              <Box mb={2.5}>
                <Label>
                  Address Line 2
                </Label>

                <Input
                  name="address_line2"
                  value={
                    formData.address_line2
                  }
                  onChange={handleChange}
                  placeholder="Apartment, suite, unit"
                  {...fieldProps}
                />
              </Box>

              {/* =================================================
                  CITY -> COUNTRY -> STATE -> POSTAL CODE
              ================================================= */}

              <Flex
                gap={2.5}
                flexWrap="wrap"
              >
                {/* CITY */}

                <Box
                  flex="1"
                  minW={{
                    base: "100%",
                    sm: "120px",
                  }}
                >
                  <Label required>
                    City
                  </Label>

                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    {...fieldProps}
                    borderColor={
                      errors.city
                        ? "red.400"
                        : "#dfe3e8"
                    }
                  />

                  {errors.city && (
                    <Text
                      fontSize="2xs"
                      color="red.500"
                      mt={0.5}
                    >
                      {errors.city}
                    </Text>
                  )}
                </Box>

                {/* COUNTRY */}

                <Box
                  flex="1"
                  minW={{
                    base: "100%",
                    sm: "120px",
                  }}
                >
                  <Label required>
                    Country
                  </Label>

                  <SelectField
                    value={
                      formData.country
                    }
                    onChange={(value) =>
                      handleSelectChange(
                        "country",
                        value
                      )
                    }
                    options={
                      countryOptions
                    }
                    placeholder="Select Country"
                    error={
                      errors.country
                    }
                  />

                  {errors.country && (
                    <Text
                      fontSize="2xs"
                      color="red.500"
                      mt={0.5}
                    >
                      {errors.country}
                    </Text>
                  )}
                </Box>

                {/* STATE */}

                <Box
                  flex="1"
                  minW={{
                    base: "100%",
                    sm: "120px",
                  }}
                >
                  <Label required>
                    State / Province
                  </Label>

                  <SelectField
                    value={
                      formData.state
                    }
                    onChange={(value) =>
                      handleSelectChange(
                        "state",
                        value
                      )
                    }
                    options={getStateOptions(
                      formData.country
                    )}
                    placeholder={
                      formData.country
                        ? "Select State / Province"
                        : "Select Country First"
                    }
                    error={
                      errors.state
                    }
                  />

                  {errors.state && (
                    <Text
                      fontSize="2xs"
                      color="red.500"
                      mt={0.5}
                    >
                      {errors.state}
                    </Text>
                  )}
                </Box>

                {/* POSTAL CODE */}

                <Box
                  flex="1"
                  minW={{
                    base: "100%",
                    sm: "120px",
                  }}
                >
                  <Label required>
                    Postal Code
                  </Label>

                  <Input
                    name="postal_code"
                    value={
                      formData.postal_code
                    }
                    onChange={handleChange}
                    placeholder="400001"
                    {...fieldProps}
                    borderColor={
                      errors.postal_code
                        ? "red.400"
                        : "#dfe3e8"
                    }
                  />

                  {errors.postal_code && (
                    <Text
                      fontSize="2xs"
                      color="red.500"
                      mt={0.5}
                    >
                      {errors.postal_code}
                    </Text>
                  )}
                </Box>
              </Flex>
            </Box>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <Flex
              justify="space-between"
              align="center"
              gap={2.5}
              mt={3}
              pt={3}
              borderTop="1px solid"
              borderColor="#edf0f3"
            >
              {/* BACK */}

              <Button
                type="button"
                variant="outline"
                border="1px solid"
                borderColor="#cbd5e1"
                color="#475569"
                borderRadius="6px"
                px={4}
                h="30px"
                fontSize="2xs"
                fontWeight="600"
                bg="white"
                _hover={{
                  bg: "#f8fafc",
                  borderColor:
                    primaryMaroon,
                  color:
                    primaryMaroon,
                }}
                onClick={() =>
                  navigate(
                    "/admin/dioceses"
                  )
                }
              >
                <LuArrowLeft
                  size={13}
                />

                <Box ml={1.5}>
                  Back
                </Box>
              </Button>

              <HStack spacing={2.5}>
                {/* CANCEL */}

                <Button
                  type="button"
                  variant="outline"
                  border="1px solid"
                  borderColor={
                    primaryMaroon
                  }
                  color={primaryMaroon}
                  borderRadius="6px"
                  px={5}
                  h="30px"
                  fontSize="2xs"
                  fontWeight="600"
                  bg="white"
                  _hover={{
                    bg: "#fff5f7",
                  }}
                  onClick={() =>
                    navigate(
                      "/admin/dioceses"
                    )
                  }
                >
                  Cancel
                </Button>

                {/* SAVE */}

                <Button
                  type="submit"
                  color="white"
                  borderRadius="6px"
                  px={5}
                  h="30px"
                  fontSize="2xs"
                  fontWeight="700"
                  bg={primaryMaroon}
                  _hover={{
                    bg: "#961a45",
                  }}
                  isLoading={isLoading}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <VStack
            spacing={3}
            align="stretch"
            w={{
              base: "100%",
              xl: "260px",
            }}
            flexShrink={0}
          >
            {/* RECORD INFORMATION */}

            <Box
              bg="white"
              border="1px solid"
              borderColor="#e2e6eb"
              borderRadius="10px"
              boxShadow="0 2px 12px rgba(20, 30, 45, 0.035)"
              p={{
                base: 3,
                md: 3.5,
              }}
            >
              <Heading
                fontSize="sm"
                fontWeight="700"
                color="#17243a"
                mb={2}
              >
                Record Information
              </Heading>

              <Flex
                align="flex-start"
                gap={2.5}
                py={2}
                borderBottom="1px solid"
                borderColor="#edf0f3"
              >
                <Icon
                  as={LuCalendar}
                  boxSize={4}
                  color="#64748b"
                  mt={0.5}
                />

                <Box>
                  <Text
                    fontSize="2xs"
                    fontWeight="700"
                    color="#334155"
                  >
                    Created
                  </Text>

                  <Text
                    fontSize="2xs"
                    color="#334155"
                    mt={0.5}
                  >
                    {formatDate(
                      formData.created_at
                    )}
                  </Text>
                </Box>
              </Flex>

              <Flex
                align="flex-start"
                gap={2.5}
                py={2}
              >
                <Icon
                  as={LuClock}
                  boxSize={4}
                  color="#64748b"
                  mt={0.5}
                />

                <Box>
                  <Text
                    fontSize="2xs"
                    fontWeight="700"
                    color="#334155"
                  >
                    Last updated
                  </Text>

                  <Text
                    fontSize="2xs"
                    color="#334155"
                    mt={0.5}
                  >
                    {formatDate(
                      formData.updated_at
                    )}
                  </Text>
                </Box>
              </Flex>
            </Box>

            {/* ASSIGNED CHURCHES */}

            <Box
              bg="white"
              border="1px solid"
              borderColor="#e2e6eb"
              borderRadius="10px"
              boxShadow="0 2px 12px rgba(20, 30, 45, 0.035)"
              p={{
                base: 3,
                md: 3.5,
              }}
              minH="160px"
            >
              <Heading
                fontSize="sm"
                fontWeight="700"
                color="#17243a"
                mb={2}
              >
                Assigned Churches
              </Heading>

              <HStack
                spacing={3}
                align="center"
              >
                <Circle
                  size="50px"
                  bg="#fff1f4"
                  border="1px solid"
                  borderColor="#f7d8df"
                  color={primaryMaroon}
                  flexShrink={0}
                >
                  <Icon
                    as={LuLandmark}
                    boxSize={6}
                  />
                </Circle>

                <Box>
                  <Heading
                    fontSize="2xl"
                    lineHeight="1"
                    fontWeight="800"
                    color="#17243a"
                  >
                    {formData.church_count ??
                      0}
                  </Heading>

                  <Box
                    as="button"
                    type="button"
                    mt={1}
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    color={primaryMaroon}
                    fontWeight="700"
                    fontSize="2xs"
                    _hover={{
                      textDecoration:
                        "underline",
                    }}
                    onClick={() =>
                      navigate(
                        "/admin/churches"
                      )
                    }
                  >
                    View Churches

                    <LuArrowRight
                      size={13}
                    />
                  </Box>
                </Box>
              </HStack>
            </Box>
          </VStack>
        </Flex>
      </Container>
    </AdminLayout>
  );
};

export default DioceseEdit;

