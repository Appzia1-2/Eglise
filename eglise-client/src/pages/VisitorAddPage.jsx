// src/pages/VisitorAddPage.jsx

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
import {
  LuCalendarDays,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { createVisitor } from "../api/registryServices";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";

const VisitorAddPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    visitor_name: "",
    visitor_date: "",
    reason_to_visit: "",
    visitor_address: "",
    remarks: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const visitorName = form.visitor_name.trim();

    if (!visitorName) {
      setError("Visitor name is required.");
      return;
    }

    if (!form.visitor_date) {
      setError("Visit date is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createVisitor({
        visitor_name: visitorName,
        visitor_date: form.visitor_date,
        reason_to_visit: form.reason_to_visit.trim(),
        visitor_address: form.visitor_address.trim(),
        remarks: form.remarks.trim(),
      });

      navigate("/visitor");
    } catch (err) {
      console.error("Create visitor error:", err);

      const data = err?.response?.data;

      if (typeof data === "object" && data !== null) {
        const firstError = Object.values(data)?.[0];

        if (Array.isArray(firstError)) {
          setError(firstError[0]);
        } else if (typeof firstError === "string") {
          setError(firstError);
        } else {
          setError("Unable to create visitor record.");
        }
      } else {
        setError("Unable to create visitor record.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/visitor");
  };

  // ==========================================================
  // FIELD LABEL
  // ==========================================================

  const FieldLabel = ({ children, required = false }) => (
    <Text
      fontSize="11px"
      fontWeight="600"
      color={DARK}
      mb="4px"
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
  // SHARED INPUT PROPS
  // ==========================================================

  const inputProps = {
    h: "36px",
    fontSize: "12px",
    borderColor: BORDER,
    borderRadius: "6px",
    color: DARK,
    bg: "white",
    _placeholder: { color: "#98A2B3" },
    _hover: { borderColor: "#BFC7D4" },
    _focus: {
      borderColor: PRIMARY_MAROON,
      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
    },
  };

  const textareaProps = {
    fontSize: "12px",
    borderColor: BORDER,
    borderRadius: "6px",
    color: DARK,
    bg: "white",
    resize: "none",
    _placeholder: { color: "#98A2B3" },
    _hover: { borderColor: "#BFC7D4" },
    _focus: {
      borderColor: PRIMARY_MAROON,
      boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
    },
  };

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
          py={{ base: 2, md: 3 }}
        >
          {/* BREADCRUMB */}
          <HStack gap={2} mb={1} color={MUTED} fontSize="11px">
            <Text>Masters</Text>
            <Text>/</Text>
            <Text>Visitor Master</Text>
            <Text>/</Text>
            <Text color={DARK}>Add Visitor</Text>
          </HStack>

          {/* PAGE HEADER */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
            mb={2}
            direction={{ base: "column", md: "row" }}
          >
            <Box>
              <Text
                fontSize="10px"
                fontWeight="700"
                color={RED}
                mb={0}
              >
                VISITOR MASTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "20px", md: "22px" }}
                lineHeight="1.15"
                mb={0}
              >
                Add Visitor
              </Heading>

              <Text color={MUTED} fontSize="11px">
                Create a new visitor record.
              </Text>
            </Box>
          </Flex>

          {/* FORM CARD */}
          <Box
            as="form"
            onSubmit={handleSubmit}
            border="1px solid"
            borderColor={BORDER}
            borderRadius="9px"
            bg="white"
            p={{ base: 3, md: 4 }}
            width="100%"
            boxShadow="0 1px 3px rgba(16, 24, 40, 0.04)"
          >
            {/* CARD HEADER */}
            <Box mb={3}>
              <Text
                fontSize="12px"
                fontWeight="700"
                color={RED}
                pb="6px"
                borderBottom="2px solid"
                borderColor={RED}
                display="inline-block"
              >
                Visitor Details
              </Text>
            </Box>

            {/* ERROR */}
            {error && (
              <Box
                mb={3}
                px={3}
                py={2}
                border="1px solid #FED7D7"
                bg="#FFF5F5"
                borderRadius="6px"
              >
                <Text
                  color="#C53030"
                  fontSize="11px"
                  fontWeight="500"
                >
                  {error}
                </Text>
              </Box>
            )}

            {/* FIELDS */}
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
              }}
              gap={3}
              mb={3}
            >
              {/* ============================================
                  ROW 1: Visit Date | Visitor Name
              ============================================ */}

              {/* Visit Date */}
              <Box>
                <FieldLabel required>
                  Visit Date
                </FieldLabel>

                <Box position="relative">
                  <Input
                    name="visitor_date"
                    type="date"
                    value={form.visitor_date}
                    onChange={handleChange}
                    pr="36px"
                    {...inputProps}
                  />

                  <Box
                    position="absolute"
                    right="10px"
                    top="50%"
                    transform="translateY(-50%)"
                    color={MUTED}
                    pointerEvents="none"
                  >
                    <LuCalendarDays size={14} />
                  </Box>
                </Box>
              </Box>

              {/* Visitor Name */}
              <Box>
                <FieldLabel required>
                  Visitor Name
                </FieldLabel>

                <Input
                  name="visitor_name"
                  value={form.visitor_name}
                  onChange={handleChange}
                  placeholder="Enter visitor name"
                  {...inputProps}
                />
              </Box>

              {/* ============================================
                  ROW 2: Address (full width)
              ============================================ */}

              <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
                <FieldLabel>
                  Address
                </FieldLabel>

                <Textarea
                  name="visitor_address"
                  value={form.visitor_address}
                  onChange={handleChange}
                  placeholder="Enter visitor address"
                  rows={2}
                  {...textareaProps}
                />
              </Box>

              {/* ============================================
                  ROW 3: Reason to Visit (full width)
              ============================================ */}

              <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
                <FieldLabel>
                  Reason to Visit
                </FieldLabel>

                <Textarea
                  name="reason_to_visit"
                  value={form.reason_to_visit}
                  onChange={handleChange}
                  placeholder="Enter reason for visit"
                  rows={2}
                  {...textareaProps}
                />
              </Box>

              {/* ============================================
                  ROW 4: Remarks (full width)
              ============================================ */}

              <Box gridColumn={{ base: "auto", md: "1 / -1" }}>
                <FieldLabel>
                  Remarks
                </FieldLabel>

                <Textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Enter remarks"
                  rows={2}
                  {...textareaProps}
                />
              </Box>
            </Grid>

            {/* BUTTONS */}
            <Flex
              justify="flex-end"
              align="center"
              gap={3}
              borderTop="1px solid"
              borderColor="#E6EAF0"
              pt={3}
            >
              <Button
                type="button"
                variant="outline"
                borderColor={RED}
                color={RED}
                h="34px"
                px={5}
                borderRadius="6px"
                fontSize="12px"
                fontWeight="600"
                onClick={handleCancel}
                disabled={saving}
                _hover={{ bg: "#FFF5F7" }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                h="34px"
                px={6}
                bg={PRIMARY_MAROON}
                color="white"
                borderRadius="6px"
                fontSize="12px"
                fontWeight="600"
                loading={saving}
                loadingText="Saving..."
                disabled={saving}
                _hover={{ bg: "#650A18" }}
              >
                Save Visitor
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default VisitorAddPage;