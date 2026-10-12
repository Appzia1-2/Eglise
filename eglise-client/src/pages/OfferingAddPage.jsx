// src/pages/OfferingAddPage.jsx

import React, { useState, useEffect } from "react";

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

import {
  createOffering,
  listEvents,
  listMembers,
} from "../api/registryServices";

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
  event: "Event",
  member: "Member",
  amount: "Amount",
  narration: "Narration",
};


const OfferingAddPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    event: "",
    member: "",
    amount: "",
    narration: "",
  });

  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  // ==========================================================
  // FETCH OPTIONS
  // ==========================================================

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchingOptions(true);

        const [eRes, mRes] = await Promise.all([
          listEvents(),
          listMembers(),
        ]);

        const eventsData = eRes?.data ?? eRes;
        const membersData = mRes?.data ?? mRes;

        const eventsList = Array.isArray(eventsData)
          ? eventsData
          : eventsData?.results || [];

        const membersList = Array.isArray(membersData)
          ? membersData
          : membersData?.results || [];

        setEvents(eventsList);
        setMembers(membersList);
      } catch (err) {
        console.error("Error fetching options:", err);

        showToast({
          title: "Failed to load data",
          description:
            err?.response?.data?.detail ||
            "Unable to load events or members. Please try again.",
          type: "error",
          duration: 6000,
        });
      } finally {
        setFetchingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // ==========================================================
  // HANDLE CHANGE
  // ==========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
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

    if (!form.event) {
      errors.event = "Please select an event.";
      missing.push(FIELD_LABELS.event);
    }

    if (!form.member) {
      errors.member = "Please select a member.";
      missing.push(FIELD_LABELS.member);
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      errors.amount =
        "Please enter a valid amount greater than zero.";
      if (form.amount === "") {
        missing.push(FIELD_LABELS.amount);
      }
    }

    setFieldErrors(errors);
    return { errors, missing };
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { errors, missing } = validate();

    if (Object.keys(errors).length > 0) {
      // Prefer explicit rule errors over missing-fields list
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

    try {
      setLoading(true);
      setFieldErrors({});

      await createOffering({
        event: parseInt(form.event),
        member: parseInt(form.member),
        amount: parseFloat(form.amount),
        narration: form.narration.trim(),
      });

      showToast({
        title: "Offering created",
        description: "The offering record was created successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/offerings", {
        replace: true,
      });
    } catch (err) {
      console.error("Create offering error:", err);

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
          title: "Could not create offering",
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
          title: "Could not create offering",
          description: "Unable to create offering. Please try again.",
          type: "error",
          duration: 7000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    navigate("/offerings");
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

  if (fetchingOptions) {
    return (
      <Box
        minH="100vh"
        bg="white"
        display="flex"
        flexDirection="column"
      >
        <Navbar />
        <Box flex="1" w="100%" px={4} py={4}>
          <Text color={MUTED} fontSize="12px">
            Loading options...
          </Text>
        </Box>
        <Footer />
      </Box>
    );
  }

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
            <Text>Offerings</Text>
            <Text>/</Text>
            <Text>Member Offerings</Text>
            <Text>/</Text>
            <Text color={DARK}>Add Offering</Text>
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
                OFFERING MASTER
              </Text>

              <Heading
                color={DARK}
                fontSize={{ base: "24px", md: "28px" }}
                lineHeight="1.2"
                mb={1}
              >
                Add Offering
              </Heading>

              <Text color={MUTED} fontSize="12px">
                Create a new member offering record.
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
                Offering Details
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              {/* EVENT + MEMBER */}
              <Grid
                templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                gap={{ base: 4, md: 5 }}
                mb={4}
              >
                {/* EVENT */}
                <Box>
                  <FieldLabel>Event</FieldLabel>

                  <select
                    name="event"
                    value={form.event}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "42px",
                      fontSize: "13px",
                      border: `1px solid ${
                        fieldErrors.event ? "#F3C4C4" : BORDER
                      }`,
                      borderRadius: "7px",
                      padding: "0 14px",
                      color: DARK,
                      backgroundColor: "white",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = PRIMARY_MAROON;
                      e.target.style.boxShadow = `0 0 0 1px ${PRIMARY_MAROON}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.event
                        ? "#F3C4C4"
                        : BORDER;
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="">Select event</option>
                    {events && events.length > 0 ? (
                      events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No events available</option>
                    )}
                  </select>
                </Box>

                {/* MEMBER */}
                <Box>
                  <FieldLabel>Member</FieldLabel>

                  <select
                    name="member"
                    value={form.member}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "42px",
                      fontSize: "13px",
                      border: `1px solid ${
                        fieldErrors.member ? "#F3C4C4" : BORDER
                      }`,
                      borderRadius: "7px",
                      padding: "0 14px",
                      color: DARK,
                      backgroundColor: "white",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = PRIMARY_MAROON;
                      e.target.style.boxShadow = `0 0 0 1px ${PRIMARY_MAROON}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.member
                        ? "#F3C4C4"
                        : BORDER;
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="">Select member</option>
                    {members && members.length > 0 ? (
                      members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No members available</option>
                    )}
                  </select>
                </Box>
              </Grid>

              {/* AMOUNT + NARRATION */}
              <Grid
                templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                gap={{ base: 4, md: 5 }}
                mb={4}
              >
                {/* AMOUNT */}
                <Box>
                  <FieldLabel>Amount</FieldLabel>

                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    {...inputStyle}
                    borderColor={
                      fieldErrors.amount ? "#F3C4C4" : BORDER
                    }
                  />
                </Box>

                {/* NARRATION */}
                <Box>
                  <FieldLabel required={false}>Narration</FieldLabel>

                  <Input
                    name="narration"
                    value={form.narration}
                    onChange={handleChange}
                    placeholder="Enter narration (optional)"
                    {...inputStyle}
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
                  type="button"
                  variant="outline"
                  borderColor={RED}
                  color={RED}
                  h="38px"
                  px={6}
                  borderRadius="7px"
                  fontSize="12px"
                  fontWeight="600"
                  onClick={handleCancel}
                  disabled={loading}
                  _hover={{ bg: "#FFF5F7" }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  h="38px"
                  px={7}
                  bg={PRIMARY_MAROON}
                  color="white"
                  borderRadius="7px"
                  fontSize="12px"
                  fontWeight="600"
                  isLoading={loading}
                  loadingText="Saving..."
                  disabled={loading}
                  _hover={{ bg: "#650A18" }}
                >
                  Save Offering
                </Button>
              </Flex>
            </form>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default OfferingAddPage;