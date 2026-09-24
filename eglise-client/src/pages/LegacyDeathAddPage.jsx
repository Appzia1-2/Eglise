// src/pages/LegacyDeathAddPage.jsx

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
// FORM FIELD (text/number/date)
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
  reg_no: "",
  name: "",
  gender: "",
  dob: "",
  age_at_death: "",
  family_name: "",
  house_name: "",
  father_name: "",
  mother_name: "",
  marital_status: "",
  died_on: "",
  funeral_on: "",
  reason_of_death: "",
  place_of_death: "",
  tomb_type_name: "",
  tomb_idn: "",
  tomb_charge: "",
  priest_name: "",
  remarks: "",
};

// ============================================================
// PAGE
// ============================================================

const LegacyDeathAddPage = () => {
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
        dob: formData.dob || null,
        funeral_on: formData.funeral_on || null,
        age_at_death: formData.age_at_death
          ? Number(formData.age_at_death)
          : null,
        tomb_charge: formData.tomb_charge
          ? Number(formData.tomb_charge)
          : null,
      };

      await apiClient.post("/api/registry/legacy/deaths/", payload);
      navigate("/legacy/death");
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
        setError("Unable to save legacy death record.");
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
            Add Legacy Death
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
            Legacy Death Register
          </Text>
          <Heading
            fontSize={{ base: "22px", md: "25px" }}
            fontWeight="600"
            color="#14265B"
            lineHeight="1.15"
          >
            Add Old Death Record
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Type in a historical death from the physical register book.
            Does not mark any member as deceased.
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
            {/* DEATH INFO */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Death Details
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
              mb="12px"
            >
              <FormField
                label="Old Register No."
                name="reg_no"
                value={formData.reg_no}
                onChange={handleChange}
                error={fieldErrors.reg_no}
              />
              <FormField
                label="Date of Death"
                name="died_on"
                type="date"
                value={formData.died_on}
                onChange={handleChange}
                required
                error={fieldErrors.died_on}
              />
              <FormField
                label="Funeral Date"
                name="funeral_on"
                type="date"
                value={formData.funeral_on}
                onChange={handleChange}
                error={fieldErrors.funeral_on}
              />
            </SimpleGrid>

            {/* PERSON */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Person Details
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
              mb="12px"
            >
              <FormField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                error={fieldErrors.name}
              />
              <FormSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
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
                error={fieldErrors.dob}
              />
              <FormField
                label="Age at Death"
                name="age_at_death"
                type="number"
                value={formData.age_at_death}
                onChange={handleChange}
                error={fieldErrors.age_at_death}
              />
              <FormField
                label="Marital Status"
                name="marital_status"
                value={formData.marital_status}
                onChange={handleChange}
                error={fieldErrors.marital_status}
              />
              <FormField
                label="Family Name"
                name="family_name"
                value={formData.family_name}
                onChange={handleChange}
                error={fieldErrors.family_name}
              />
              <FormField
                label="House Name"
                name="house_name"
                value={formData.house_name}
                onChange={handleChange}
                error={fieldErrors.house_name}
              />
              <FormField
                label="Father Name"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                error={fieldErrors.father_name}
              />
              <FormField
                label="Mother Name"
                name="mother_name"
                value={formData.mother_name}
                onChange={handleChange}
                error={fieldErrors.mother_name}
              />
              <FormField
                label="Place of Death"
                name="place_of_death"
                value={formData.place_of_death}
                onChange={handleChange}
                error={fieldErrors.place_of_death}
              />
              <FormField
                label="Priest Name"
                name="priest_name"
                value={formData.priest_name}
                onChange={handleChange}
                error={fieldErrors.priest_name}
              />
            </SimpleGrid>

            {/* TOMB */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Tomb Details
            </Text>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
              mb="12px"
            >
              <FormField
                label="Tomb Type"
                name="tomb_type_name"
                value={formData.tomb_type_name}
                onChange={handleChange}
                error={fieldErrors.tomb_type_name}
              />
              <FormField
                label="Tomb ID / Identifier"
                name="tomb_idn"
                value={formData.tomb_idn}
                onChange={handleChange}
                error={fieldErrors.tomb_idn}
              />
              <FormField
                label="Tomb Charge"
                name="tomb_charge"
                type="number"
                step="0.001"
                value={formData.tomb_charge}
                onChange={handleChange}
                error={fieldErrors.tomb_charge}
              />
            </SimpleGrid>

            {/* NOTES */}
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              columnGap={{ base: "14px", md: "24px" }}
              rowGap="7px"
            >
              <FormTextarea
                label="Reason of Death"
                name="reason_of_death"
                value={formData.reason_of_death}
                onChange={handleChange}
                rows={2}
                error={fieldErrors.reason_of_death}
              />
              <FormTextarea
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={2}
                error={fieldErrors.remarks}
              />
            </SimpleGrid>
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
              onClick={() => navigate("/legacy/death")}
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
                  Add Legacy Death
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

export default LegacyDeathAddPage;