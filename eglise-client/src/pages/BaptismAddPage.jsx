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

import { LuSave } from "react-icons/lu";

import apiClient from "../api/apiClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toaster } from "../components/ui/toaster";

// ============================================================
// HELPERS
// ============================================================

const getResponseData = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return data || [];
};

// ============================================================
// TOAST HELPER
// ============================================================

const showToast = ({
  title,
  description,
  type = "info",
  duration = 4000,
}) => {
  toaster.create({
    title,
    description,
    type,
    duration,
    closable: true,
  });
};

// ============================================================
// COMMON FIELD STYLES
// ============================================================

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
  _placeholder: { color: "#7890B8" },
  _hover: { borderColor: "#AEBACC" },
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

// ============================================================
// INPUT
// ============================================================

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
}) => (
  <Box>
    <Text {...labelProps}>
      {label}
      {required && (
        <Text as="span" color="#E00000" ml="2px">
          *
        </Text>
      )}
    </Text>

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
      _focus={
        error
          ? {
              borderColor: "#F3C4C4",
              boxShadow: "0 0 0 1px #F3C4C4",
            }
          : {
              borderColor: "#3974D8",
              boxShadow: "0 0 0 1px #3974D8",
            }
      }
    />
  </Box>
);

// ============================================================
// SELECT
// ============================================================

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
}) => (
  <Box>
    <Text {...labelProps}>
      {label}
      {required && (
        <Text as="span" color="#E00000" ml="2px">
          *
        </Text>
      )}
    </Text>

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
      _focus={
        error
          ? {
              borderColor: "#F3C4C4",
              boxShadow: "0 0 0 1px #F3C4C4",
            }
          : {
              borderColor: "#3974D8",
              boxShadow: "0 0 0 1px #3974D8",
            }
      }
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

// ============================================================
// TEXTAREA
// ============================================================

const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
  rows = 3,
  error = "",
}) => (
  <Box>
    <Text {...labelProps}>
      {label}
      {required && (
        <Text as="span" color="#E00000" ml="2px">
          *
        </Text>
      )}
    </Text>

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
      _hover={{ borderColor: error ? "#F3C4C4" : "#AEBACC" }}
      _focus={{
        borderColor: error ? "#F3C4C4" : "#3974D8",
        boxShadow: error
          ? "0 0 0 1px #F3C4C4"
          : "0 0 0 1px #3974D8",
      }}
      _placeholder={{ color: "#7890B8" }}
    />
  </Box>
);

// ============================================================
// INITIAL FORM
// ============================================================

const initialForm = {
  baptism_category: "PARISH",
  date_of_baptism: "",
  name: "",
  baptismal_name: "",
  gender: "",
  dob: "",
  place_of_birth: "",
  parish_of_baptism: "",
  panchayath: "",
  priest_name: "",
  god_father: "",
  god_mother: "",
  father_name: "",
  mother_name: "",
  family: "",
  main_member: "",
  relation_with_main_member: "",
  email: "",
  mobile_number: "",
  present_address: "",
  permanent_address: "",
  same_as_present: false,
  remarks: "",
};

// ============================================================
// REQUIRED FIELDS PER CATEGORY
// ============================================================

const COMMON_REQUIRED = [
  "date_of_baptism",
  "name",
  "baptismal_name",
  "gender",
  "dob",
  "place_of_birth",
  "parish_of_baptism",
  "panchayath",
  "priest_name",
  "father_name",
];

const PARISH_REQUIRED = [
  ...COMMON_REQUIRED,
  "family",
  "main_member",
  "relation_with_main_member",
];

const OTHER_REQUIRED = [
  ...COMMON_REQUIRED,
  "present_address",
  "permanent_address",
];

// Human-readable labels (for toast messages)
const FIELD_LABELS = {
  date_of_baptism: "Date of Baptism",
  name: "Name",
  baptismal_name: "Baptism Name",
  gender: "Gender",
  dob: "Date of Birth",
  place_of_birth: "Place of Birth",
  parish_of_baptism: "Parish of Baptism",
  panchayath: "Panchayath",
  priest_name: "Priest Name",
  father_name: "Father Name",
  mother_name: "Mother Name",
  family: "Family Name",
  main_member: "Main Member",
  relation_with_main_member: "Relationship",
  present_address: "Present Address",
  permanent_address: "Permanent Address",
  mobile_number: "Mobile Number",
  email: "Email",
};

// ============================================================
// PAGE
// ============================================================

const BaptismAddPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [familiesResponse, membersResponse, relationshipsResponse] =
        await Promise.all([
          apiClient.get("/api/registry/families/"),
          apiClient.get("/api/registry/members/"),
          apiClient.get("/api/registry/relationships/"),
        ]);

      setFamilies(getResponseData(familiesResponse));
      setMembers(getResponseData(membersResponse));
      setRelationships(getResponseData(relationshipsResponse));
    } catch (err) {
      console.error("Error loading baptism form data:", err);

      showToast({
        title: "Failed to load data",
        description:
          err?.response?.data?.detail ||
          "Unable to load the required data. Please try again.",
        type: "error",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CHANGE
  // ==========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear the red border for this field once user edits it
    setFieldErrors((prev) =>
      prev[name] ? { ...prev, [name]: undefined } : prev
    );
  };

  // ==========================================================
  // CATEGORY CHANGE
  // ==========================================================

  const handleCategoryChange = (event) => {
    const value = event.target.value;

    setFormData((prev) => ({
      ...prev,
      baptism_category: value,

      family: value === "PARISH" ? prev.family : "",
      main_member: value === "PARISH" ? prev.main_member : "",
      relation_with_main_member:
        value === "PARISH" ? prev.relation_with_main_member : "",

      email: value === "OTHER" ? prev.email : "",
      mobile_number: value === "OTHER" ? prev.mobile_number : "",
      present_address:
        value === "OTHER" ? prev.present_address : "",
      permanent_address:
        value === "OTHER" ? prev.permanent_address : "",
      same_as_present:
        value === "OTHER" ? prev.same_as_present : false,
      remarks: value === "OTHER" ? prev.remarks : "",
    }));

    setFieldErrors({});
  };

  // ==========================================================
  // FAMILY MEMBERS
  // ==========================================================

  const familyMembers = useMemo(() => {
    if (!formData.family) return [];

    return members.filter((member) => {
      const memberFamily = member.family ?? member.family_id;
      const familyId =
        typeof memberFamily === "object"
          ? memberFamily?.id
          : memberFamily;

      return (
        String(familyId) === String(formData.family) &&
        (member.is_family_head === true || member.is_family_head === 1)
      );
    });
  }, [members, formData.family]);

  // ==========================================================
  // OPTIONS
  // ==========================================================

  const familyOptions = families.map((family) => ({
    value: family.id,
    label:
      family.family_name ||
      family.name ||
      `Family #${family.id}`,
  }));

  const memberOptions = familyMembers.map((member) => ({
    value: member.id,
    label: member.name || `Member #${member.id}`,
  }));

  const relationshipOptions = relationships.map((relationship) => ({
    value: relationship.id,
    label:
      relationship.name ||
      relationship.relationship_name ||
      relationship.relation_name ||
      `Relationship #${relationship.id}`,
  }));

  // ==========================================================
  // FAMILY CHANGE
  // ==========================================================

  const handleFamilyChange = (event) => {
    const { value } = event.target;

    setFormData((prev) => ({
      ...prev,
      family: value,
      main_member: "",
      relation_with_main_member: "",
    }));

    setFieldErrors((prev) => ({
      ...prev,
      family: undefined,
      main_member: undefined,
      relation_with_main_member: undefined,
    }));
  };

  // ==========================================================
  // SAME ADDRESS
  // ==========================================================

  const handleSameAddress = (event) => {
    const checked = event.target.checked;

    setFormData((prev) => ({
      ...prev,
      same_as_present: checked,
      permanent_address: checked ? prev.present_address : "",
    }));
  };

  // ==========================================================
  // PRESENT ADDRESS CHANGE
  // ==========================================================

  const handlePresentAddressChange = (event) => {
    const value = event.target.value;

    setFormData((prev) => ({
      ...prev,
      present_address: value,
      permanent_address: prev.same_as_present
        ? value
        : prev.permanent_address,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      present_address: undefined,
      permanent_address: undefined,
      address: undefined,
    }));
  };

  // ==========================================================
  // VALIDATE
  // ==========================================================

  const validateForm = () => {
    const requiredFields =
      formData.baptism_category === "PARISH"
        ? PARISH_REQUIRED
        : OTHER_REQUIRED;

    const errors = {};
    const missing = [];

    // -------- Required fields --------
    requiredFields.forEach((field) => {
      const value = formData[field];

      if (value === "" || value === null || value === undefined) {
        errors[field] = `${
          FIELD_LABELS[field] || field
        } is required`;
        missing.push(FIELD_LABELS[field] || field);
      }
    });

    // -------- Date cross-check --------
    // Date of Baptism cannot be earlier than Date of Birth.
    // (Same-day is allowed — only strictly-earlier is rejected.)
    if (formData.dob && formData.date_of_baptism) {
      const dob = new Date(formData.dob);
      const baptismDate = new Date(formData.date_of_baptism);

      const dobValid = !Number.isNaN(dob.getTime());
      const baptismValid = !Number.isNaN(baptismDate.getTime());

      if (dobValid && baptismValid && baptismDate < dob) {
        errors.date_of_baptism =
          "Date of Baptism cannot be earlier than Date of Birth";
      }
    }

    setFieldErrors(errors);

    return { errors, missing };
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ---- Client-side validation ----
    const { errors, missing } = validateForm();

    if (Object.keys(errors).length > 0) {
      // Prefer explicit rule errors (e.g. date ordering) over the
      // generic "missing fields" list when both exist.
      const explicitMessages = Object.entries(errors)
        .filter(([key]) => !missing.includes(FIELD_LABELS[key]))
        .map(([, msg]) => msg);

      let description;

      if (explicitMessages.length > 0) {
        description = explicitMessages.join("\n");
      } else if (missing.length === 1) {
        description = `${missing[0]} is required.`;
      } else {
        description = `Please fill: ${missing.join(", ")}.`;
      }

      showToast({
        title: "Please fix the form",
        description,
        type: "warning",
        duration: 5000,
      });
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const payload = {
        baptism_category: formData.baptism_category,
        date_of_baptism: formData.date_of_baptism,
        name: formData.name,
        baptismal_name: formData.baptismal_name,
        gender: formData.gender,
        dob: formData.dob || null,
        place_of_birth: formData.place_of_birth,
        parish_of_baptism: formData.parish_of_baptism,
        panchayath: formData.panchayath,
        priest_name: formData.priest_name,
        god_father: formData.god_father,
        god_mother: formData.god_mother,
        father_name: formData.father_name,
        mother_name: formData.mother_name,

        // Required "address" — falls back to parish of baptism
        address:
          formData.present_address ||
          formData.parish_of_baptism ||
          "",
      };

      if (formData.baptism_category === "PARISH") {
        payload.family = formData.family
          ? Number(formData.family)
          : null;
        payload.main_member = formData.main_member
          ? Number(formData.main_member)
          : null;
        payload.relation_with_main_member =
          formData.relation_with_main_member
            ? Number(formData.relation_with_main_member)
            : null;
      }

      if (formData.baptism_category === "OTHER") {
        payload.email = formData.email;
        payload.mobile_number = formData.mobile_number;
        payload.present_address = formData.present_address;
        payload.permanent_address = formData.permanent_address;
        payload.remarks = formData.remarks;
      }

      await apiClient.post("/api/registry/baptisms/", payload);

      showToast({
        title: "Baptism recorded",
        description: "The baptism record was created successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/baptism");
    } catch (err) {
      console.error("Error creating baptism:", err);

      const responseData = err?.response?.data;

      // -------- Map backend field errors --------
      if (
        responseData &&
        typeof responseData === "object" &&
        !Array.isArray(responseData)
      ) {
        const errors = {};

        Object.entries(responseData).forEach(([key, value]) => {
          if (Array.isArray(value)) errors[key] = value.join(", ");
          else if (typeof value === "string") errors[key] = value;
          else errors[key] = JSON.stringify(value);
        });

        setFieldErrors(errors);

        const generalError =
          responseData.detail ||
          responseData.non_field_errors?.[0];

        // Prefer a specific field message if only one exists
        const fieldMessages = Object.values(errors).filter(Boolean);
        const onlyOneFieldError =
          fieldMessages.length === 1 && !generalError;

        showToast({
          title: "Could not save baptism",
          description:
            generalError ||
            (onlyOneFieldError
              ? fieldMessages[0]
              : `Please check: ${Object.keys(errors)
                  .map((k) => FIELD_LABELS[k] || k)
                  .join(", ")}`),
          type: "error",
          duration: 7000,
        });
      } else {
        showToast({
          title: "Could not save baptism",
          description:
            "Unable to create baptism record. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <>
        <Navbar />
        <Box minH="calc(100vh - 120px)" bg="white">
          <Flex minH="400px" align="center" justify="center">
            <VStack gap="3">
              <Spinner size="md" color="#E00000" />
              <Text fontSize="11px" color="#7081A3">
                Loading baptism form...
              </Text>
            </VStack>
          </Flex>
        </Box>
        <Footer />
      </>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  const isParish = formData.baptism_category === "PARISH";

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
          <Text fontSize="11px" color="#3974D8">Baptism Register</Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#7081A3">Add Baptism</Text>
        </Flex>

        {/* HEADER */}
        <Box mb="12px">
          <Text
            fontSize="10px"
            fontWeight="700"
            color="#E00000"
            textTransform="uppercase"
            letterSpacing="0.5px"
            mb="2px"
          >
            Baptism Register
          </Text>

          <Heading
            fontSize={{ base: "22px", md: "25px" }}
            fontWeight="600"
            color="#14265B"
            fontFamily="Outfit, sans-serif"
            lineHeight="1.15"
          >
            {isParish
              ? "Add Baptism"
              : "Add Baptism – Other Parish Member"}
          </Heading>

          <Text fontSize="11px" color="#7081A3" mt="3px">
            {isParish
              ? "Register baptism details for a parish member."
              : "Register baptism details for a member from another parish."}
          </Text>
        </Box>

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
          <Box p={{ base: "14px", md: "16px" }}>
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Baptism Information
            </Text>

            {isParish ? (
              <>
                {/* ROW 1 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormSelect
                    label="Baptism Category"
                    name="baptism_category"
                    value={formData.baptism_category}
                    onChange={handleCategoryChange}
                    required
                    error={fieldErrors.baptism_category}
                    options={[
                      { value: "PARISH", label: "Parish Member" },
                      { value: "OTHER", label: "Other / Outsider" },
                    ]}
                    placeholder="Select baptism category"
                  />

                  <FormField
                    label="Date of Baptism"
                    name="date_of_baptism"
                    type="date"
                    value={formData.date_of_baptism}
                    onChange={handleChange}
                    required
                    error={fieldErrors.date_of_baptism}
                  />

                  <FormField
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.name}
                    placeholder="Enter full name"
                  />
                </SimpleGrid>

                {/* ROW 2 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Parish of Baptism"
                    name="parish_of_baptism"
                    value={formData.parish_of_baptism}
                    onChange={handleChange}
                    required
                    error={fieldErrors.parish_of_baptism}
                    placeholder="Enter parish of baptism"
                  />

                  <FormField
                    label="Baptism Name"
                    name="baptismal_name"
                    value={formData.baptismal_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.baptismal_name}
                    placeholder="Enter baptism name"
                  />

                  <FormSelect
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    error={fieldErrors.gender}
                    options={[
                      { value: "MALE", label: "Male" },
                      { value: "FEMALE", label: "Female" },
                    ]}
                    placeholder="Select gender"
                  />
                </SimpleGrid>

                {/* ROW 3 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    error={fieldErrors.dob}
                  />

                  <FormField
                    label="Place of Birth"
                    name="place_of_birth"
                    value={formData.place_of_birth}
                    onChange={handleChange}
                    required
                    error={fieldErrors.place_of_birth}
                    placeholder="Enter place of birth"
                  />

                  <FormField
                    label="Panchayath"
                    name="panchayath"
                    value={formData.panchayath}
                    onChange={handleChange}
                    required
                    error={fieldErrors.panchayath}
                    placeholder="Enter panchayath"
                  />
                </SimpleGrid>

                {/* ROW 4 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Priest Name"
                    name="priest_name"
                    value={formData.priest_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.priest_name}
                    placeholder="Enter priest name"
                  />

                  <FormField
                    label="God Father"
                    name="god_father"
                    value={formData.god_father}
                    onChange={handleChange}
                    error={fieldErrors.god_father}
                    placeholder="Enter god father name"
                  />

                  <FormField
                    label="God Mother"
                    name="god_mother"
                    value={formData.god_mother}
                    onChange={handleChange}
                    error={fieldErrors.god_mother}
                    placeholder="Enter god mother name"
                  />
                </SimpleGrid>

                {/* ROW 5 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Father Name"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.father_name}
                    placeholder="Enter father name"
                  />

                  <FormField
                    label="Mother Name"
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.mother_name}
                    placeholder="Enter mother name"
                  />
                </SimpleGrid>

                {/* ROW 6 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                >
                  <FormSelect
                    label="Family Name"
                    name="family"
                    value={formData.family}
                    onChange={handleFamilyChange}
                    required
                    error={fieldErrors.family}
                    options={familyOptions}
                    placeholder="Select family name"
                  />

                  <FormSelect
                    label="Main Member (Head)"
                    name="main_member"
                    value={formData.main_member}
                    onChange={handleChange}
                    required
                    disabled={!formData.family}
                    error={fieldErrors.main_member}
                    options={memberOptions}
                    placeholder={
                      formData.family
                        ? "Select main member"
                        : "Select family first"
                    }
                  />

                  <FormSelect
                    label="Relationship"
                    name="relation_with_main_member"
                    value={formData.relation_with_main_member}
                    onChange={handleChange}
                    required
                    error={fieldErrors.relation_with_main_member}
                    options={relationshipOptions}
                    placeholder="Select relationship"
                  />
                </SimpleGrid>
              </>
            ) : (
              <>
                {/* ============ OTHER PARISH MEMBER ============ */}

                {/* ROW 1 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormSelect
                    label="Baptism Category"
                    name="baptism_category"
                    value={formData.baptism_category}
                    onChange={handleCategoryChange}
                    required
                    error={fieldErrors.baptism_category}
                    options={[
                      { value: "PARISH", label: "Parish Member" },
                      { value: "OTHER", label: "Other / Outsider" },
                    ]}
                    placeholder="Select baptism category"
                  />

                  <FormField
                    label="Date of Baptism"
                    name="date_of_baptism"
                    type="date"
                    value={formData.date_of_baptism}
                    onChange={handleChange}
                    required
                    error={fieldErrors.date_of_baptism}
                  />

                  <FormField
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.name}
                    placeholder="Enter full name"
                  />
                </SimpleGrid>

                {/* ROW 2 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Baptism Name"
                    name="baptismal_name"
                    value={formData.baptismal_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.baptismal_name}
                    placeholder="Enter baptism name"
                  />

                  <FormSelect
                    label="Gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    error={fieldErrors.gender}
                    options={[
                      { value: "MALE", label: "Male" },
                      { value: "FEMALE", label: "Female" },
                    ]}
                    placeholder="Select gender"
                  />

                  <FormField
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    error={fieldErrors.dob}
                  />
                </SimpleGrid>

                {/* ROW 3 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Place of Birth"
                    name="place_of_birth"
                    value={formData.place_of_birth}
                    onChange={handleChange}
                    required
                    error={fieldErrors.place_of_birth}
                    placeholder="Enter place of birth"
                  />

                  <FormField
                    label="Parish of Baptism"
                    name="parish_of_baptism"
                    value={formData.parish_of_baptism}
                    onChange={handleChange}
                    required
                    error={fieldErrors.parish_of_baptism}
                    placeholder="Enter parish of baptism"
                  />

                  <FormField
                    label="Priest Name"
                    name="priest_name"
                    value={formData.priest_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.priest_name}
                    placeholder="Enter priest name"
                  />
                </SimpleGrid>

                {/* ROW 4 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Panchayath"
                    name="panchayath"
                    value={formData.panchayath}
                    onChange={handleChange}
                    required
                    error={fieldErrors.panchayath}
                    placeholder="Enter panchayath"
                  />

                  <FormField
                    label="God Father"
                    name="god_father"
                    value={formData.god_father}
                    onChange={handleChange}
                    error={fieldErrors.god_father}
                    placeholder="Enter god father name"
                  />

                  <FormField
                    label="God Mother"
                    name="god_mother"
                    value={formData.god_mother}
                    onChange={handleChange}
                    error={fieldErrors.god_mother}
                    placeholder="Enter god mother name"
                  />
                </SimpleGrid>

                {/* ROW 5 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <FormField
                    label="Father Name"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    required
                    error={fieldErrors.father_name}
                    placeholder="Enter father name"
                  />

                  <FormField
                    label="Mother Name"
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    error={fieldErrors.mother_name}
                    placeholder="Enter mother name"
                  />

                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={fieldErrors.email}
                    placeholder="Enter email address"
                  />
                </SimpleGrid>

                {/* ROW 6 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  mb="7px"
                >
                  <Box>
                    <Text {...labelProps}>Mobile Number</Text>

                    <Flex gap="7px">
                      <Box as="select" w="70px" {...inputProps} px="6px">
                        <option>+91</option>
                      </Box>

                      <Box
                        as="input"
                        name="mobile_number"
                        type="tel"
                        value={formData.mobile_number}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                        flex="1"
                        {...inputProps}
                        borderColor={
                          fieldErrors.mobile_number ? "#F3C4C4" : "#CBD5E1"
                        }
                      />
                    </Flex>
                  </Box>

                  <Box gridColumn={{ base: "auto", md: "span 2" }}>
                    <FormTextarea
                      label="Present Address"
                      name="present_address"
                      value={formData.present_address}
                      onChange={handlePresentAddressChange}
                      required
                      error={
                        fieldErrors.present_address ||
                        fieldErrors.address
                      }
                      placeholder="Enter present address"
                      rows={2}
                    />
                  </Box>
                </SimpleGrid>

                {/* ROW 7 */}
                <SimpleGrid
                  columns={{ base: 1, md: 2 }}
                  columnGap={{ base: "14px", md: "24px" }}
                  rowGap="7px"
                  alignItems="start"
                >
                  <Box>
                    <FormTextarea
                      label="Permanent Address"
                      name="permanent_address"
                      value={formData.permanent_address}
                      onChange={handleChange}
                      required
                      error={fieldErrors.permanent_address}
                      placeholder="Enter permanent address"
                      rows={2}
                    />

                    <Flex align="center" gap="6px" mt="6px">
                      <Box
                        as="input"
                        type="checkbox"
                        checked={formData.same_as_present}
                        onChange={handleSameAddress}
                        w="14px"
                        h="14px"
                        accentColor="#E00000"
                      />

                      <Text fontSize="10px" color="#14265B">
                        Same as Present Address
                      </Text>
                    </Flex>
                  </Box>

                  <FormTextarea
                    label="Remarks"
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
              onClick={() => navigate("/baptism")}
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
                  <LuSave />
                  Add Baptism
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

export default BaptismAddPage;