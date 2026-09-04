import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Text,
  VStack,
  Badge,
  Spinner,
  Center,
  Avatar,
} from "@chakra-ui/react";

import {
  LuSave,
  LuUser,
  LuMapPin,
  LuPhone,
  LuChurch,
  LuCalendarDays,
  LuPencil,
  LuUsers,
  LuHeart,
  LuArrowLeft,
} from "react-icons/lu";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getMarriage,
  updateMarriage,
  listFamilies,
  listMembers,
  listRelationships,
} from "../api/registryServices";

/* ============================================================
   COLORS
============================================================ */

const RED = "#C90016";
const RED_DARK = "#A90012";
const NAVY = "#111F52";
const MUTED = "#667085";
const BORDER = "#DCE3EE";

/* ============================================================
   HELPERS
============================================================ */

const getResponseData = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return data || [];
};

const getValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return value.id ?? "";
  return value;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) => {
  if (!name) return "M";
  return name
    .split(" ")
    .filter(Boolean)
    .map((item) => item[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

/* ============================================================
   FORM FIELD
============================================================ */

const FormField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder = "",
  error,
  touched,
  children,
  required = false,
  disabled = false,
}) => {
  const invalid = Boolean(touched && error);

  return (
    <Box>
      <Text fontSize="10px" fontWeight="700" color={NAVY} mb="2px">
        {label}
        {required && <Text as="span" color={RED} ml="1px">*</Text>}
      </Text>

      {children ? (
        children
      ) : (
        <Box
          as="input"
          name={name}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          h="28px"
          minH="28px"
          px="8px"
          border="1px solid"
          borderColor={invalid ? RED : "#D7DFEA"}
          borderRadius="4px"
          fontSize="11px"
          color={NAVY}
          bg={disabled ? "#F5F6FA" : "white"}
          w="100%"
          outline="none"
          boxSizing="border-box"
          cursor={disabled ? "not-allowed" : "text"}
          opacity={disabled ? 0.7 : 1}
          _hover={{
            borderColor: invalid ? RED : "#B8C3D4",
          }}
          _focus={{
            borderColor: RED,
            boxShadow: `0 0 0 1px ${RED}`,
          }}
          _placeholder={{ color: "#98A2B3" }}
        />
      )}

      {invalid && (
        <Text fontSize="8px" color={RED} mt="1px">
          {error}
        </Text>
      )}
    </Box>
  );
};

/* ============================================================
   SELECT FIELD
============================================================ */

const SelectField = ({
  name,
  value,
  onChange,
  onBlur,
  children,
  disabled = false,
  invalid = false,
}) => {
  return (
    <Box position="relative">
      <Box
        as="select"
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        h="28px"
        minH="28px"
        px="8px"
        pr="24px"
        border="1px solid"
        borderColor={invalid ? RED : "#D7DFEA"}
        borderRadius="4px"
        fontSize="11px"
        color={NAVY}
        bg={disabled ? "#F5F6FA" : "white"}
        w="100%"
        outline="none"
        boxSizing="border-box"
        cursor={disabled ? "not-allowed" : "pointer"}
        opacity={disabled ? 0.7 : 1}
        appearance="none"
        _hover={{
          borderColor: disabled ? "#D7DFEA" : invalid ? RED : "#B8C3D4",
        }}
        _focus={{
          borderColor: RED,
          boxShadow: `0 0 0 1px ${RED}`,
        }}
      >
        {children}
      </Box>
      <Box
        position="absolute"
        right="8px"
        top="50%"
        transform="translateY(-50%)"
        pointerEvents="none"
        color={NAVY}
        fontSize="10px"
      >
        ▼
      </Box>
    </Box>
  );
};

/* ============================================================
   TEXTAREA FIELD
============================================================ */

const TextareaField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "",
  error,
  touched,
  required = false,
  rows = 2,
}) => {
  const invalid = Boolean(touched && error);

  return (
    <Box>
      <Text fontSize="10px" fontWeight="700" color={NAVY} mb="2px">
        {label}
        {required && <Text as="span" color={RED} ml="1px">*</Text>}
      </Text>

      <Box
        as="textarea"
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        w="100%"
        px="8px"
        py="5px"
        border="1px solid"
        borderColor={invalid ? RED : "#D7DFEA"}
        borderRadius="4px"
        bg="white"
        color={NAVY}
        fontSize="11px"
        resize="vertical"
        outline="none"
        boxSizing="border-box"
        _hover={{
          borderColor: invalid ? RED : "#B8C3D4",
        }}
        _focus={{
          borderColor: RED,
          boxShadow: `0 0 0 1px ${RED}`,
        }}
        _placeholder={{ color: "#98A2B3" }}
      />

      {invalid && (
        <Text fontSize="8px" color={RED} mt="1px">
          {error}
        </Text>
      )}
    </Box>
  );
};

/* ============================================================
   PHONE FIELD
============================================================ */

const PhoneField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "",
  error,
  touched,
  required = false,
  disabled = false,
}) => {
  const invalid = Boolean(touched && error);

  return (
    <Box>
      <Text fontSize="10px" fontWeight="700" color={NAVY} mb="2px">
        {label}
        {required && <Text as="span" color={RED} ml="1px">*</Text>}
      </Text>

      <Flex>
        <Box w="60px" flexShrink={0}>
          <Box
            as="select"
            disabled
            h="28px"
            minH="28px"
            px="6px"
            border="1px solid"
            borderColor="#D7DFEA"
            borderRight="0"
            borderRadius="4px 0 0 4px"
            fontSize="11px"
            color={NAVY}
            bg="#F5F6FA"
            w="100%"
            outline="none"
          >
            <option value="+91">+91</option>
          </Box>
        </Box>
        <Box
          as="input"
          name={name}
          value={value ?? ""}
          onChange={onChange}
          onBlur={onBlur}
          type="tel"
          placeholder={placeholder}
          disabled={disabled}
          h="28px"
          minH="28px"
          px="8px"
          border="1px solid"
          borderColor={invalid ? RED : "#D7DFEA"}
          borderLeftRadius="0"
          borderRadius="0 4px 4px 0"
          fontSize="11px"
          color={NAVY}
          bg={disabled ? "#F5F6FA" : "white"}
          w="100%"
          outline="none"
          boxSizing="border-box"
          cursor={disabled ? "not-allowed" : "text"}
          opacity={disabled ? 0.7 : 1}
          _hover={{
            borderColor: invalid ? RED : "#B8C3D4",
          }}
          _focus={{
            borderColor: RED,
            boxShadow: `0 0 0 1px ${RED}`,
          }}
          _placeholder={{ color: "#98A2B3" }}
        />
      </Flex>

      {invalid && (
        <Text fontSize="8px" color={RED} mt="1px">
          {error}
        </Text>
      )}
    </Box>
  );
};

/* ============================================================
   CONTEXT INFO BOX
============================================================ */

const ContextInfoBox = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <Flex align="center" gap="8px" py="4px">
      <Box color={NAVY} fontSize="16px">
        {icon}
      </Box>
      <Box>
        <Text fontSize="9px" color={MUTED} fontWeight="500">
          {label}
        </Text>
        <Text fontSize="11px" color={NAVY} fontWeight="600">
          {value}
        </Text>
      </Box>
    </Flex>
  );
};

/* ============================================================
   INITIAL FORM
============================================================ */

const initialForm = {
  marriage_type: "ADD_BRIDE",
  date: "",
  groom_family: "",
  groom_member: "",
  groom_name: "",
  groom_nationality: "",
  groom_father: "",
  groom_mother: "",
  groom_dob: "",
  groom_house_name: "",
  groom_family_name: "",
  groom_address: "",
  groom_phone: "",
  groom_confession_date: "",
  bride_family: "",
  bride_member: "",
  bride_name: "",
  bride_nationality: "",
  bride_father: "",
  bride_mother: "",
  bride_dob: "",
  bride_address: "",
  bride_phone: "",
  bride_confession_date: "",
  bride_is_internal: true,
  groom_is_internal: true,
  relationship: "",
  family: "",
  transfer_to: "",
  vicar_name: "",
  witness_groom_side: "",
  witness_bride_side: "",
  minister_of_marriage: "",
  other_priests: "",
  remarks: "",
};

/* ============================================================
   MARRIAGE EDIT PAGE
============================================================ */

const MarriageEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(initialForm);
  const [marriage, setMarriage] = useState(null);

  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    setLoading(true);
    setError("");

    try {
      const [marriageResponse, familiesResponse, membersResponse, relationshipsResponse] =
        await Promise.all([
          getMarriage(id),
          listFamilies(),
          listMembers(),
          listRelationships(),
        ]);

      const record = marriageResponse.data;
      setMarriage(record);

      setFamilies(getResponseData(familiesResponse));
      setMembers(getResponseData(membersResponse));
      setRelationships(getResponseData(relationshipsResponse));

      // Set form data from record
      setFormData({
        marriage_type: record.marriage_type || "ADD_BRIDE",
        date: record.date || "",
        groom_family: getValue(record.groom_family),
        groom_member: getValue(record.groom_member),
        groom_name: record.groom_name || "",
        groom_nationality: record.groom_nationality || "",
        groom_father: record.groom_father || "",
        groom_mother: record.groom_mother || "",
        groom_dob: record.groom_dob || "",
        groom_house_name: record.groom_house_name || "",
        groom_family_name: record.groom_family_name || "",
        groom_address: record.groom_address || "",
        groom_phone: record.groom_phone || "",
        groom_confession_date: record.groom_confession_date || "",
        bride_family: getValue(record.bride_family),
        bride_member: getValue(record.bride_member),
        bride_name: record.bride_name || "",
        bride_nationality: record.bride_nationality || "",
        bride_father: record.bride_father || "",
        bride_mother: record.bride_mother || "",
        bride_dob: record.bride_dob || "",
        bride_address: record.bride_address || "",
        bride_phone: record.bride_phone || "",
        bride_confession_date: record.bride_confession_date || "",
        bride_is_internal: record.bride_is_internal !== undefined ? record.bride_is_internal : true,
        groom_is_internal: record.groom_is_internal !== undefined ? record.groom_is_internal : true,
        relationship: getValue(record.relationship),
        family: getValue(record.family),
        transfer_to: record.transfer_to || "",
        vicar_name: record.vicar_name || "",
        witness_groom_side: record.witness_groom_side || "",
        witness_bride_side: record.witness_bride_side || "",
        minister_of_marriage: record.minister_of_marriage || "",
        other_priests: record.other_priests || "",
        remarks: record.remarks || "",
      });
    } catch (err) {
      console.error("Error loading marriage:", err);
      setError(err?.response?.data?.detail || "Unable to load marriage record.");
      navigate("/marriage");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     HELPERS - Get Available Grooms/Brides
  ========================================================== */

  const getAvailableGrooms = (familyId) => {
    if (!familyId) return [];

    const familyIdInt = typeof familyId === "string" ? parseInt(familyId) : familyId;

    return members
      .filter((m) => {
        const memberFamilyId = m.family?.id || m.family;
        const matchesFamily = memberFamilyId === familyIdInt;
        const isEligible =
          m.is_active !== false &&
          m.expired !== true &&
          m.gender !== "FEMALE" &&
          m.marital_status !== "MARRIED" &&
          m.marital_status !== "Married" &&
          m.marital_status !== "" &&
          !m.spouse &&
          !m.is_family_head;
        return isEligible && matchesFamily;
      })
      .map((m) => ({
        value: m.id,
        label: `${m.name} (${m.family?.family_name || "N/A"})`,
      }));
  };

  const getAvailableBrides = (familyId) => {
    if (!familyId) return [];

    const familyIdInt = typeof familyId === "string" ? parseInt(familyId) : familyId;

    return members
      .filter((m) => {
        const memberFamilyId = m.family?.id || m.family;
        const matchesFamily = memberFamilyId === familyIdInt;
        const isEligible =
          m.is_active !== false &&
          m.expired !== true &&
          m.gender === "FEMALE" &&
          m.marital_status !== "MARRIED" &&
          m.marital_status !== "Married" &&
          m.marital_status !== "" &&
          !m.spouse;
        return isEligible && matchesFamily;
      })
      .map((m) => ({
        value: m.id,
        label: `${m.name} (${m.family?.family_name || "N/A"})`,
      }));
  };

  /* ==========================================================
     OPTIONS
  ========================================================== */

  const familyOptions = families.map((family) => ({
    value: family.id,
    label: family.family_name || family.name || `Family #${family.id}`,
  }));

  const relationshipOptions = relationships.map((relationship) => ({
    value: relationship.id,
    label: relationship.name || relationship.relationship_name || `Relationship #${relationship.id}`,
  }));

  const type = formData.marriage_type || "ADD_BRIDE";
  const selectedGroomFamily = formData.groom_family;
  const selectedBrideFamily = formData.bride_family;
  const groomIsInternal = formData.groom_is_internal === true || formData.groom_is_internal === "true";
  const brideIsInternal = formData.bride_is_internal === true || formData.bride_is_internal === "true";

  const groomOptions = getAvailableGrooms(selectedGroomFamily);
  const brideOptions = getAvailableBrides(selectedBrideFamily);

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setError("");
  };

  const handleBlur = () => {};

  const handleMarriageTypeChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      marriage_type: value,
      bride_is_internal: true,
      groom_is_internal: true,
    }));
    setFieldErrors({});
    setError("");
  };

  const handleBrideTypeChange = (event) => {
    const value = event.target.value;
    const boolValue = value === "true" || value === true;
    setFormData((prev) => ({
      ...prev,
      bride_is_internal: boolValue,
    }));
    setFieldErrors({});
    setError("");
  };

  const handleGroomTypeChange = (event) => {
    const value = event.target.value;
    const boolValue = value === "true" || value === true;
    setFormData((prev) => ({
      ...prev,
      groom_is_internal: boolValue,
    }));
    setFieldErrors({});
    setError("");
  };

  const handleGroomFamilyChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      groom_family: value,
      groom_member: "",
    }));
    setFieldErrors((prev) => ({
      ...prev,
      groom_family: undefined,
      groom_member: undefined,
    }));
  };

  const handleBrideFamilyChange = (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      bride_family: value,
      bride_member: "",
    }));
    setFieldErrors((prev) => ({
      ...prev,
      bride_family: undefined,
      bride_member: undefined,
    }));
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const payload = {
        marriage_type: formData.marriage_type,
        date: formData.date,
        groom_family: formData.groom_family || null,
        groom_member: formData.groom_member || null,
        groom_name: formData.groom_name || null,
        groom_nationality: formData.groom_nationality || null,
        groom_father: formData.groom_father || null,
        groom_mother: formData.groom_mother || null,
        groom_dob: formData.groom_dob || null,
        groom_house_name: formData.groom_house_name || null,
        groom_family_name: formData.groom_family_name || null,
        groom_address: formData.groom_address || null,
        groom_phone: formData.groom_phone || null,
        groom_confession_date: formData.groom_confession_date || null,
        bride_family: formData.bride_family || null,
        bride_member: formData.bride_member || null,
        bride_name: formData.bride_name || null,
        bride_nationality: formData.bride_nationality || null,
        bride_father: formData.bride_father || null,
        bride_mother: formData.bride_mother || null,
        bride_dob: formData.bride_dob || null,
        bride_address: formData.bride_address || null,
        bride_phone: formData.bride_phone || null,
        bride_confession_date: formData.bride_confession_date || null,
        bride_is_internal: formData.bride_is_internal,
        groom_is_internal: formData.groom_is_internal,
        relationship: formData.relationship || null,
        family: formData.family || null,
        transfer_to: formData.transfer_to || null,
        vicar_name: formData.vicar_name || null,
        witness_groom_side: formData.witness_groom_side || null,
        witness_bride_side: formData.witness_bride_side || null,
        minister_of_marriage: formData.minister_of_marriage || null,
        other_priests: formData.other_priests || null,
        remarks: formData.remarks || null,
      };

      await updateMarriage(id, payload);
      navigate(`/marriage/${id}`);
    } catch (err) {
      console.error("Error updating marriage:", err);
      const responseData = err?.response?.data;

      if (responseData && typeof responseData === "object") {
        const errors = {};
        Object.entries(responseData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            errors[key] = value.join(", ");
          } else if (typeof value === "string") {
            errors[key] = value;
          } else {
            errors[key] = JSON.stringify(value);
          }
        });
        setFieldErrors(errors);
        setError(
          responseData.detail ||
            responseData.non_field_errors?.[0] ||
            "Please correct the highlighted fields."
        );
      } else {
        setError("Unable to update marriage record.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1">
          <Spinner size="lg" color={RED} />
        </Center>
        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     NOT FOUND
  ========================================================== */

  if (!marriage) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1">
          <Text color={NAVY}>Marriage record not found.</Text>
        </Center>
        <Footer />
      </Box>
    );
  }

  /* ==========================================================
     VALUES FOR TOP BAR
  ========================================================== */

  const groomName = marriage?.groom_member?.name || marriage?.groom_name || "—";
  const brideName = marriage?.bride_member?.name || marriage?.bride_name || "—";
  const familyName = marriage?.family?.family_name || "—";
  const isTransfer = marriage?.marriage_type === "TRANSFER_BRIDE";

  const getBrideTypeLabel = () => {
    if (isTransfer) return "Transfer Bride";
    if (marriage?.bride_member) return "Same Parish Bride";
    return "Other Parish Bride";
  };

  /* ==========================================================
     UI
  ========================================================== */

  const isAddBride = formData.marriage_type === "ADD_BRIDE";

  return (
    <Box minH="100vh" bg="white" display="flex" flexDirection="column">
      <Navbar />

      <Box
        flex="1"
        px={{ base: "16px", md: "20px", lg: "24px" }}
        pt={{ base: "10px", md: "12px" }}
        pb="10px"
      >
        <Box maxW="1540px" mx="auto" width="100%">
          {/* BREADCRUMB */}
          <Flex align="center" gap="6px" mb="8px" flexWrap="wrap">
            <Text fontSize="10px" color="#3674D9" cursor="pointer" onClick={() => navigate("/")}>
              Masters
            </Text>
            <Text fontSize="10px" color="#98A2B3">/</Text>
            <Text fontSize="10px" color="#3674D9" cursor="pointer" onClick={() => navigate("/marriage")}>
              Marriage Register
            </Text>
            <Text fontSize="10px" color="#98A2B3">/</Text>
            <Text fontSize="10px" color="#3674D9" cursor="pointer" onClick={() => navigate(`/marriage/${id}`)}>
              {groomName} & {brideName}
            </Text>
            <Text fontSize="10px" color="#98A2B3">/</Text>
            <Text fontSize="10px" color="#3674D9">Edit</Text>
          </Flex>

          {/* PAGE TITLE */}
          <Flex align="center" justify="space-between" flexWrap="wrap" gap="8px" mb="8px">
            <Box>
              <Text fontSize="9px" fontWeight="800" color={RED} letterSpacing="0.25px" mb="1px">
                MARRIAGE REGISTER
              </Text>
              <Heading fontSize={{ base: "18px", md: "20px" }} fontWeight="700" color={NAVY} lineHeight="1.1">
                Edit Marriage
              </Heading>
              <Text fontSize="10px" color={MUTED} mt="2px">
                Update marriage details for {groomName} & {brideName}.
              </Text>
            </Box>
          </Flex>

          {/* GENERAL ERROR */}
          {error && (
            <Box bg="#FFF8FA" border="1px solid #FECACA" borderRadius="4px" px="10px" py="6px" mb="8px">
              <Text fontSize="10px" color={RED} fontWeight="500">
                {error}
              </Text>
            </Box>
          )}

          {/* MARRIAGE SUMMARY */}
          <Box
            bg="white"
            border="1px solid"
            borderColor={BORDER}
            borderRadius="6px"
            px={{ base: "14px", md: "18px" }}
            py="8px"
            mb="8px"
          >
            <Grid
              templateColumns={{
                base: "1fr",
                lg: "1.3fr 1.1fr 0.9fr 0.8fr auto",
              }}
              alignItems="center"
              gap="8px"
            >
              <Flex align="center" gap="14px">
                <Avatar.Root width="48px" height="48px" flexShrink="0">
                  <Avatar.Fallback
                    bg="#FFE8EB"
                    color={RED}
                    fontWeight="700"
                    fontSize="14px"
                    name={groomName}
                  >
                    {getInitials(groomName)}
                  </Avatar.Fallback>
                </Avatar.Root>

                <Box>
                  <Text fontSize="15px" fontWeight="700" color={NAVY} lineHeight="1.2">
                    {groomName} & {brideName}
                  </Text>
                  <Text fontSize="11px" color={NAVY} mt="2px">
                    {getBrideTypeLabel()}
                  </Text>
                </Box>
              </Flex>

              <Flex align="center" gap="8px">
                <Box color={NAVY}>
                  <LuHeart size="16" />
                </Box>
                <Box>
                  <Text fontSize="11px" fontWeight="600" color={NAVY}>
                    {formatDate(marriage?.date)}
                  </Text>
                  <Text fontSize="9px" color={MUTED}>Marriage Date</Text>
                </Box>
              </Flex>

              <Flex align="center" gap="8px">
                <Box color={NAVY}>
                  <LuUsers size="16" />
                </Box>
                <Text fontSize="11px" fontWeight="500" color={NAVY}>
                  {familyName}
                </Text>
              </Flex>

              <Flex align="center" gap="8px">
                <Box color={NAVY}>
                  <LuCalendarDays size="16" />
                </Box>
                <Text fontSize="11px" fontWeight="600" color={NAVY}>
                  {isTransfer ? "Transfer" : "Sacramental"}
                </Text>
              </Flex>

              <Badge
                px="8px"
                py="3px"
                borderRadius="4px"
                bg="#EAF8EE"
                border="1px solid"
                borderColor="#C4E8CC"
                color="#24913E"
                fontSize="9px"
                fontWeight="500"
              >
                Active
              </Badge>
            </Grid>
          </Box>

          {/* CONTENT AREA */}
          <Grid
            templateColumns={{
              base: "1fr",
              lg: "minmax(0, 3fr) minmax(220px, 1fr)",
            }}
            gap="14px"
            alignItems="start"
          >
            {/* LEFT FORM */}
            <Box
              as="form"
              onSubmit={handleSubmit}
              bg="white"
              border="1px solid"
              borderColor={BORDER}
              borderRadius="6px"
            >
              <Box
                px={{ base: "12px", md: "14px" }}
                py="6px"
                bg="#F8FAFC"
                borderBottom="1px solid"
                borderBottomColor={BORDER}
              >
                <Text fontSize="10px" color={MUTED} fontWeight="500">
                  {marriage?.register_number && (
                    <>
                      Reg No: <Text as="span" color={NAVY} fontWeight="600">{marriage.register_number}</Text>
                    </>
                  )}
                </Text>
              </Box>

              <Box p={{ base: "12px", md: "14px" }}>
                {/* ===== FORM FIELDS ===== */}
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                  gap={{ base: "8px", md: "8px 14px" }}
                >
                  {/* Marriage Type */}
                  <FormField
                    label="Marriage Type"
                    name="marriage_type"
                    value={formData.marriage_type}
                    onChange={handleMarriageTypeChange}
                    onBlur={handleBlur}
                    required
                    error={fieldErrors.marriage_type}
                    touched={fieldErrors.marriage_type}
                  >
                    <SelectField
                      name="marriage_type"
                      value={formData.marriage_type}
                      onChange={handleMarriageTypeChange}
                      onBlur={handleBlur}
                      invalid={Boolean(fieldErrors.marriage_type)}
                    >
                      <option value="ADD_BRIDE">Add Bride</option>
                      <option value="TRANSFER_BRIDE">Transfer Bride</option>
                    </SelectField>
                  </FormField>

                  {/* Date */}
                  <FormField
                    label={isTransfer ? "Day & Time" : "Marriage Date"}
                    name="date"
                    type={isTransfer ? "datetime-local" : "date"}
                    value={formData.date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    error={fieldErrors.date}
                    touched={fieldErrors.date}
                  />

                  {/* Bride Type (only for ADD_BRIDE) */}
                  {isAddBride && (
                    <FormField
                      label="Bride Type"
                      name="bride_is_internal"
                      value={String(formData.bride_is_internal)}
                      onChange={handleBrideTypeChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.bride_is_internal}
                      touched={fieldErrors.bride_is_internal}
                    >
                      <SelectField
                        name="bride_is_internal"
                        value={String(formData.bride_is_internal)}
                        onChange={handleBrideTypeChange}
                        onBlur={handleBlur}
                        invalid={Boolean(fieldErrors.bride_is_internal)}
                      >
                        <option value="true">Internal Bride (Church Member)</option>
                        <option value="false">External Bride (Non-Member)</option>
                      </SelectField>
                    </FormField>
                  )}

                  {/* Groom Type (only for TRANSFER_BRIDE) */}
                  {isTransfer && (
                    <FormField
                      label="Groom Type"
                      name="groom_is_internal"
                      value={String(formData.groom_is_internal)}
                      onChange={handleGroomTypeChange}
                      onBlur={handleBlur}
                      required
                      error={fieldErrors.groom_is_internal}
                      touched={fieldErrors.groom_is_internal}
                    >
                      <SelectField
                        name="groom_is_internal"
                        value={String(formData.groom_is_internal)}
                        onChange={handleGroomTypeChange}
                        onBlur={handleBlur}
                        invalid={Boolean(fieldErrors.groom_is_internal)}
                      >
                        <option value="true">Internal Groom (Church Member)</option>
                        <option value="false">External Groom (Non-Member)</option>
                      </SelectField>
                    </FormField>
                  )}

                  {/* Groom Family */}
                  <FormField
                    label="Groom's Family"
                    name="groom_family"
                    value={formData.groom_family}
                    onChange={handleGroomFamilyChange}
                    onBlur={handleBlur}
                    error={fieldErrors.groom_family}
                    touched={fieldErrors.groom_family}
                  >
                    <SelectField
                      name="groom_family"
                      value={formData.groom_family}
                      onChange={handleGroomFamilyChange}
                      onBlur={handleBlur}
                      invalid={Boolean(fieldErrors.groom_family)}
                    >
                      <option value="">Select</option>
                      {familyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>

                  {/* Groom Member */}
                  <FormField
                    label="Select Groom"
                    name="groom_member"
                    value={formData.groom_member}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={fieldErrors.groom_member}
                    touched={fieldErrors.groom_member}
                  >
                    <SelectField
                      name="groom_member"
                      value={formData.groom_member}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={!formData.groom_family}
                      invalid={Boolean(fieldErrors.groom_member)}
                    >
                      <option value="">
                        {formData.groom_family ? "Select groom" : "Select family first"}
                      </option>
                      {groomOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>

                  {/* Groom Name (manual) */}
                  <FormField
                    label="Groom Name"
                    name="groom_name"
                    value={formData.groom_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter groom name"
                    error={fieldErrors.groom_name}
                    touched={fieldErrors.groom_name}
                  />

                  {/* Bride Family */}
                  <FormField
                    label="Bride's Family"
                    name="bride_family"
                    value={formData.bride_family}
                    onChange={handleBrideFamilyChange}
                    onBlur={handleBlur}
                    error={fieldErrors.bride_family}
                    touched={fieldErrors.bride_family}
                  >
                    <SelectField
                      name="bride_family"
                      value={formData.bride_family}
                      onChange={handleBrideFamilyChange}
                      onBlur={handleBlur}
                      invalid={Boolean(fieldErrors.bride_family)}
                    >
                      <option value="">Select</option>
                      {familyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>

                  {/* Bride Member */}
                  <FormField
                    label="Select Bride"
                    name="bride_member"
                    value={formData.bride_member}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={fieldErrors.bride_member}
                    touched={fieldErrors.bride_member}
                  >
                    <SelectField
                      name="bride_member"
                      value={formData.bride_member}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={!formData.bride_family}
                      invalid={Boolean(fieldErrors.bride_member)}
                    >
                      <option value="">
                        {formData.bride_family ? "Select bride" : "Select family first"}
                      </option>
                      {brideOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>

                  {/* Bride Name (manual) */}
                  <FormField
                    label="Bride Name"
                    name="bride_name"
                    value={formData.bride_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter bride name"
                    error={fieldErrors.bride_name}
                    touched={fieldErrors.bride_name}
                  />

                  {/* Relationship */}
                  <FormField
                    label="Relationship"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={fieldErrors.relationship}
                    touched={fieldErrors.relationship}
                  >
                    <SelectField
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={Boolean(fieldErrors.relationship)}
                    >
                      <option value="">Select</option>
                      {relationshipOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>

                  {/* Primary Family */}
                  <FormField
                    label="Primary Family"
                    name="family"
                    value={formData.family}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={fieldErrors.family}
                    touched={fieldErrors.family}
                  >
                    <SelectField
                      name="family"
                      value={formData.family}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      invalid={Boolean(fieldErrors.family)}
                    >
                      <option value="">Select</option>
                      {familyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>

                  {/* Groom Nationality */}
                  <FormField
                    label="Groom Nationality"
                    name="groom_nationality"
                    value={formData.groom_nationality}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter groom nationality"
                    error={fieldErrors.groom_nationality}
                    touched={fieldErrors.groom_nationality}
                  />

                  {/* Bride Nationality */}
                  <FormField
                    label="Bride Nationality"
                    name="bride_nationality"
                    value={formData.bride_nationality}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter bride nationality"
                    error={fieldErrors.bride_nationality}
                    touched={fieldErrors.bride_nationality}
                  />

                  {/* Groom Father */}
                  <FormField
                    label="Groom's Father"
                    name="groom_father"
                    value={formData.groom_father}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter father name"
                    error={fieldErrors.groom_father}
                    touched={fieldErrors.groom_father}
                  />

                  {/* Bride Father */}
                  <FormField
                    label="Bride's Father"
                    name="bride_father"
                    value={formData.bride_father}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter father name"
                    error={fieldErrors.bride_father}
                    touched={fieldErrors.bride_father}
                  />

                  {/* Groom Mother */}
                  <FormField
                    label="Groom's Mother"
                    name="groom_mother"
                    value={formData.groom_mother}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter mother name"
                    error={fieldErrors.groom_mother}
                    touched={fieldErrors.groom_mother}
                  />

                  {/* Bride Mother */}
                  <FormField
                    label="Bride's Mother"
                    name="bride_mother"
                    value={formData.bride_mother}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter mother name"
                    error={fieldErrors.bride_mother}
                    touched={fieldErrors.bride_mother}
                  />

                  {/* Transfer To (only for TRANSFER_BRIDE) */}
                  {isTransfer && (
                    <FormField
                      label="Transfer To"
                      name="transfer_to"
                      value={formData.transfer_to}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter parish name"
                      error={fieldErrors.transfer_to}
                      touched={fieldErrors.transfer_to}
                    />
                  )}

                  {/* Vicar Name (only for TRANSFER_BRIDE) */}
                  {isTransfer && (
                    <FormField
                      label="Vicar Name"
                      name="vicar_name"
                      value={formData.vicar_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter vicar name"
                      error={fieldErrors.vicar_name}
                      touched={fieldErrors.vicar_name}
                    />
                  )}

                  {/* Groom Confession Date (only for TRANSFER_BRIDE) */}
                  {isTransfer && (
                    <FormField
                      label="Groom Confession Date"
                      name="groom_confession_date"
                      type="date"
                      value={formData.groom_confession_date}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.groom_confession_date}
                      touched={fieldErrors.groom_confession_date}
                    />
                  )}

                  {/* Bride Confession Date (only for TRANSFER_BRIDE) */}
                  {isTransfer && (
                    <FormField
                      label="Bride Confession Date"
                      name="bride_confession_date"
                      type="date"
                      value={formData.bride_confession_date}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.bride_confession_date}
                      touched={fieldErrors.bride_confession_date}
                    />
                  )}

                  {/* Groom Phone */}
                  <Box>
                    <PhoneField
                      label="Groom Phone"
                      name="groom_phone"
                      value={formData.groom_phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter phone number"
                      error={fieldErrors.groom_phone}
                      touched={fieldErrors.groom_phone}
                    />
                  </Box>

                  {/* Bride Phone */}
                  <Box>
                    <PhoneField
                      label="Bride Phone"
                      name="bride_phone"
                      value={formData.bride_phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter phone number"
                      error={fieldErrors.bride_phone}
                      touched={fieldErrors.bride_phone}
                    />
                  </Box>

                  {/* Groom Side Witness */}
                  <FormField
                    label="Groom Side Witness"
                    name="witness_groom_side"
                    value={formData.witness_groom_side}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter witness name"
                    error={fieldErrors.witness_groom_side}
                    touched={fieldErrors.witness_groom_side}
                  />

                  {/* Bride Side Witness */}
                  <FormField
                    label="Bride Side Witness"
                    name="witness_bride_side"
                    value={formData.witness_bride_side}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter witness name"
                    error={fieldErrors.witness_bride_side}
                    touched={fieldErrors.witness_bride_side}
                  />

                  {/* Minister of Marriage */}
                  <FormField
                    label="Minister of Marriage"
                    name="minister_of_marriage"
                    value={formData.minister_of_marriage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter minister name"
                    error={fieldErrors.minister_of_marriage}
                    touched={fieldErrors.minister_of_marriage}
                  />

                  {/* Other Priests */}
                  <FormField
                    label="Other Priests"
                    name="other_priests"
                    value={formData.other_priests}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter other priest names"
                    error={fieldErrors.other_priests}
                    touched={fieldErrors.other_priests}
                  />

                  {/* Remarks - full width */}
                  <Box gridColumn="1 / -1">
                    <TextareaField
                      label="Remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter remarks"
                      error={fieldErrors.remarks}
                      touched={fieldErrors.remarks}
                      rows={2}
                    />
                  </Box>
                </Grid>
              </Box>

              {/* FORM FOOTER */}
              <Flex
                justify="flex-end"
                gap="10px"
                px={{ base: "12px", md: "14px" }}
                py="10px"
                borderTop="1px solid"
                borderTopColor={BORDER}
              >
                <Button
                  type="button"
                  h="30px"
                  minW="100px"
                  bg="white"
                  color={RED}
                  border="1px solid"
                  borderColor={RED}
                  borderRadius="4px"
                  fontSize="10px"
                  fontWeight="600"
                  onClick={() => navigate(`/marriage/${id}`)}
                  _hover={{ bg: "#FFF7F8" }}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  h="30px"
                  minW="120px"
                  bg={RED}
                  color="white"
                  borderRadius="4px"
                  fontSize="10px"
                  fontWeight="600"
                  _hover={{ bg: RED_DARK }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner size="xs" mr="4px" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <LuSave size="14" />
                      Save Changes
                    </>
                  )}
                </Button>
              </Flex>
            </Box>

            {/* RIGHT SIDEBAR */}
            <VStack align="stretch" gap="10px">
              {/* RECORD INFORMATION */}
              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="6px"
                p="12px"
              >
                <Text fontSize="12px" fontWeight="700" color={NAVY} mb="12px">
                  Record Information
                </Text>

                <Flex align="flex-start" gap="10px" pb="12px" borderBottom="1px solid" borderColor="#E5EAF1">
                  <Box color={NAVY} mt="1px">
                    <LuCalendarDays size="16" />
                  </Box>
                  <Box>
                    <Text fontSize="9px" color={NAVY} fontWeight="700">
                      Created
                    </Text>
                    <Text fontSize="10px" color={NAVY} mt="3px">
                      {marriage?.created_at ? formatDate(marriage.created_at) : "—"}
                    </Text>
                  </Box>
                </Flex>

                <Flex align="flex-start" gap="10px" pt="12px">
                  <Box color={NAVY} mt="1px">
                    <LuPencil size="16" />
                  </Box>
                  <Box>
                    <Text fontSize="9px" color={NAVY} fontWeight="700">
                      Last updated
                    </Text>
                    <Text fontSize="10px" color={NAVY} mt="3px">
                      {marriage?.updated_at ? formatDate(marriage.updated_at) : "—"}
                    </Text>
                    {marriage?.updated_by && (
                      <Text fontSize="8px" color={MUTED} mt="2px">
                        by {marriage.updated_by}
                      </Text>
                    )}
                  </Box>
                </Flex>
              </Box>

              {/* CONTEXT INFORMATION */}
              <Box
                bg="white"
                border="1px solid"
                borderColor={BORDER}
                borderRadius="6px"
                p="12px"
              >
                <Text fontSize="12px" fontWeight="700" color={NAVY} mb="10px">
                  Marriage Context
                </Text>

                <VStack align="stretch" gap="2px">
                  <ContextInfoBox
                    icon={<LuUser size="16" />}
                    label="Groom"
                    value={groomName}
                  />
                  <ContextInfoBox
                    icon={<LuUser size="16" />}
                    label="Bride"
                    value={brideName}
                  />
                  <ContextInfoBox
                    icon={<LuHeart size="16" />}
                    label="Marriage Type"
                    value={isTransfer ? "Transfer" : "Sacramental"}
                  />
                  <ContextInfoBox
                    icon={<LuUsers size="16" />}
                    label="Family"
                    value={familyName}
                  />
                  <ContextInfoBox
                    icon={<LuChurch size="16" />}
                    label="Bride Type"
                    value={getBrideTypeLabel()}
                  />
                </VStack>

                <Button
                  variant="ghost"
                  p="0"
                  mt="8px"
                  height="auto"
                  color={RED}
                  fontSize="10px"
                  fontWeight="700"
                  onClick={() => navigate(`/marriage/${id}`)}
                  _hover={{ bg: "transparent", color: RED_DARK }}
                >
                  View Record →
                </Button>
              </Box>
            </VStack>
          </Grid>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default MarriageEditPage;