// src/pages/LegacyDeathEditPage.jsx
// Chakra UI v3.35 - Uses Field and NativeSelect compound components
// Prefills from GET, submits PATCH.

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
  NativeSelect,
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

/* ---------------- Page ---------------- */

const LegacyDeathEditPage = () => {
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
          `/api/registry/legacy/deaths/${id}/`
        );
        const r = res.data;
        setFormData({
          reg_no: r.reg_no || "",
          name: r.name || "",
          gender: r.gender || "",
          dob: r.dob || "",
          age_at_death: r.age_at_death ?? "",
          family_name: r.family_name || "",
          house_name: r.house_name || "",
          father_name: r.father_name || "",
          mother_name: r.mother_name || "",
          marital_status: r.marital_status || "",
          died_on: r.died_on || "",
          funeral_on: r.funeral_on || "",
          reason_of_death: r.reason_of_death || "",
          place_of_death: r.place_of_death || "",
          tomb_type_name: r.tomb_type_name || "",
          tomb_idn: r.tomb_idn || "",
          tomb_charge: r.tomb_charge ?? "",
          priest_name: r.priest_name || "",
          remarks: r.remarks || "",
        });
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Unable to load legacy death record."
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
      await apiClient.patch(
        `/api/registry/legacy/deaths/${id}/`,
        payload
      );
      navigate(`/legacy/death/${id}`);
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
        setError("Unable to update legacy death record.");
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
            onClick={() => navigate("/legacy/death")}
          >
            Legacy Death Register
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
            Legacy Death Register
          </Text>
          <Heading
            fontSize={{ base: "22px", md: "25px" }}
            fontWeight="600"
            color="#14265B"
            lineHeight="1.15"
          >
            Edit Legacy Death
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Update historical death details.
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
            {/* ---------------- Death Details ---------------- */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Death Details
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="12px" mb="18px">
              <FormField
                label="Register Number"
                name="reg_no"
                value={formData.reg_no}
                onChange={handleChange}
                placeholder="Enter register number"
                error={fieldErrors.reg_no}
              />
              <FormField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
                error={fieldErrors.name}
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
                label="Age at Death"
                name="age_at_death"
                type="number"
                value={formData.age_at_death}
                onChange={handleChange}
                placeholder="Enter age"
                error={fieldErrors.age_at_death}
              />
              <FormSelect
                label="Marital Status"
                name="marital_status"
                value={formData.marital_status}
                onChange={handleChange}
                options={[
                  { value: "SINGLE", label: "Single" },
                  { value: "MARRIED", label: "Married" },
                  { value: "WIDOWED", label: "Widowed" },
                  { value: "DIVORCED", label: "Divorced" },
                ]}
                error={fieldErrors.marital_status}
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
                label="Died On"
                name="died_on"
                type="date"
                value={formData.died_on}
                onChange={handleChange}
                error={fieldErrors.died_on}
              />
              <FormField
                label="Funeral On"
                name="funeral_on"
                type="date"
                value={formData.funeral_on}
                onChange={handleChange}
                error={fieldErrors.funeral_on}
              />
            </SimpleGrid>

            {/* ---------------- Death Circumstances ---------------- */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Death Circumstances
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="12px" mb="18px">
              <FormField
                label="Reason of Death"
                name="reason_of_death"
                value={formData.reason_of_death}
                onChange={handleChange}
                placeholder="Enter reason of death"
                error={fieldErrors.reason_of_death}
              />
              <FormField
                label="Place of Death"
                name="place_of_death"
                value={formData.place_of_death}
                onChange={handleChange}
                placeholder="Enter place of death"
                error={fieldErrors.place_of_death}
              />
              <FormField
                label="Priest Name"
                name="priest_name"
                value={formData.priest_name}
                onChange={handleChange}
                placeholder="Enter priest name"
                error={fieldErrors.priest_name}
              />
            </SimpleGrid>

            {/* ---------------- Tomb Details ---------------- */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Tomb Details
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="12px" mb="18px">
              <FormField
                label="Tomb Type"
                name="tomb_type_name"
                value={formData.tomb_type_name}
                onChange={handleChange}
                placeholder="Enter tomb type"
                error={fieldErrors.tomb_type_name}
              />
              <FormField
                label="Tomb IDN"
                name="tomb_idn"
                value={formData.tomb_idn}
                onChange={handleChange}
                placeholder="Enter tomb IDN"
                error={fieldErrors.tomb_idn}
              />
              <FormField
                label="Tomb Charge"
                name="tomb_charge"
                type="number"
                value={formData.tomb_charge}
                onChange={handleChange}
                placeholder="Enter tomb charge"
                error={fieldErrors.tomb_charge}
              />
            </SimpleGrid>

            {/* ---------------- Notes ---------------- */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Notes
            </Text>
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
              onClick={() => navigate(`/legacy/death/${id}`)}
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

export default LegacyDeathEditPage;