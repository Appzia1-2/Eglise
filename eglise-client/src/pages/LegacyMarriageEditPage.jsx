// src/pages/LegacyMarriageEditPage.jsx
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

/* ---------------- Page ---------------- */

const LegacyMarriageEditPage = () => {
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
          `/api/registry/legacy/marriages/${id}/`
        );
        const r = res.data;
        setFormData({
          marriage_type: r.marriage_type || "ADD_BRIDE",
          date: r.date || "",
          register_number: r.register_number || "",
          groom_name: r.groom_name || "",
          groom_dob: r.groom_dob || "",
          groom_house_name: r.groom_house_name || "",
          groom_family_name: r.groom_family_name || "",
          groom_address: r.groom_address || "",
          groom_father: r.groom_father || "",
          groom_mother: r.groom_mother || "",
          nationality_of_groom: r.nationality_of_groom || "",
          bride_name: r.bride_name || "",
          bride_dob: r.bride_dob || "",
          bride_house_name: r.bride_house_name || "",
          bride_family_name: r.bride_family_name || "",
          bride_address: r.bride_address || "",
          bride_father: r.bride_father || "",
          bride_mother: r.bride_mother || "",
          nationality_of_bride: r.nationality_of_bride || "",
          witness_groom_side: r.witness_groom_side || "",
          witness_bride_side: r.witness_bride_side || "",
          minister_of_marriage: r.minister_of_marriage || "",
          other_priests: r.other_priests || "",
          transfer_to: r.transfer_to || "",
          remarks: r.remarks || "",
        });
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            "Unable to load legacy marriage record."
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
        groom_dob: formData.groom_dob || null,
        bride_dob: formData.bride_dob || null,
      };
      await apiClient.patch(
        `/api/registry/legacy/marriages/${id}/`,
        payload
      );
      navigate(`/legacy/marriage/${id}`);
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
        setError("Unable to update legacy marriage.");
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
            onClick={() => navigate("/legacy/marriage")}
          >
            Legacy Marriage Register
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
            Legacy Marriage Register
          </Text>
          <Heading
            fontSize={{ base: "22px", md: "25px" }}
            fontWeight="600"
            color="#14265B"
            lineHeight="1.15"
          >
            Edit Legacy Marriage
          </Heading>
          <Text fontSize="11px" color="#7081A3" mt="3px">
            Update historical marriage details.
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
            {/* ---------------- Marriage Details ---------------- */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Marriage Details
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="12px" mb="18px">
              <FormSelect
                label="Marriage Type"
                name="marriage_type"
                value={formData.marriage_type}
                onChange={handleChange}
                options={[
                  { value: "ADD_BRIDE", label: "Add Bride" },
                  { value: "ADD_GROOM", label: "Add Groom" },
                ]}
                error={fieldErrors.marriage_type}
              />
              <FormField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                error={fieldErrors.date}
              />
              <FormField
                label="Register Number"
                name="register_number"
                value={formData.register_number}
                onChange={handleChange}
                placeholder="Enter register number"
                error={fieldErrors.register_number}
              />
            </SimpleGrid>

            {/* ---------------- Groom Details ---------------- */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Groom Details
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="12px" mb="18px">
              <FormField
                label="Groom Name"
                name="groom_name"
                value={formData.groom_name}
                onChange={handleChange}
                placeholder="Enter groom name"
                error={fieldErrors.groom_name}
              />
              <FormField
                label="Groom Date of Birth"
                name="groom_dob"
                type="date"
                value={formData.groom_dob}
                onChange={handleChange}
                error={fieldErrors.groom_dob}
              />
              <FormField
                label="Groom House Name"
                name="groom_house_name"
                value={formData.groom_house_name}
                onChange={handleChange}
                placeholder="Enter groom house name"
                error={fieldErrors.groom_house_name}
              />

              <FormField
                label="Groom Family Name"
                name="groom_family_name"
                value={formData.groom_family_name}
                onChange={handleChange}
                placeholder="Enter groom family name"
                error={fieldErrors.groom_family_name}
              />
              <FormField
                label="Groom Address"
                name="groom_address"
                value={formData.groom_address}
                onChange={handleChange}
                placeholder="Enter groom address"
                error={fieldErrors.groom_address}
              />
              <FormField
                label="Groom Father"
                name="groom_father"
                value={formData.groom_father}
                onChange={handleChange}
                placeholder="Enter groom father's name"
                error={fieldErrors.groom_father}
              />

              <FormField
                label="Groom Mother"
                name="groom_mother"
                value={formData.groom_mother}
                onChange={handleChange}
                placeholder="Enter groom mother's name"
                error={fieldErrors.groom_mother}
              />
              <FormField
                label="Nationality of Groom"
                name="nationality_of_groom"
                value={formData.nationality_of_groom}
                onChange={handleChange}
                placeholder="Enter nationality"
                error={fieldErrors.nationality_of_groom}
              />
            </SimpleGrid>

            {/* ---------------- Bride Details ---------------- */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Bride Details
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="12px" mb="18px">
              <FormField
                label="Bride Name"
                name="bride_name"
                value={formData.bride_name}
                onChange={handleChange}
                placeholder="Enter bride name"
                error={fieldErrors.bride_name}
              />
              <FormField
                label="Bride Date of Birth"
                name="bride_dob"
                type="date"
                value={formData.bride_dob}
                onChange={handleChange}
                error={fieldErrors.bride_dob}
              />
              <FormField
                label="Bride House Name"
                name="bride_house_name"
                value={formData.bride_house_name}
                onChange={handleChange}
                placeholder="Enter bride house name"
                error={fieldErrors.bride_house_name}
              />

              <FormField
                label="Bride Family Name"
                name="bride_family_name"
                value={formData.bride_family_name}
                onChange={handleChange}
                placeholder="Enter bride family name"
                error={fieldErrors.bride_family_name}
              />
              <FormField
                label="Bride Address"
                name="bride_address"
                value={formData.bride_address}
                onChange={handleChange}
                placeholder="Enter bride address"
                error={fieldErrors.bride_address}
              />
              <FormField
                label="Bride Father"
                name="bride_father"
                value={formData.bride_father}
                onChange={handleChange}
                placeholder="Enter bride father's name"
                error={fieldErrors.bride_father}
              />

              <FormField
                label="Bride Mother"
                name="bride_mother"
                value={formData.bride_mother}
                onChange={handleChange}
                placeholder="Enter bride mother's name"
                error={fieldErrors.bride_mother}
              />
              <FormField
                label="Nationality of Bride"
                name="nationality_of_bride"
                value={formData.nationality_of_bride}
                onChange={handleChange}
                placeholder="Enter nationality"
                error={fieldErrors.nationality_of_bride}
              />
            </SimpleGrid>

            {/* ---------------- Witnesses & Minister ---------------- */}
            <Text
              fontSize="14px"
              fontWeight="600"
              color="#14265B"
              mb="10px"
            >
              Witnesses & Minister
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="12px" mb="18px">
              <FormField
                label="Witness (Groom Side)"
                name="witness_groom_side"
                value={formData.witness_groom_side}
                onChange={handleChange}
                placeholder="Enter witness name"
                error={fieldErrors.witness_groom_side}
              />
              <FormField
                label="Witness (Bride Side)"
                name="witness_bride_side"
                value={formData.witness_bride_side}
                onChange={handleChange}
                placeholder="Enter witness name"
                error={fieldErrors.witness_bride_side}
              />
              <FormField
                label="Minister of Marriage"
                name="minister_of_marriage"
                value={formData.minister_of_marriage}
                onChange={handleChange}
                placeholder="Enter minister name"
                error={fieldErrors.minister_of_marriage}
              />

              <FormField
                label="Other Priests"
                name="other_priests"
                value={formData.other_priests}
                onChange={handleChange}
                placeholder="Enter other priests"
                error={fieldErrors.other_priests}
              />
              <FormField
                label="Transfer To"
                name="transfer_to"
                value={formData.transfer_to}
                onChange={handleChange}
                placeholder="Enter transfer destination"
                error={fieldErrors.transfer_to}
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
              onClick={() => navigate(`/legacy/marriage/${id}`)}
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

export default LegacyMarriageEditPage;