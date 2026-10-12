import React, { useState } from "react";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { createGrade } from "../api/registryServices";
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


const GradeAdd = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFieldErrors({ name: "Grade name is required." });
      showToast({
        title: "Please fix the form",
        description: "Grade Name is required.",
        type: "warning",
        duration: 5000,
      });
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});

      await createGrade({
        name: trimmedName,
      });

      showToast({
        title: "Grade created",
        description: "The grade record was created successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/grade");
    } catch (err) {
      console.error("Error creating grade:", err);

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
          title: "Could not create grade",
          description:
            generalError ||
            (onlyOneFieldError
              ? fieldMessages[0]
              : "Unable to create grade. Please try again."),
          type: "error",
          duration: 7000,
        });
      } else {
        showToast({
          title: "Could not create grade",
          description: "Unable to create grade. Please try again.",
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
    navigate("/grade");
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

    _placeholder: { color: "#98A2B3" },

    _hover: { borderColor: "#BFC7D4" },

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
            <Text>Grade Master</Text>
            <Text>/</Text>
            <Text color={DARK}>Add Grade</Text>
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
                GRADE MASTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "24px", md: "28px" }}
                lineHeight="1.2"
                mb={1}
              >
                Add Grade
              </Heading>

              <Text color={MUTED} fontSize="12px">
                Create a grade record.
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
                Grade Details
              </Text>
            </Box>

            {/* FIELD — GRADE NAME */}
            <Box mb={5}>
              <FieldLabel>Grade Name</FieldLabel>

              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors((prev) =>
                    prev.name ? { ...prev, name: "" } : prev
                  );
                }}
                placeholder="Enter grade name"
                {...inputStyle}
                borderColor={
                  fieldErrors.name ? "#F3C4C4" : BORDER
                }
              />
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
                Save Grade
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default GradeAdd;