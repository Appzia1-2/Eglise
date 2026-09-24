// src/pages/LegacyBaptismAddPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box, Button, Flex, Heading, SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";

import { LuSave } from "react-icons/lu";

import apiClient from "../api/apiClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ---------------- STYLES (same as BaptismAddPage) ---------------- */

const inputProps = {
  h: "34px", minH: "34px", px: "10px",
  border: "1px solid", borderColor: "#CBD5E1",
  borderRadius: "5px", fontSize: "12px", color: "#14265B",
  bg: "white", outline: "none", boxSizing: "border-box",
  _placeholder: { color: "#7890B8" },
  _hover: { borderColor: "#AEBACC" },
  _focus: { borderColor: "#3974D8", boxShadow: "0 0 0 1px #3974D8" },
};

const labelProps = {
  fontSize: "11px", fontWeight: "600", color: "#14265B", mb: "2px",
};

const FieldError = ({ error }) =>
  !error ? null : (
    <Box bg="#FFF5F5" border="1px solid #F3C4C4" borderRadius="4px"
         px="8px" py="4px" mb="4px">
      <Text fontSize="10px" color="#C00000" fontWeight="500">{error}</Text>
    </Box>
  );

const FormField = ({
  label, name, value, onChange, type = "text",
  required = false, placeholder = "", disabled = false, error = "",
}) => (
  <Box>
    <Text {...labelProps}>
      {label}
      {required && <Text as="span" color="#E00000" ml="2px">*</Text>}
    </Text>
    <FieldError error={error} />
    <Box as="input" name={name} type={type} value={value}
         onChange={onChange} placeholder={placeholder} disabled={disabled}
         w="100%" {...inputProps}
         bg={disabled ? "#F3F5F8" : "white"}
         borderColor={error ? "#F3C4C4" : "#CBD5E1"} />
  </Box>
);

const FormSelect = ({
  label, name, value, onChange, options = [],
  required = false, placeholder = "Select", disabled = false, error = "",
}) => (
  <Box>
    <Text {...labelProps}>
      {label}
      {required && <Text as="span" color="#E00000" ml="2px">*</Text>}
    </Text>
    <FieldError error={error} />
    <Box as="select" name={name} value={value} onChange={onChange}
         disabled={disabled} w="100%" {...inputProps} px="8px"
         bg={disabled ? "#F3F5F8" : "white"}
         borderColor={error ? "#F3C4C4" : "#CBD5E1"}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={String(o.value)} value={o.value}>{o.label}</option>
      ))}
    </Box>
  </Box>
);

const FormTextarea = ({
  label, name, value, onChange, required = false,
  placeholder = "", rows = 3, error = "",
}) => (
  <Box>
    <Text {...labelProps}>
      {label}
      {required && <Text as="span" color="#E00000" ml="2px">*</Text>}
    </Text>
    <FieldError error={error} />
    <Box as="textarea" name={name} value={value} onChange={onChange}
         placeholder={placeholder} rows={rows} w="100%"
         px="10px" py="7px" border="1px solid"
         borderColor={error ? "#F3C4C4" : "#CBD5E1"}
         borderRadius="5px" bg="white" color="#14265B" fontSize="12px"
         resize="vertical" outline="none" boxSizing="border-box" />
  </Box>
);

/* ---------------- INITIAL FORM ---------------- */

const initialForm = {
  baptism_category: "PARISH",
  date_of_baptism: "",
  register_number: "",
  name: "",
  baptismal_name: "",
  gender: "",
  dob: "",
  place_of_birth: "",
  family_name: "",
  house_name: "",
  father_name: "",
  mother_name: "",
  god_father: "",
  god_mother: "",
  parish_of_baptism: "",
  panchayath: "",
  priest_name: "",
  address: "",
  remarks: "",
};

/* ---------------- PAGE ---------------- */

const LegacyBaptismAddPage = () => {
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
    setSaving(true); setError(""); setFieldErrors({});

    try {
      const payload = { ...formData, dob: formData.dob || null };
      await apiClient.post("/api/registry/legacy/baptisms/", payload);
      navigate("/legacy/baptism");
    } catch (err) {
      const rd = err?.response?.data;
      if (rd && typeof rd === "object") {
        const errors = {};
        Object.entries(rd).forEach(([k, v]) => {
          errors[k] = Array.isArray(v) ? v.join(", ") : String(v);
        });
        setFieldErrors(errors);
        setError(rd.detail || rd.non_field_errors?.[0] ||
                 "Please correct the highlighted fields.");
      } else {
        setError("Unable to save legacy baptism.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box minH="100vh" bg="white">
      <Navbar />

      <Box maxW="1400px" mx="auto"
           px={{ base: "16px", md: "24px", lg: "30px" }}
           py={{ base: "14px", md: "16px" }}>

        {/* BREADCRUMB */}
        <Flex align="center" gap="7px" mb="10px" flexWrap="wrap">
          <Text fontSize="11px" color="#3974D8">Masters</Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#3974D8">Legacy Registers</Text>
          <Text fontSize="11px" color="#A1ADC0">/</Text>
          <Text fontSize="11px" color="#7081A3">Add Legacy Baptism</Text>
        </Flex>

        {/* HEADER */}
        <Box mb="12px">
          <Text fontSize="10px" fontWeight="700" color="#E00000"
                textTransform="uppercase" letterSpacing="0.5px" mb="2px">
            Legacy Baptism Register
          </Text>
          <Heading fontSize={{ base: "22px", md: "25px" }} fontWeight="600"
                   color="#14265B" fontFamily="Outfit, sans-serif" lineHeight="1.15">
            Add Old Baptism Record
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Type in a historical baptism from the physical register book.
            This does not create or link a member.
          </Text>
        </Box>

        {/* ERROR */}
        {error && (
          <Box bg="#FFF5F5" border="1px solid #F3C4C4" borderRadius="6px"
               px="10px" py="8px" mb="10px">
            <Text fontSize="11px" color="#C00000" fontWeight="500">{error}</Text>
          </Box>
        )}

        {/* FORM */}
        <Box as="form" onSubmit={handleSubmit}
             bg="white" border="1px solid" borderColor="#DDE4EE"
             borderRadius="6px" overflow="hidden">

          <Box p={{ base: "14px", md: "16px" }}>
            <Text fontSize="14px" fontWeight="600" color="#14265B" mb="10px">
              Baptism Information
            </Text>

            {/* ROW 1 */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="7px">
              <FormSelect label="Category" name="baptism_category"
                          value={formData.baptism_category}
                          onChange={handleChange} required
                          error={fieldErrors.baptism_category}
                          options={[
                            { value: "PARISH", label: "Parish Member" },
                            { value: "OTHER", label: "Other / Outsider" },
                          ]}
                          placeholder="Select category" />

              <FormField label="Date of Baptism" name="date_of_baptism"
                         type="date" value={formData.date_of_baptism}
                         onChange={handleChange} required
                         error={fieldErrors.date_of_baptism} />

              <FormField label="Old Register No." name="register_number"
                         value={formData.register_number}
                         onChange={handleChange}
                         error={fieldErrors.register_number}
                         placeholder="As written in book" />
            </SimpleGrid>

            {/* ROW 2 */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="7px">
              <FormField label="Name" name="name" value={formData.name}
                         onChange={handleChange} required
                         error={fieldErrors.name} placeholder="Full name" />
              <FormField label="Baptismal Name" name="baptismal_name"
                         value={formData.baptismal_name}
                         onChange={handleChange}
                         error={fieldErrors.baptismal_name} />
              <FormSelect label="Gender" name="gender" value={formData.gender}
                          onChange={handleChange} required
                          error={fieldErrors.gender}
                          options={[
                            { value: "MALE", label: "Male" },
                            { value: "FEMALE", label: "Female" },
                          ]} placeholder="Select gender" />
            </SimpleGrid>

            {/* ROW 3 */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="7px">
              <FormField label="Date of Birth" name="dob" type="date"
                         value={formData.dob} onChange={handleChange}
                         error={fieldErrors.dob} />
              <FormField label="Place of Birth" name="place_of_birth"
                         value={formData.place_of_birth}
                         onChange={handleChange}
                         error={fieldErrors.place_of_birth} />
              <FormField label="Parish of Baptism" name="parish_of_baptism"
                         value={formData.parish_of_baptism}
                         onChange={handleChange} required
                         error={fieldErrors.parish_of_baptism} />
            </SimpleGrid>

            {/* ROW 4 */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="7px">
              <FormField label="Panchayath" name="panchayath"
                         value={formData.panchayath}
                         onChange={handleChange}
                         error={fieldErrors.panchayath} />
              <FormField label="Priest Name" name="priest_name"
                         value={formData.priest_name}
                         onChange={handleChange}
                         error={fieldErrors.priest_name} />
              <FormField label="Family Name" name="family_name"
                         value={formData.family_name}
                         onChange={handleChange}
                         error={fieldErrors.family_name} />
            </SimpleGrid>

            {/* ROW 5 */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="7px">
              <FormField label="House Name" name="house_name"
                         value={formData.house_name}
                         onChange={handleChange}
                         error={fieldErrors.house_name} />
              <FormField label="Father Name" name="father_name"
                         value={formData.father_name}
                         onChange={handleChange}
                         error={fieldErrors.father_name} />
              <FormField label="Mother Name" name="mother_name"
                         value={formData.mother_name}
                         onChange={handleChange}
                         error={fieldErrors.mother_name} />
            </SimpleGrid>

            {/* ROW 6 */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="7px">
              <FormField label="God Father" name="god_father"
                         value={formData.god_father}
                         onChange={handleChange}
                         error={fieldErrors.god_father} />
              <FormField label="God Mother" name="god_mother"
                         value={formData.god_mother}
                         onChange={handleChange}
                         error={fieldErrors.god_mother} />
            </SimpleGrid>

            {/* ROW 7 - Address */}
            <SimpleGrid columns={{ base: 1, md: 2 }}
                        columnGap={{ base: "14px", md: "24px" }}
                        rowGap="7px" mb="7px">
              <FormTextarea label="Address" name="address"
                            value={formData.address}
                            onChange={handleChange} rows={2}
                            error={fieldErrors.address} />
              <FormTextarea label="Remarks" name="remarks"
                            value={formData.remarks}
                            onChange={handleChange} rows={2}
                            error={fieldErrors.remarks} />
            </SimpleGrid>
          </Box>

          {/* FOOTER */}
          <Flex justify="flex-end" align="center" gap="8px"
                px={{ base: "14px", md: "16px" }} py="10px"
                borderTop="1px solid" borderColor="#DDE4EE" bg="white"
                flexWrap="wrap">
            <Button type="button" h="34px" px="20px" fontSize="11px"
                    fontWeight="600" borderRadius="5px" variant="outline"
                    borderColor="#E00000" color="#E00000" bg="white"
                    onClick={() => navigate("/legacy/baptism")}
                    disabled={saving} _hover={{ bg: "#FFF5F5" }}>
              Cancel
            </Button>
            <Button type="submit" h="34px" px="20px" fontSize="11px"
                    fontWeight="600" borderRadius="5px"
                    bg="#E00000" color="white" disabled={saving}
                    _hover={{ bg: "#C90000" }}>
              {saving ? (<><Spinner size="xs" mr="5px" />Saving...</>)
                      : (<><LuSave />Add Legacy Baptism</>)}
            </Button>
          </Flex>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default LegacyBaptismAddPage;