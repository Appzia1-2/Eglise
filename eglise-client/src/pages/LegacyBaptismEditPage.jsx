// src/pages/LegacyBaptismEditPage.jsx
// Chakra UI v3.35 - Uses Field and NativeSelect compound components

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Button,
  Center,
  Field,
  Flex,
  Heading,
  Input,
  NativeSelect, // ✅ Correct import for v3 Select
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";

import { LuSave } from "react-icons/lu";

import apiClient from "../api/apiClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* ---------------- Shared styles ---------------- */

const labelStyle = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#14265B",
  mb: "3px",
};

const inputStyle = {
  h: "34px",
  fontSize: "12px",
  borderRadius: "5px",
  borderColor: "#DDE4EE",
  bg: "white",
  _hover: { borderColor: "#B7C3D6" },
  _focus: { borderColor: "#E00000", boxShadow: "0 0 0 1px #E00000" },
};

const errorStyle = {
  fontSize: "10px",
  color: "#C00000",
  mt: "2px",
};

/* ---------------- Reusable field components ---------------- */

const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  ...rest
}) => (
  <Field.Root invalid={!!error}>
    <Field.Label {...labelStyle}>{label}</Field.Label>
    <Input
      {...inputStyle}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      borderColor={error ? "#E00000" : "#DDE4EE"}
      {...rest}
    />
    {error && <Field.ErrorText {...errorStyle}>{error}</Field.ErrorText>}
  </Field.Root>
);

// ✅ Updated FormSelect using NativeSelect compound component
const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  ...rest
}) => (
  <Field.Root invalid={!!error}>
    <Field.Label {...labelStyle}>{label}</Field.Label>
    <NativeSelect.Root>
      <NativeSelect.Field
        {...inputStyle}
        name={name}
        value={value}
        onChange={onChange}
        borderColor={error ? "#E00000" : "#DDE4EE"}
        {...rest}
      >
        <option value="">Select...</option>
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )
        )}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
    {error && <Field.ErrorText {...errorStyle}>{error}</Field.ErrorText>}
  </Field.Root>
);

const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  rows = 3,
  ...rest
}) => (
  <Field.Root invalid={!!error}>
    <Field.Label {...labelStyle}>{label}</Field.Label>
    <Textarea
      fontSize="12px"
      borderRadius="5px"
      borderColor={error ? "#E00000" : "#DDE4EE"}
      bg="white"
      rows={rows}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      _hover={{ borderColor: "#B7C3D6" }}
      _focus={{ borderColor: "#E00000", boxShadow: "0 0 0 1px #E00000" }}
      {...rest}
    />
    {error && <Field.ErrorText {...errorStyle}>{error}</Field.ErrorText>}
  </Field.Root>
);

/* ---------------- Initial state ---------------- */

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

/* ---------------- Page ---------------- */

const LegacyBaptismEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get(
          `/api/registry/legacy/baptisms/${id}/`
        );
        const r = res.data;
        setFormData({
          baptism_category: r.baptism_category || "PARISH",
          date_of_baptism: r.date_of_baptism || "",
          register_number: r.register_number || "",
          name: r.name || "",
          baptismal_name: r.baptismal_name || "",
          gender: r.gender || "",
          dob: r.dob || "",
          place_of_birth: r.place_of_birth || "",
          family_name: r.family_name || "",
          house_name: r.house_name || "",
          father_name: r.father_name || "",
          mother_name: r.mother_name || "",
          god_father: r.god_father || "",
          god_mother: r.god_mother || "",
          parish_of_baptism: r.parish_of_baptism || "",
          panchayath: r.panchayath || "",
          priest_name: r.priest_name || "",
          address: r.address || "",
          remarks: r.remarks || "",
        });
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Unable to load legacy baptism record."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
      const payload = { ...formData, dob: formData.dob || null };
      await apiClient.patch(
        `/api/registry/legacy/baptisms/${id}/`,
        payload
      );
      navigate(`/legacy/baptism/${id}`);
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
        setError("Unable to update legacy baptism.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" bg="white">
        <Navbar />
        <Center flex="1">
          <Spinner size="lg" color="#E00000" />
        </Center>
        <Footer />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white">
      <Navbar />
      <Box
        maxW="1400px"
        mx="auto"
        px={{ base: "16px", md: "24px", lg: "30px" }}
        py={{ base: "14px", md: "16px" }}
      >
        {/* Breadcrumbs */}
        <Flex align="center" gap="7px" mb="10px" flexWrap="wrap">
          <Text fontSize="11px" color="#3974D8">
            Masters
          </Text>
          <Text fontSize="11px" color="#A1ADC0">
            /
          </Text>
          <Text
            fontSize="11px"
            color="#3974D8"
            cursor="pointer"
            onClick={() => navigate("/legacy/baptism")}
          >
            Legacy Baptism Register
          </Text>
          <Text fontSize="11px" color="#A1ADC0">
            /
          </Text>
          <Text fontSize="11px" color="#7081A3">
            Edit
          </Text>
        </Flex>

        {/* Header */}
        <Box mb="12px">
          <Text
            fontSize="10px"
            fontWeight="700"
            color="#E00000"
            textTransform="uppercase"
            letterSpacing="0.5px"
            mb="2px"
          >
            Legacy Baptism Register
          </Text>
          <Heading
            fontSize={{ base: "22px", md: "25px" }}
            fontWeight="600"
            color="#14265B"
            lineHeight="1.15"
          >
            Edit Legacy Baptism
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Update historical baptism details.
          </Text>
        </Box>

        {/* Error banner */}
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

        {/* Form */}
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

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="12px">
              <FormSelect
                label="Baptism Category"
                name="baptism_category"
                value={formData.baptism_category}
                onChange={handleChange}
                options={[
                  { value: "PARISH", label: "Parish" },
                  { value: "OTHER", label: "Other" },
                ]}
                error={fieldErrors.baptism_category}
              />
              <FormField
                label="Date of Baptism"
                name="date_of_baptism"
                type="date"
                value={formData.date_of_baptism}
                onChange={handleChange}
                error={fieldErrors.date_of_baptism}
              />
              <FormField
                label="Register Number"
                name="register_number"
                value={formData.register_number}
                onChange={handleChange}
                placeholder="Enter register number"
                error={fieldErrors.register_number}
              />

              <FormField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
                error={fieldErrors.name}
              />
              <FormField
                label="Baptismal Name"
                name="baptismal_name"
                value={formData.baptismal_name}
                onChange={handleChange}
                placeholder="Enter baptismal name"
                error={fieldErrors.baptismal_name}
              />
              <FormSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={[
                  { value: "MALE", label: "Male" },
                  { value: "FEMALE", label: "Female" },
                  { value: "OTHER", label: "Other" },
                ]}
                error={fieldErrors.gender}
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
                label="Place of Birth"
                name="place_of_birth"
                value={formData.place_of_birth}
                onChange={handleChange}
                placeholder="Enter place of birth"
                error={fieldErrors.place_of_birth}
              />
              <FormField
                label="Family Name"
                name="family_name"
                value={formData.family_name}
                onChange={handleChange}
                placeholder="Enter family name"
                error={fieldErrors.family_name}
              />

              <FormField
                label="House Name"
                name="house_name"
                value={formData.house_name}
                onChange={handleChange}
                placeholder="Enter house name"
                error={fieldErrors.house_name}
              />
              <FormField
                label="Father's Name"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                placeholder="Enter father's name"
                error={fieldErrors.father_name}
              />
              <FormField
                label="Mother's Name"
                name="mother_name"
                value={formData.mother_name}
                onChange={handleChange}
                placeholder="Enter mother's name"
                error={fieldErrors.mother_name}
              />

              <FormField
                label="God Father"
                name="god_father"
                value={formData.god_father}
                onChange={handleChange}
                placeholder="Enter god father's name"
                error={fieldErrors.god_father}
              />
              <FormField
                label="God Mother"
                name="god_mother"
                value={formData.god_mother}
                onChange={handleChange}
                placeholder="Enter god mother's name"
                error={fieldErrors.god_mother}
              />
              <FormField
                label="Parish of Baptism"
                name="parish_of_baptism"
                value={formData.parish_of_baptism}
                onChange={handleChange}
                placeholder="Enter parish of baptism"
                error={fieldErrors.parish_of_baptism}
              />

              <FormField
                label="Panchayath"
                name="panchayath"
                value={formData.panchayath}
                onChange={handleChange}
                placeholder="Enter panchayath"
                error={fieldErrors.panchayath}
              />
              <FormField
                label="Priest Name"
                name="priest_name"
                value={formData.priest_name}
                onChange={handleChange}
                placeholder="Enter priest name"
                error={fieldErrors.priest_name}
              />
              <FormField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
                error={fieldErrors.address}
              />

              <Box gridColumn={{ base: "auto", lg: "span 3" }}>
                <FormTextarea
                  label="Remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter remarks"
                  error={fieldErrors.remarks}
                  rows={3}
                />
              </Box>
            </SimpleGrid>
          </Box>

          {/* Footer actions */}
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
              onClick={() => navigate(`/legacy/baptism/${id}`)}
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
                  <LuSave /> Save Changes
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

export default LegacyBaptismEditPage;