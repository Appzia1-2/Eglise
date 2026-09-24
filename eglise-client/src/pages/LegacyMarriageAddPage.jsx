// src/pages/LegacyMarriageAddPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react";

import { LuSave } from "react-icons/lu";

import apiClient from "../api/apiClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
// FIELD ERROR
// ============================================================

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

// ============================================================
// FORM FIELD
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
  step,
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

    <FieldError error={error} />

    <Box
      as="input"
      name={name}
      type={type}
      step={step}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      w="100%"
      {...inputProps}
      bg={disabled ? "#F3F5F8" : "white"}
      borderColor={error ? "#F3C4C4" : "#CBD5E1"}
    />
  </Box>
);

// ============================================================
// FORM SELECT
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
      bg={disabled ? "#F3F5F8" : "white"}
      borderColor={error ? "#F3C4C4" : "#CBD5E1"}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={String(o.value)} value={o.value}>
          {o.label}
        </option>
      ))}
    </Box>
  </Box>
);

// ============================================================
// FORM TEXTAREA
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
    />
  </Box>
);

// ============================================================
// INITIAL FORM
// ============================================================

const initialForm = {
  marriage_type: "ADD_BRIDE",
  date: "",
  register_number: "",
  groom_name: "",
  groom_dob: "",
  groom_house_name: "",
  groom_family_name: "",
  groom_address: "",
  groom_father: "",
  groom_mother: "",
  nationality_of_groom: "",
  bride_name: "",
  bride_dob: "",
  bride_house_name: "",
  bride_family_name: "",
  bride_address: "",
  bride_father: "",
  bride_mother: "",
  nationality_of_bride: "",
  witness_groom_side: "",
  witness_bride_side: "",
  minister_of_marriage: "",
  other_priests: "",
  transfer_to: "",
  remarks: "",
};

// ============================================================
// PAGE
// ============================================================

const LegacyMarriageAddPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const payload = {
        ...formData,
        groom_dob: formData.groom_dob || null,
        bride_dob: formData.bride_dob || null,
      };

      await apiClient.post("/api/registry/legacy/marriages/", payload);
      navigate("/legacy/marriage");
    } catch (err) {
      const rd = err?.response?.data;

      if (rd && typeof rd === "object") {
        const errors = {};
        Object.entries(rd).forEach(([k, v]) => {
          errors[k] = Array.isArray(v) ? v.join(", ") : String(v);
        });
        setFieldErrors(errors);
        setError(
          rd.detail ||
            rd.non_field_errors?.[0] ||
            "Please correct the highlighted fields."
        );
      } else {
        setError("Unable to save legacy marriage.");
      }
    } finally {
      setSaving(false);
    }
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
          <Text fontSize="11px" color="#3974D8">
            Masters
          </Text>
          <Text fontSize="11px" color="#A1ADC0">
            /
          </Text>
          <Text fontSize="11px" color="#3974D8">
            Legacy Registers
          </Text>
          <Text fontSize="11px" color="#A1ADC0">
            /
          </Text>
          <Text fontSize="11px" color="#7081A3">
            Add Legacy Marriage
          </Text>
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
            Legacy Marriage Register
          </Text>
          <Heading
            fontSize={{ base: "22px", md: "25px" }}
            fontWeight="600"
            color="#14265B"
            lineHeight="1.15"
          >
            Add Old Marriage Record
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Type in a historical marriage from the physical register book.
            Does not create a DheshaKuri or change any member.
          </Text>
        </Box>

        {/* GENERAL ERROR */}
        {error && (
          <Box
            bg="#FFF5F5"
            border="1px solid #F3C4C4"
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

        {/* FORM */}
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
            {/* MARRIAGE META */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Marriage Details
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
              mb="12px"
            >
              <FormSelect
                label="Marriage Type"
                name="marriage_type"
                value={formData.marriage_type}
                onChange={handleChange}
                required
                error={fieldErrors.marriage_type}
                options={[
                  { value: "ADD_BRIDE", label: "Add Bride to Parish" },
                  {
                    value: "TRANSFER_BRIDE",
                    label: "Transfer Bride from Parish",
                  },
                ]}
              />
              <FormField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                error={fieldErrors.date}
              />
              <FormField
                label="Old Register No."
                name="register_number"
                value={formData.register_number}
                onChange={handleChange}
                error={fieldErrors.register_number}
              />
            </SimpleGrid>

            {/* GROOM */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Groom Details
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
              mb="12px"
            >
              <FormField
                label="Groom Name"
                name="groom_name"
                value={formData.groom_name}
                onChange={handleChange}
                required
                error={fieldErrors.groom_name}
              />
              <FormField
                label="Date of Birth"
                name="groom_dob"
                type="date"
                value={formData.groom_dob}
                onChange={handleChange}
                error={fieldErrors.groom_dob}
              />
              <FormField
                label="House Name"
                name="groom_house_name"
                value={formData.groom_house_name}
                onChange={handleChange}
                error={fieldErrors.groom_house_name}
              />
              <FormField
                label="Family Name"
                name="groom_family_name"
                value={formData.groom_family_name}
                onChange={handleChange}
                error={fieldErrors.groom_family_name}
              />
              <FormField
                label="Father Name"
                name="groom_father"
                value={formData.groom_father}
                onChange={handleChange}
                error={fieldErrors.groom_father}
              />
              <FormField
                label="Mother Name"
                name="groom_mother"
                value={formData.groom_mother}
                onChange={handleChange}
                error={fieldErrors.groom_mother}
              />
              <FormField
                label="Nationality"
                name="nationality_of_groom"
                value={formData.nationality_of_groom}
                onChange={handleChange}
                error={fieldErrors.nationality_of_groom}
              />
              <Box gridColumn={{ base: "auto", md: "span 2" }}>
                <FormTextarea
                  label="Groom Address"
                  name="groom_address"
                  value={formData.groom_address}
                  onChange={handleChange}
                  rows={2}
                  error={fieldErrors.groom_address}
                />
              </Box>
            </SimpleGrid>

            {/* BRIDE */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Bride Details
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
              mb="12px"
            >
              <FormField
                label="Bride Name"
                name="bride_name"
                value={formData.bride_name}
                onChange={handleChange}
                required
                error={fieldErrors.bride_name}
              />
              <FormField
                label="Date of Birth"
                name="bride_dob"
                type="date"
                value={formData.bride_dob}
                onChange={handleChange}
                error={fieldErrors.bride_dob}
              />
              <FormField
                label="House Name"
                name="bride_house_name"
                value={formData.bride_house_name}
                onChange={handleChange}
                error={fieldErrors.bride_house_name}
              />
              <FormField
                label="Family Name"
                name="bride_family_name"
                value={formData.bride_family_name}
                onChange={handleChange}
                error={fieldErrors.bride_family_name}
              />
              <FormField
                label="Father Name"
                name="bride_father"
                value={formData.bride_father}
                onChange={handleChange}
                error={fieldErrors.bride_father}
              />
              <FormField
                label="Mother Name"
                name="bride_mother"
                value={formData.bride_mother}
                onChange={handleChange}
                error={fieldErrors.bride_mother}
              />
              <FormField
                label="Nationality"
                name="nationality_of_bride"
                value={formData.nationality_of_bride}
                onChange={handleChange}
                error={fieldErrors.nationality_of_bride}
              />
              <Box gridColumn={{ base: "auto", md: "span 2" }}>
                <FormTextarea
                  label="Bride Address"
                  name="bride_address"
                  value={formData.bride_address}
                  onChange={handleChange}
                  rows={2}
                  error={fieldErrors.bride_address}
                />
              </Box>
            </SimpleGrid>

            {/* WITNESSES & MINISTERS */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Witnesses &amp; Ministers
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
              mb="12px"
            >
              <FormField
                label="Witness (Groom Side)"
                name="witness_groom_side"
                value={formData.witness_groom_side}
                onChange={handleChange}
                error={fieldErrors.witness_groom_side}
              />
              <FormField
                label="Witness (Bride Side)"
                name="witness_bride_side"
                value={formData.witness_bride_side}
                onChange={handleChange}
                error={fieldErrors.witness_bride_side}
              />
              <FormField
                label="Minister of Marriage"
                name="minister_of_marriage"
                value={formData.minister_of_marriage}
                onChange={handleChange}
                error={fieldErrors.minister_of_marriage}
              />
            </SimpleGrid>

            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
            >
              <FormTextarea
                label="Other Priests"
                name="other_priests"
                value={formData.other_priests}
                onChange={handleChange}
                rows={2}
                error={fieldErrors.other_priests}
              />
              <FormTextarea
                label="Transfer To (if any)"
                name="transfer_to"
                value={formData.transfer_to}
                onChange={handleChange}
                rows={2}
                error={fieldErrors.transfer_to}
              />
            </SimpleGrid>

            <Box mt="7px">
              <FormTextarea
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={2}
                error={fieldErrors.remarks}
              />
            </Box>
          </Box>

          {/* FOOTER */}
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
              px="20px"
              fontSize="11px"
              fontWeight="600"
              borderRadius="5px"
              variant="outline"
              borderColor="#E00000"
              color="#E00000"
              bg="white"
              onClick={() => navigate("/legacy/marriage")}
              disabled={saving}
              _hover={{ bg: "#FFF5F5" }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              h="34px"
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
                  Add Legacy Marriage
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

export default LegacyMarriageAddPage;