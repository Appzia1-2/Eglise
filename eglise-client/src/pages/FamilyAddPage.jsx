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
  Textarea,
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { createFamily } from "../api/registryServices";
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
// FIELD LABELS (for toast messages)
// ============================================================

const FIELD_LABELS = {
  family_name: "Family Name",
  origin: "Origin",
  history: "History",
};


const FamilyAddPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    family_name: "",
    origin: "",
    history: "",
  });

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear red border for this field once user edits it
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

    if (!formData.family_name.trim()) {
      errors.family_name = "Family name is required.";
      missing.push(FIELD_LABELS.family_name);
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
      showToast({
        title: "Please fix the form",
        description:
          missing.length === 1
            ? `${missing[0]} is required.`
            : `Please fill: ${missing.join(", ")}.`,
        type: "warning",
        duration: 5000,
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        family_name: formData.family_name.trim(),
        origin: formData.origin.trim(),
        history: formData.history.trim(),
      };

      await createFamily(payload);

      showToast({
        title: "Family created",
        description: "The family record was created successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/family");
    } catch (err) {
      console.error("Error creating family:", err);

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
          title: "Could not create family",
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
          title: "Could not create family",
          description: "Unable to create family. Please try again.",
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
    navigate("/family");
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
        <Text
          as="span"
          color={RED}
          ml="2px"
        >
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
            <Text>Family Master</Text>
            <Text>/</Text>
            <Text color={DARK}>Add Family</Text>
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
                FAMILY MASTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "24px", md: "28px" }}
                lineHeight="1.2"
                mb={1}
              >
                Add Family
              </Heading>

              <Text color={MUTED} fontSize="12px">
                Create a family record with origin and history
                information.
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
                Family Details
              </Text>
            </Box>

            {/* FAMILY NAME + ORIGIN */}
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={{ base: 4, md: 5 }}
              mb={4}
            >
              {/* FAMILY NAME */}
              <Box>
                <FieldLabel>Family Name</FieldLabel>

                <Input
                  name="family_name"
                  value={formData.family_name}
                  onChange={handleChange}
                  placeholder="Enter family name"
                  {...inputStyle}
                  borderColor={
                    fieldErrors.family_name ? "#F3C4C4" : BORDER
                  }
                />
              </Box>

              {/* ORIGIN */}
              <Box>
                <FieldLabel required={false}>Origin</FieldLabel>

                <Input
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="Enter place of origin"
                  {...inputStyle}
                  borderColor={
                    fieldErrors.origin ? "#F3C4C4" : BORDER
                  }
                />
              </Box>
            </Grid>

            {/* HISTORY */}
            <Box mb={5}>
              <FieldLabel required={false}>History</FieldLabel>

              <Textarea
                name="history"
                value={formData.history}
                onChange={handleChange}
                placeholder="Enter family history"
                minH="100px"
                maxH="100px"
                resize="none"
                fontSize="13px"
                borderColor={
                  fieldErrors.history ? "#F3C4C4" : BORDER
                }
                borderRadius="7px"
                color={DARK}
                bg="white"
                _placeholder={{ color: "#98A2B3" }}
                _hover={{ borderColor: "#BFC7D4" }}
                _focus={{
                  borderColor: PRIMARY_MAROON,
                  boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                }}
              />

              <Text fontSize="12px" color={MUTED} mt={2}>
                Add background, migration, heritage, or other
                relevant family details.
              </Text>
            </Box>

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
                Save Family
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default FamilyAddPage;