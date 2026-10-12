import React, { useState } from "react";

import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { createWard } from "../api/registryServices";
import { toaster } from "../components/ui/toaster";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";


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
// FIELD LABELS
// ============================================================

const FIELD_LABELS = {
  ward_name: "Ward Name",
  ward_number: "Ward Number",
  place: "Place",
};


const WardAddPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ward_name: "",
    ward_number: "",
    place: "",
  });

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) =>
      prev[name] ? { ...prev, [name]: "" } : prev
    );
  };

  // ==========================================================
  // VALIDATE
  // ==========================================================

  const validate = () => {
    const errors = {};
    const missing = [];

    const wardName = formData.ward_name.trim();
    const wardNumberRaw = String(formData.ward_number).trim();
    const place = formData.place.trim();

    if (!wardName) {
      errors.ward_name = "Ward name is required.";
      missing.push(FIELD_LABELS.ward_name);
    }

    if (!wardNumberRaw) {
      errors.ward_number = "Ward number is required.";
      missing.push(FIELD_LABELS.ward_number);
    } else {
      const number = Number(wardNumberRaw);

      if (!Number.isInteger(number) || number <= 0) {
        errors.ward_number =
          "Ward number must be a positive whole number.";
      }
    }

    if (!place) {
      errors.place = "Place is required.";
      missing.push(FIELD_LABELS.place);
    }

    setFieldErrors(errors);
    return { errors, missing };
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async () => {
    const { errors, missing } = validate();

    if (Object.keys(errors).length > 0) {
      // Prefer explicit rule errors over missing-field list
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

    const wardName = formData.ward_name.trim();
    const number = Number(String(formData.ward_number).trim());
    const place = formData.place.trim();

    try {
      setSaving(true);
      setFieldErrors({});

      await createWard({
        ward_name: wardName,
        ward_number: number,
        place: place,
      });

      showToast({
        title: "Ward created",
        description: "The ward record was created successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/ward");
    } catch (err) {
      console.error("Error creating ward:", err);

      const responseData = err?.response?.data;

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
          responseData.detail || responseData.non_field_errors?.[0];

        const fieldMessages = Object.values(errors).filter(Boolean);
        const onlyOneFieldError =
          fieldMessages.length === 1 && !generalError;

        showToast({
          title: "Could not create ward",
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
          title: "Could not create ward",
          description: "Unable to create ward. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/ward");
  };

  // ==========================================================
  // INPUT STYLE
  // ==========================================================

  const inputStyle = {
    h: "42px",
    fontSize: "13px",
    borderColor: BORDER,
    borderRadius: "7px",
    color: DARK,
    bg: "white",

    _placeholder: {
      color: "#98A2B3",
    },

    _hover: {
      borderColor: "#BFC7D4",
    },

    _focus: {
      borderColor: PRIMARY_MAROON,
      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
    },
  };

  // ==========================================================
  // LABEL
  // ==========================================================

  const FieldLabel = ({
    children,
    required = true,
  }) => (
    <Text
      fontSize="12px"
      fontWeight="600"
      color={DARK}
      mb="8px"
    >
      {children}

      {required && (
        <Text as="span" color={RED} ml="2px">
          *
        </Text>
      )}
    </Text>
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      minH="100vh"
      bg="#FFFFFF"
      display="flex"
      flexDirection="column"
    >
      <Navbar />

      <Box flex="1" w="100%">
        <Box
          w="100%"
          px={{ base: 3, md: 5 }}
          py={{ base: 3, md: 5 }}
        >
          {/* BREADCRUMB */}
          <HStack
            gap={2}
            mb={3}
            color={MUTED}
            fontSize="12px"
          >
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Ward Master</Text>
            <Text>/</Text>
            <Text color={DARK}>Add Ward</Text>
          </HStack>

          {/* PAGE HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={4}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text
                fontSize="11px"
                fontWeight="700"
                color={RED}
                mb={1}
              >
                WARD MASTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "24px", md: "28px" }}
                lineHeight="1.2"
                mb={1}
              >
                Add Ward
              </Heading>

              <Text color={MUTED} fontSize="12px">
                Create a ward record.
              </Text>
            </Box>
          </Flex>

          {/* FORM CARD */}
          <Box
            border="1px solid"
            borderColor={BORDER}
            borderRadius="9px"
            bg="white"
            p={{ base: 4, md: 6 }}
            width="100%"
            boxShadow="0 1px 3px rgba(16, 24, 40, 0.04)"
          >
            {/* CARD HEADER */}
            <Box mb={5}>
              <Text
                fontSize="13px"
                fontWeight="700"
                color={RED}
                pb="10px"
                borderBottom="2px solid"
                borderColor={RED}
                display="inline-block"
              >
                Ward Details
              </Text>
            </Box>

            {/* WARD NAME + WARD NUMBER + PLACE */}
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }}
              gap={{ base: 4, md: 5 }}
              mb={4}
            >
              {/* WARD NAME */}
              <Box>
                <FieldLabel>Ward Name</FieldLabel>

                <Input
                  name="ward_name"
                  value={formData.ward_name}
                  onChange={handleChange}
                  placeholder="Enter ward name"
                  {...inputStyle}
                  borderColor={
                    fieldErrors.ward_name ? "#F3C4C4" : BORDER
                  }
                />
              </Box>

              {/* WARD NUMBER */}
              <Box>
                <FieldLabel>Ward Number</FieldLabel>

                <Input
                  name="ward_number"
                  type="number"
                  min="1"
                  value={formData.ward_number}
                  onChange={handleChange}
                  placeholder="Enter ward number"
                  {...inputStyle}
                  borderColor={
                    fieldErrors.ward_number ? "#F3C4C4" : BORDER
                  }
                />
              </Box>

              {/* PLACE */}
              <Box>
                <FieldLabel>Place</FieldLabel>

                <Input
                  name="place"
                  value={formData.place}
                  onChange={handleChange}
                  placeholder="Enter place"
                  {...inputStyle}
                  borderColor={
                    fieldErrors.place ? "#F3C4C4" : BORDER
                  }
                />
              </Box>
            </Grid>

            {/* DIVIDER */}
            <Box
              borderTop="1px solid"
              borderColor="#E6EAF0"
              mb={4}
            />

            {/* BUTTONS */}
            <Flex
              justify="flex-end"
              align="center"
              gap={3}
            >
              <Button
                variant="outline"
                borderColor={RED}
                color={RED}
                h="38px"
                px={6}
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                onClick={handleCancel}
                disabled={saving}
                _hover={{ bg: "#FFF5F7" }}
              >
                Cancel
              </Button>

              <Button
                h="38px"
                px={7}
                bg={PRIMARY_MAROON}
                color="white"
                borderRadius="7px"
                fontSize="12px"
                fontWeight="600"
                loading={saving}
                disabled={saving}
                onClick={handleSubmit}
                _hover={{ bg: "#650A18" }}
              >
                Save Ward
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default WardAddPage;