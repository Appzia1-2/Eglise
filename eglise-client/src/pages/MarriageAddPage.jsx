import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import { LuSave, LuArrowLeft } from "react-icons/lu";

import apiClient from "../api/apiClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  createMarriage,
  listFamilies,
  listMembers,
  listRelationships,
} from "../api/registryServices";

/* ============================================================
   HELPERS
============================================================ */

const getResponseData = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return data || [];
};

/* ============================================================
   COMMON FIELD STYLES
============================================================ */

const inputProps = {
  h: "34px",
  minH: "34px",
  px: "10px",

  border: "1px solid",
  borderColor: "#CBD5E1",

  borderRadius: "5px",
  fontSize: "12px",
  color: "#14265B",
  bg: "white",
  outline: "none",
  boxSizing: "border-box",

  _placeholder: {
    color: "#7890B8",
  },

  _hover: {
    borderColor: "#AEBACC",
  },

  _focus: {
    borderColor: "#3974D8",
    boxShadow: "0 0 0 1px #3974D8",
  },
};

const labelProps = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#14265B",
  mb: "2px",
};

/* ============================================================
   FIELD ERROR DISPLAY COMPONENT
============================================================ */

const FieldError = ({ error }) => {
  if (!error) return null;

  return (
    <Box
      bg="#FFF5F5"
      border="1px solid #F3C4C4"
      borderRadius="4px"
      px="8px"
      py="4px"
      mb="4px"
    >
      <Text fontSize="10px" color="#C00000" fontWeight="500">
        {error}
      </Text>
    </Box>
  );
};

/* ============================================================
   INPUT
============================================================ */

const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  disabled = false,
  error = "",
}) => {
  return (
    <Box>
      <Text {...labelProps}>
        {label}
        {required && (
          <Text as="span" color="#E00000" ml="2px">
            *
          </Text>
        )}
      </Text>

      <FieldError error={error} />

      <Box
        as="input"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        w="100%"
        {...inputProps}
        bg={disabled ? "#F3F5F8" : "white"}
        cursor={disabled ? "not-allowed" : "text"}
        borderColor={error ? "#F3C4C4" : "#CBD5E1"}
        _focus={error ? {
          borderColor: "#F3C4C4",
          boxShadow: "0 0 0 1px #F3C4C4",
        } : {
          borderColor: "#3974D8",
          boxShadow: "0 0 0 1px #3974D8",
        }}
      />
    </Box>
  );
};

/* ============================================================
   SELECT
============================================================ */

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = "Select",
  disabled = false,
  error = "",
}) => {
  return (
    <Box>
      <Text {...labelProps}>
        {label}
        {required && (
          <Text as="span" color="#E00000" ml="2px">
            *
          </Text>
        )}
      </Text>

      <FieldError error={error} />

      <Box
        as="select"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        w="100%"
        {...inputProps}
        px="8px"
        cursor={disabled ? "not-allowed" : "pointer"}
        bg={disabled ? "#F3F5F8" : "white"}
        borderColor={error ? "#F3C4C4" : "#CBD5E1"}
        _focus={error ? {
          borderColor: "#F3C4C4",
          boxShadow: "0 0 0 1px #F3C4C4",
        } : {
          borderColor: "#3974D8",
          boxShadow: "0 0 0 1px #3974D8",
        }}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </Box>
    </Box>
  );
};

/* ============================================================
   TEXTAREA
============================================================ */

const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
  rows = 3,
  error = "",
}) => {
  return (
    <Box>
      <Text {...labelProps}>
        {label}
        {required && (
          <Text as="span" color="#E00000" ml="2px">
            *
          </Text>
        )}
      </Text>

      <FieldError error={error} />

      <Box
        as="textarea"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        w="100%"
        px="10px"
        py="7px"
        border="1px solid"
        borderColor={error ? "#F3C4C4" : "#CBD5E1"}
        borderRadius="5px"
        bg="white"
        color="#14265B"
        fontSize="12px"
        resize="vertical"
        outline="none"
        boxSizing="border-box"
        _hover={{
          borderColor: error ? "#F3C4C4" : "#AEBACC",
        }}
        _focus={{
          borderColor: error ? "#F3C4C4" : "#3974D8",
          boxShadow: error ? "0 0 0 1px #F3C4C4" : "0 0 0 1px #3974D8",
        }}
        _placeholder={{
          color: "#7890B8",
        }}
      />
    </Box>
  );
};

/* ============================================================
   PHONE INPUT
============================================================ */

const PhoneInput = ({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
  disabled = false,
  error = "",
}) => {
  return (
    <Box>
      <Text {...labelProps}>
        {label}
        {required && (
          <Text as="span" color="#E00000" ml="2px">
            *
          </Text>
        )}
      </Text>

      <FieldError error={error} />

      <Flex gap="7px">
        <Box
          as="select"
          w="70px"
          {...inputProps}
          px="6px"
          disabled
        >
          <option>+91</option>
        </Box>

        <Box
          as="input"
          name={name}
          type="tel"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          flex="1"
          {...inputProps}
          bg={disabled ? "#F3F5F8" : "white"}
          cursor={disabled ? "not-allowed" : "text"}
          borderColor={error ? "#F3C4C4" : "#CBD5E1"}
          _focus={error ? {
            borderColor: "#F3C4C4",
            boxShadow: "0 0 0 1px #F3C4C4",
          } : {
            borderColor: "#3974D8",
            boxShadow: "0 0 0 1px #3974D8",
          }}
        />
      </Flex>
    </Box>
  );
};

/* ============================================================
   INITIAL FORM
============================================================ */

const initialForm = {
  marriage_type: "ADD_BRIDE",
  date: "",
  
  // Groom fields
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
  
  // Bride fields
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
  
  // Common
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
   PAGE
============================================================ */

const MarriageAddPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);

  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [familiesRes, membersRes, relationshipsRes] = await Promise.all([
        listFamilies(),
        listMembers(),
        listRelationships(),
      ]);

      const familiesData = getResponseData(familiesRes);
      const membersData = getResponseData(membersRes);
      const relationshipsData = getResponseData(relationshipsRes);

      setFamilies(familiesData);
      setMembers(membersData);
      setRelationships(relationshipsData);

      console.log("✓ Families loaded:", familiesData.length);
      console.log("✓ Members loaded:", membersData.length);
      console.log("✓ Relationships loaded:", relationshipsData.length);
    } catch (err) {
      console.error("Error loading marriage form data:", err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load the required data. Please try again."
      );
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
     CHANGE HANDLERS
  ========================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));

    setError("");
  };

  const handleMarriageTypeChange = (event) => {
    const value = event.target.value;

    setFormData((prev) => ({
      ...prev,
      marriage_type: value,
      bride_is_internal: true,
      groom_is_internal: true,
      groom_family: "",
      bride_family: "",
      groom_member: "",
      bride_member: "",
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
      bride_member: "",
      bride_family: "",
      bride_name: "",
      bride_dob: "",
      bride_father: "",
      bride_mother: "",
      bride_address: "",
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
      groom_family: "",
      groom_member: "",
      groom_name: "",
      groom_dob: "",
      groom_house_name: "",
      groom_family_name: "",
      groom_address: "",
      groom_father: "",
      groom_mother: "",
    }));

    setFieldErrors({});
    setError("");
  };

  const handleGroomFamilyChange = (event) => {
    const { value } = event.target;

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
    const { value } = event.target;

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

      console.log("=== MARRIAGE SUBMISSION ===");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      await createMarriage(payload);
      navigate("/marriage");
    } catch (err) {
      console.error("✗ Error creating marriage:", err);

      const responseData = err?.response?.data;

      console.error("=== API ERROR DETAILS ===");
      console.error("Status code:", err?.response?.status);
      console.error("Response data:", JSON.stringify(responseData, null, 2));

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

        const generalError =
          responseData.detail ||
          responseData.non_field_errors?.[0];

        if (generalError) {
          setError(generalError);
        } else if (Object.keys(errors).length > 0) {
          setError(`Validation failed for: ${Object.keys(errors).join(", ")}`);
        }
      } else {
        setError("Unable to create marriage record. Please try again.");
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
      <>
        <Navbar />

        <Box minH="calc(100vh - 120px)" bg="white">
          <Flex minH="400px" align="center" justify="center">
            <VStack gap="3">
              <Spinner size="md" color="#E00000" />

              <Text fontSize="11px" color="#7081A3">
                Loading marriage form...
              </Text>
            </VStack>
          </Flex>
        </Box>

        <Footer />
      </>
    );
  }

  /* ==========================================================
     UI
  ========================================================== */

  const isAddBride = formData.marriage_type === "ADD_BRIDE";
  const isTransferBride = formData.marriage_type === "TRANSFER_BRIDE";

  const getPageTitle = () => {
    if (isTransferBride) return "Transfer Bride from Parish";
    if (isAddBride && !brideIsInternal) return "Add Marriage – Bride from Other Parish";
    return "Add Marriage";
  };

  return (
    <Box minH="100vh" bg="white">
      <Navbar />

      <Box
        maxW="1400px"
        mx="auto"
        px={{ base: "16px", md: "24px", lg: "30px" }}
        py={{ base: "14px", md: "16px" }}
      >
        {/* BREADCRUMB */}
        <Flex align="center" gap="7px" mb="10px" flexWrap="wrap">
          <Text fontSize="11px" color="#3974D8">Masters</Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#3974D8">Marriage Register</Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#7081A3">{getPageTitle()}</Text>
        </Flex>

        {/* PAGE HEADER */}
        <Box mb="12px">
          <Text
            fontSize="10px"
            fontWeight="700"
            color="#E00000"
            textTransform="uppercase"
            letterSpacing="0.5px"
            mb="2px"
          >
            MARRIAGE REGISTER
          </Text>

          <Flex align="center" justify="space-between" flexWrap="wrap" gap="12px">
            <Box>
              <Heading
                fontSize={{ base: "22px", md: "25px" }}
                fontWeight="600"
                color="#14265B"
                lineHeight="1.15"
              >
                {getPageTitle()}
              </Heading>

              <Text fontSize="11px" color="#7081A3" mt="3px">
                {isTransferBride
                  ? "Register a bride transfer from the parish."
                  : isAddBride && !brideIsInternal
                  ? "Register marriage with a bride from another parish."
                  : "Register a new marriage ceremony in the parish."}
              </Text>
            </Box>

            <Button
              type="button"
              h="34px"
              px="16px"
              fontSize="11px"
              fontWeight="600"
              borderRadius="5px"
              variant="outline"
              borderColor="#CBD5E1"
              color="#14265B"
              bg="white"
              onClick={() => navigate("/marriage")}
              _hover={{ bg: "#F5F7FA" }}
            >
              <LuArrowLeft style={{ marginRight: "6px" }} />
              Back to List
            </Button>
          </Flex>
        </Box>

        {/* GENERAL ERROR */}
        {error && (
          <Box
            bg="#FFF5F5"
            border="1px solid"
            borderColor="#F3C4C4"
            borderRadius="6px"
            px="10px"
            py="8px"
            mb="10px"
          >
            <Text fontSize="11px" color="#C00000" fontWeight="500">
              {error}
            </Text>
          </Box>
        )}

        {/* FORM CARD */}
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          border="1px solid"
          borderColor="#DDE4EE"
          borderRadius="6px"
          overflow="hidden"
        >
          {/* FORM BODY */}
          <Box p={{ base: "14px", md: "16px" }}>
            {/* SECTION TITLE */}
            <Text fontSize="14px" fontWeight="600" color="#14265B" mb="10px">
              Marriage Information
            </Text>

            {/* =================================================
                ROW 1: Marriage Type & Date
            ================================================= */}

            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
              mb="7px"
            >
              <FormSelect
                label="Marriage Type"
                name="marriage_type"
                value={formData.marriage_type}
                onChange={handleMarriageTypeChange}
                required
                error={fieldErrors.marriage_type}
                options={[
                  { value: "ADD_BRIDE", label: "Add Bride to Parish" },
                  { value: "TRANSFER_BRIDE", label: "Transfer Bride from Parish" },
                ]}
                placeholder="Select marriage type"
              />

              <FormField
                label={isTransferBride ? "Day & Time" : "Marriage Date"}
                name="date"
                type={isTransferBride ? "datetime-local" : "date"}
                value={formData.date}
                onChange={handleChange}
                required
                error={fieldErrors.date}
                placeholder={isTransferBride ? "Select day & time" : "Select date"}
              />
            </SimpleGrid>

            {/* =================================================
                ADD BRIDE - SAME PARISH
            ================================================= */}

            {isAddBride && brideIsInternal && (
              <>
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormSelect
                    label="Groom's Family"
                    name="groom_family"
                    value={formData.groom_family}
                    onChange={handleGroomFamilyChange}
                    required
                    error={fieldErrors.groom_family}
                    options={familyOptions}
                    placeholder="Select groom's family"
                  />

                  <FormSelect
                    label="Select Groom"
                    name="groom_member"
                    value={formData.groom_member}
                    onChange={handleChange}
                    required
                    disabled={!formData.groom_family}
                    error={fieldErrors.groom_member}
                    options={groomOptions}
                    placeholder={formData.groom_family ? "Select groom (SINGLE, WIDOWED, DIVORCED)" : "Select family first"}
                  />

                  <FormSelect
                    label="Bride Type"
                    name="bride_is_internal"
                    value={String(formData.bride_is_internal)}
                    onChange={handleBrideTypeChange}
                    required
                    error={fieldErrors.bride_is_internal}
                    options={[
                      { value: "true", label: "Internal Bride (Church Member)" },
                      { value: "false", label: "External Bride (Non-Member)" },
                    ]}
                    placeholder="Select bride type"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormSelect
                    label="Bride's Family"
                    name="bride_family"
                    value={formData.bride_family}
                    onChange={handleBrideFamilyChange}
                    required
                    error={fieldErrors.bride_family}
                    options={familyOptions}
                    placeholder="Select bride's family"
                  />

                  <FormSelect
                    label="Select Bride"
                    name="bride_member"
                    value={formData.bride_member}
                    onChange={handleChange}
                    required
                    disabled={!formData.bride_family}
                    error={fieldErrors.bride_member}
                    options={brideOptions}
                    placeholder={formData.bride_family ? "Select bride (SINGLE, WIDOWED, DIVORCED)" : "Select family first"}
                  />

                  <FormSelect
                    label="Relationship"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    required
                    error={fieldErrors.relationship}
                    options={relationshipOptions}
                    placeholder="Select relationship"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Groom Nationality"
                    name="groom_nationality"
                    value={formData.groom_nationality}
                    onChange={handleChange}
                    required
                    error={fieldErrors.groom_nationality}
                    placeholder="Enter groom nationality"
                  />

                  <FormField
                    label="Bride Nationality"
                    name="bride_nationality"
                    value={formData.bride_nationality}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_nationality}
                    placeholder="Enter bride nationality"
                  />

                  <FormSelect
                    label="Primary Family (Groom's Family)"
                    name="family"
                    value={formData.family}
                    onChange={handleChange}
                    required
                    error={fieldErrors.family}
                    options={familyOptions}
                    placeholder="Select family"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Groom Side Witness"
                    name="witness_groom_side"
                    value={formData.witness_groom_side}
                    onChange={handleChange}
                    required
                    error={fieldErrors.witness_groom_side}
                    placeholder="Enter groom side witness"
                  />

                  <FormField
                    label="Bride Side Witness"
                    name="witness_bride_side"
                    value={formData.witness_bride_side}
                    onChange={handleChange}
                    required
                    error={fieldErrors.witness_bride_side}
                    placeholder="Enter bride side witness"
                  />

                  <FormField
                    label="Minister of Marriage"
                    name="minister_of_marriage"
                    value={formData.minister_of_marriage}
                    onChange={handleChange}
                    required
                    error={fieldErrors.minister_of_marriage}
                    placeholder="Enter minister of marriage"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                >
                  <FormField
                    label="Other Priests (Optional)"
                    name="other_priests"
                    value={formData.other_priests}
                    onChange={handleChange}
                    error={fieldErrors.other_priests}
                    placeholder="Enter other priest names"
                  />

                  <FormTextarea
                    label="Remarks (Optional)"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    error={fieldErrors.remarks}
                    placeholder="Enter remarks"
                    rows={2}
                  />
                </SimpleGrid>
              </>
            )}

            {/* =================================================
                ADD BRIDE - OTHER PARISH
            ================================================= */}

            {isAddBride && !brideIsInternal && (
              <>
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormSelect
                    label="Groom's Family"
                    name="groom_family"
                    value={formData.groom_family}
                    onChange={handleGroomFamilyChange}
                    required
                    error={fieldErrors.groom_family}
                    options={familyOptions}
                    placeholder="Select groom's family"
                  />

                  <FormSelect
                    label="Select Groom"
                    name="groom_member"
                    value={formData.groom_member}
                    onChange={handleChange}
                    required
                    disabled={!formData.groom_family}
                    error={fieldErrors.groom_member}
                    options={groomOptions}
                    placeholder={formData.groom_family ? "Select groom (SINGLE, WIDOWED, DIVORCED)" : "Select family first"}
                  />

                  <FormSelect
                    label="Bride Type"
                    name="bride_is_internal"
                    value={String(formData.bride_is_internal)}
                    onChange={handleBrideTypeChange}
                    required
                    error={fieldErrors.bride_is_internal}
                    options={[
                      { value: "true", label: "Internal Bride (Church Member)" },
                      { value: "false", label: "External Bride (Non-Member)" },
                    ]}
                    placeholder="Select bride type"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Bride Name"
                    name="bride_name"
                    value={formData.bride_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_name}
                    placeholder="Enter bride name"
                  />

                  <FormField
                    label="Bride Date of Birth"
                    name="bride_dob"
                    type="date"
                    value={formData.bride_dob}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_dob}
                    placeholder="Select date"
                  />

                  <FormField
                    label="Bride's Father Name"
                    name="bride_father"
                    value={formData.bride_father}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_father}
                    placeholder="Enter bride's father name"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Bride's Mother Name"
                    name="bride_mother"
                    value={formData.bride_mother}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_mother}
                    placeholder="Enter bride's mother name"
                  />

                  <FormField
                    label="Bride's Address"
                    name="bride_address"
                    value={formData.bride_address}
                    onChange={handleChange}
                    error={fieldErrors.bride_address}
                    placeholder="Enter bride's address"
                  />

                  <FormSelect
                    label="Relationship"
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    required
                    error={fieldErrors.relationship}
                    options={relationshipOptions}
                    placeholder="Select relationship"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Groom Nationality"
                    name="groom_nationality"
                    value={formData.groom_nationality}
                    onChange={handleChange}
                    required
                    error={fieldErrors.groom_nationality}
                    placeholder="Enter groom nationality"
                  />

                  <FormField
                    label="Bride Nationality"
                    name="bride_nationality"
                    value={formData.bride_nationality}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_nationality}
                    placeholder="Enter bride nationality"
                  />

                  <FormSelect
                    label="Primary Family (Groom's Family)"
                    name="family"
                    value={formData.family}
                    onChange={handleChange}
                    required
                    error={fieldErrors.family}
                    options={familyOptions}
                    placeholder="Select family"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Groom Side Witness"
                    name="witness_groom_side"
                    value={formData.witness_groom_side}
                    onChange={handleChange}
                    required
                    error={fieldErrors.witness_groom_side}
                    placeholder="Enter groom side witness"
                  />

                  <FormField
                    label="Bride Side Witness"
                    name="witness_bride_side"
                    value={formData.witness_bride_side}
                    onChange={handleChange}
                    required
                    error={fieldErrors.witness_bride_side}
                    placeholder="Enter bride side witness"
                  />

                  <FormField
                    label="Minister of Marriage"
                    name="minister_of_marriage"
                    value={formData.minister_of_marriage}
                    onChange={handleChange}
                    required
                    error={fieldErrors.minister_of_marriage}
                    placeholder="Enter minister of marriage"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                >
                  <FormField
                    label="Other Priests (Optional)"
                    name="other_priests"
                    value={formData.other_priests}
                    onChange={handleChange}
                    error={fieldErrors.other_priests}
                    placeholder="Enter other priest names"
                  />

                  <FormTextarea
                    label="Remarks (Optional)"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    error={fieldErrors.remarks}
                    placeholder="Enter remarks"
                    rows={2}
                  />
                </SimpleGrid>
              </>
            )}

            {/* =================================================
                TRANSFER BRIDE
            ================================================= */}

            {isTransferBride && (
              <>
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormSelect
                    label="Bride's Family"
                    name="bride_family"
                    value={formData.bride_family}
                    onChange={handleBrideFamilyChange}
                    required
                    error={fieldErrors.bride_family}
                    options={familyOptions}
                    placeholder="Select bride's family"
                  />

                  <FormSelect
                    label="Select Bride"
                    name="bride_member"
                    value={formData.bride_member}
                    onChange={handleChange}
                    required
                    disabled={!formData.bride_family}
                    error={fieldErrors.bride_member}
                    options={brideOptions}
                    placeholder={formData.bride_family ? "Select bride (SINGLE, WIDOWED, DIVORCED)" : "Select family first"}
                  />

                  <FormSelect
                    label="Groom Type"
                    name="groom_is_internal"
                    value={String(formData.groom_is_internal)}
                    onChange={handleGroomTypeChange}
                    required
                    error={fieldErrors.groom_is_internal}
                    options={[
                      { value: "true", label: "Internal Groom (Church Member)" },
                      { value: "false", label: "External Groom (Non-Member)" },
                    ]}
                    placeholder="Select groom type"
                  />
                </SimpleGrid>

                {groomIsInternal ? (
                  <SimpleGrid
                    columns={{ base: 1, md: 2, lg: 3 }}
                    columnGap={{ base: "14px", md: "24px" }}
                    rowGap="7px"
                    mb="7px"
                  >
                    <FormSelect
                      label="Groom's Family"
                      name="groom_family"
                      value={formData.groom_family}
                      onChange={handleGroomFamilyChange}
                      required
                      error={fieldErrors.groom_family}
                      options={familyOptions}
                      placeholder="Select groom's family"
                    />

                    <FormSelect
                      label="Select Groom"
                      name="groom_member"
                      value={formData.groom_member}
                      onChange={handleChange}
                      required
                      disabled={!formData.groom_family}
                      error={fieldErrors.groom_member}
                      options={groomOptions}
                      placeholder={formData.groom_family ? "Select groom (SINGLE, WIDOWED, DIVORCED)" : "Select family first"}
                    />
                  </SimpleGrid>
                ) : (
                  <SimpleGrid
                    columns={{ base: 1, md: 2, lg: 3 }}
                    columnGap={{ base: "14px", md: "24px" }}
                    rowGap="7px"
                    mb="7px"
                  >
                    <FormField
                      label="Groom Full Name"
                      name="groom_name"
                      value={formData.groom_name}
                      onChange={handleChange}
                      required
                      error={fieldErrors.groom_name}
                      placeholder="Enter groom's full name"
                    />

                    <FormField
                      label="Groom Date of Birth"
                      name="groom_dob"
                      type="date"
                      value={formData.groom_dob}
                      onChange={handleChange}
                      error={fieldErrors.groom_dob}
                      placeholder="Select date"
                    />

                    <FormField
                      label="Groom House Name"
                      name="groom_house_name"
                      value={formData.groom_house_name}
                      onChange={handleChange}
                      error={fieldErrors.groom_house_name}
                      placeholder="Enter house name"
                    />
                  </SimpleGrid>
                )}

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Transfer To Parish"
                    name="transfer_to"
                    value={formData.transfer_to}
                    onChange={handleChange}
                    required
                    error={fieldErrors.transfer_to}
                    placeholder="Enter parish name"
                  />

                  <FormField
                    label="Vicar Name"
                    name="vicar_name"
                    value={formData.vicar_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.vicar_name}
                    placeholder="Enter vicar name"
                  />

                  {!groomIsInternal && (
                    <FormField
                      label="Groom Address"
                      name="groom_address"
                      value={formData.groom_address}
                      onChange={handleChange}
                      error={fieldErrors.groom_address}
                      placeholder="Enter groom address"
                    />
                  )}
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Groom Confession Date"
                    name="groom_confession_date"
                    type="date"
                    value={formData.groom_confession_date}
                    onChange={handleChange}
                    required
                    error={fieldErrors.groom_confession_date}
                    placeholder="Select date"
                  />

                  <FormField
                    label="Bride Confession Date"
                    name="bride_confession_date"
                    type="date"
                    value={formData.bride_confession_date}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_confession_date}
                    placeholder="Select date"
                  />

                  <FormSelect
                    label="Primary Family (Bride's Family)"
                    name="family"
                    value={formData.family}
                    onChange={handleChange}
                    required
                    error={fieldErrors.family}
                    options={familyOptions}
                    placeholder="Select family"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Groom Nationality"
                    name="groom_nationality"
                    value={formData.groom_nationality}
                    onChange={handleChange}
                    required
                    error={fieldErrors.groom_nationality}
                    placeholder="Enter groom nationality"
                  />

                  <FormField
                    label="Bride Nationality"
                    name="bride_nationality"
                    value={formData.bride_nationality}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_nationality}
                    placeholder="Enter bride nationality"
                  />

                  {!groomIsInternal && (
                    <>
                      <FormField
                        label="Groom Father Name"
                        name="groom_father"
                        value={formData.groom_father}
                        onChange={handleChange}
                        error={fieldErrors.groom_father}
                        placeholder="Enter groom father name"
                      />
                    </>
                  )}
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  {!groomIsInternal && (
                    <FormField
                      label="Groom Mother Name"
                      name="groom_mother"
                      value={formData.groom_mother}
                      onChange={handleChange}
                      error={fieldErrors.groom_mother}
                      placeholder="Enter groom mother name"
                    />
                  )}

                  <FormField
                    label="Bride Father Name"
                    name="bride_father"
                    value={formData.bride_father}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_father}
                    placeholder="Enter bride father name"
                  />

                  <FormField
                    label="Bride Mother Name"
                    name="bride_mother"
                    value={formData.bride_mother}
                    onChange={handleChange}
                    required
                    error={fieldErrors.bride_mother}
                    placeholder="Enter bride mother name"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <PhoneInput
                    label="Groom Phone Number"
                    name="groom_phone"
                    value={formData.groom_phone}
                    onChange={handleChange}
                    error={fieldErrors.groom_phone}
                    placeholder="Enter phone number"
                  />

                  <PhoneInput
                    label="Bride Phone Number"
                    name="bride_phone"
                    value={formData.bride_phone}
                    onChange={handleChange}
                    error={fieldErrors.bride_phone}
                    placeholder="Enter phone number"
                  />
                </SimpleGrid>

                <SimpleGrid
                  columns={{ base: 1, md: 2 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                >
                  <FormTextarea
                    label="Remarks (Optional)"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    error={fieldErrors.remarks}
                    placeholder="Enter remarks"
                    rows={2}
                  />
                </SimpleGrid>
              </>
            )}
          </Box>

          {/* FORM FOOTER */}
          <Flex
            justify="flex-end"
            align="center"
            gap="8px"
            px={{ base: "14px", md: "16px" }}
            py="10px"
            borderTop="1px solid"
            borderColor="#DDE4EE"
            bg="white"
            flexWrap="wrap"
          >
            <Button
              type="button"
              h="34px"
              minH="34px"
              px="20px"
              fontSize="11px"
              fontWeight="600"
              borderRadius="5px"
              variant="outline"
              borderColor="#E00000"
              color="#E00000"
              bg="white"
              onClick={() => navigate("/marriage")}
              disabled={saving}
              _hover={{ bg: "#FFF5F5" }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              h="34px"
              minH="34px"
              px="20px"
              fontSize="11px"
              fontWeight="600"
              borderRadius="5px"
              bg="#E00000"
              color="white"
              disabled={saving}
              _hover={{ bg: "#C90000" }}
            >
              {saving ? (
                <>
                  <Spinner size="xs" mr="5px" />
                  Saving...
                </>
              ) : (
                <>
                  <LuSave style={{ marginRight: "5px" }} />
                  {isTransferBride ? "Transfer Bride" : "Add Marriage"}
                </>
              )}
            </Button>
          </Flex>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default MarriageAddPage;