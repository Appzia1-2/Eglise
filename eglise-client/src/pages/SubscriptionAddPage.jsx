// src/pages/SubscriptionAddPage.jsx

import React, { useEffect, useState } from "react";

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
  createSubscription,
  listGrades,
  listAccountLedgers,
} from "../api/registryServices";

import { toaster } from "../components/ui/toaster";

const PRIMARY_MAROON = "var(--primary-maroon)";
const RED = "#D7193F";
const DARK = "#182338";
const MUTED = "#60708C";
const BORDER = "#DCE2EA";


// ============================================================
// BILLING CYCLE OPTIONS
// ============================================================

const BILLING_CYCLES = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];


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
  grade: "Grade",
  term: "Term",
  start_date: "Start Date",
  end_date: "End Date",
  amount: "Amount",
  billing_cycle: "Billing Cycle",
  ledger: "Ledger",
};


const SubscriptionAddPage = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [grades, setGrades] = useState([]);
  const [ledgers, setLedgers] = useState([]);

  const [formData, setFormData] = useState({
    grade: "",
    term: "",
    start_date: "",
    end_date: "",
    amount: "",
    billing_cycle: "MONTHLY",
    ledger: "",
  });

  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingLedgers, setLoadingLedgers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // ==========================================================
  // LOAD GRADES + LEDGERS
  // ==========================================================

  useEffect(() => {
    fetchGrades();
    fetchLedgers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGrades = async () => {
    try {
      setLoadingGrades(true);

      const response = await listGrades();
      const data = response?.data ?? response;

      if (Array.isArray(data)) {
        setGrades(data);
      } else if (Array.isArray(data?.results)) {
        setGrades(data.results);
      } else {
        setGrades([]);
      }
    } catch (err) {
      console.error("Error loading grades:", err);
      showToast({
        title: "Failed to load grades",
        description:
          err?.response?.data?.detail ||
          "Unable to load grades. Please try again.",
        type: "error",
        duration: 6000,
      });
    } finally {
      setLoadingGrades(false);
    }
  };

  const fetchLedgers = async () => {
    try {
      setLoadingLedgers(true);

      const response = await listAccountLedgers();
      const data = response?.data ?? response;

      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.results)) {
        list = data.results;
      }

      // Filter to subscription-related ledgers only
      const subscriptionLedgers = list.filter((l) => {
        const name = (l.ledger_name || "").toLowerCase();
        const group = (l.account_group_name || "").toLowerCase();
        return (
          name.includes("subscription") ||
          group.includes("subscription")
        );
      });

      // Fallback: if no subscription ledgers exist, show all income ledgers
      if (subscriptionLedgers.length === 0) {
        setLedgers(
          list.filter((l) => (l.ledger_nature || "").toUpperCase() === "INCOME")
        );
      } else {
        setLedgers(subscriptionLedgers);
      }
    } catch (err) {
      console.error("Error loading ledgers:", err);
      showToast({
        title: "Failed to load ledgers",
        description:
          err?.response?.data?.detail ||
          "Unable to load ledgers. Please try again.",
        type: "error",
        duration: 6000,
      });
    } finally {
      setLoadingLedgers(false);
    }
  };

  // ==========================================================
  // FORM CHANGE
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

    if (!formData.grade) {
      errors.grade = "Please select a grade.";
      missing.push(FIELD_LABELS.grade);
    }

    if (!formData.term.trim()) {
      errors.term = "Term is required.";
      missing.push(FIELD_LABELS.term);
    }

    if (!formData.start_date) {
      errors.start_date = "Start date is required.";
      missing.push(FIELD_LABELS.start_date);
    }

    if (!formData.end_date) {
      errors.end_date = "End date is required.";
      missing.push(FIELD_LABELS.end_date);
    }

    if (!formData.amount) {
      errors.amount = "Amount is required.";
      missing.push(FIELD_LABELS.amount);
    } else {
      const amount = Number(formData.amount);
      if (Number.isNaN(amount) || amount <= 0) {
        errors.amount = "Amount must be greater than zero.";
      }
    }

    if (!formData.billing_cycle) {
      errors.billing_cycle = "Billing cycle is required.";
      missing.push(FIELD_LABELS.billing_cycle);
    }

    if (!formData.ledger) {
      errors.ledger = "Ledger is required.";
      missing.push(FIELD_LABELS.ledger);
    }

    // Date cross-check
    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.start_date)
    ) {
      errors.end_date = "End date cannot be before start date.";
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
      setSaving(true);
      setFieldErrors({});

      const amount = Number(formData.amount);

      const payload = {
        grade: Number(formData.grade),
        term: formData.term.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        amount: amount,
        billing_cycle: formData.billing_cycle,
        ledger: Number(formData.ledger),
        is_cancelled: false,
      };

      await createSubscription(payload);

      showToast({
        title: "Subscription created",
        description:
          "The subscription record was created successfully.",
        type: "success",
        duration: 4000,
      });

      navigate("/subscriptions");
    } catch (err) {
      console.error("Error creating subscription:", err);

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
          title: "Could not create subscription",
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
          title: "Could not create subscription",
          description:
            "Unable to create subscription. Please try again.",
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
    navigate("/subscriptions");
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
  // SELECT STYLE
  // ==========================================================

  const selectStyle = (hasError, disabled) => ({
    width: "100%",
    height: "42px",
    fontSize: "13px",
    border: `1px solid ${hasError ? "#F3C4C4" : BORDER}`,
    borderRadius: "7px",
    padding: "0 14px",
    color: DARK,
    backgroundColor: disabled ? "#F7F9FB" : "white",
    outline: "none",
    cursor: disabled ? "not-allowed" : "pointer",
  });

  // ==========================================================
  // LABEL
  // ==========================================================

  const FieldLabel = ({ children, required = true }) => (
    <Text fontSize="12px" fontWeight="600" color={DARK} mb="8px">
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
    <Box minH="100vh" bg="#FFFFFF" display="flex" flexDirection="column">
      <Navbar />

      <Box flex="1" w="100%">
        <Box w="100%" px={{ base: 3, md: 5 }} py={{ base: 3, md: 5 }}>
          {/* BREADCRUMB */}
          <HStack gap={2} mb={3} color={MUTED} fontSize="12px">
            <Text>Activities</Text>
            <Text>/</Text>
            <Text>Subscriptions</Text>
            <Text>/</Text>
            <Text color={DARK}>Add Subscription</Text>
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
              <Text fontSize="11px" fontWeight="700" color={RED} mb={1}>
                SUBSCRIPTIONS
              </Text>
              <Heading
                color={DARK}
                fontSize={{ base: "24px", md: "28px" }}
                lineHeight="1.2"
                mb={1}
              >
                Add Subscription
              </Heading>
              <Text color={MUTED} fontSize="12px">
                Create a subscription record.
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
                Subscription Details
              </Text>
            </Box>

            <Flex align="center" mb={4}>
              <Text fontSize="13px" fontWeight="700" color={DARK}>
                Subscription Information
              </Text>
            </Flex>

            {/* GRADE + TERM */}
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={{ base: 4, md: 5 }}
              mb={4}
            >
              {/* GRADE */}
              <Box>
                <FieldLabel>Grade</FieldLabel>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  disabled={loadingGrades}
                  style={selectStyle(!!fieldErrors.grade, loadingGrades)}
                >
                  <option value="">
                    {loadingGrades ? "Loading grades..." : "Select grade"}
                  </option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </Box>

              {/* TERM */}
              <Box>
                <FieldLabel>Term</FieldLabel>
                <Input
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  placeholder="Enter term"
                  {...inputStyle}
                  borderColor={fieldErrors.term ? "#F3C4C4" : BORDER}
                />
              </Box>
            </Grid>

            {/* BILLING CYCLE + LEDGER */}
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={{ base: 4, md: 5 }}
              mb={4}
            >
              {/* BILLING CYCLE */}
              <Box>
                <FieldLabel>Billing Cycle</FieldLabel>
                <select
                  name="billing_cycle"
                  value={formData.billing_cycle}
                  onChange={handleChange}
                  style={selectStyle(!!fieldErrors.billing_cycle, false)}
                >
                  {BILLING_CYCLES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </Box>

              {/* LEDGER */}
              <Box>
                <FieldLabel>Ledger</FieldLabel>
                <select
                  name="ledger"
                  value={formData.ledger}
                  onChange={handleChange}
                  disabled={loadingLedgers}
                  style={selectStyle(!!fieldErrors.ledger, loadingLedgers)}
                >
                  <option value="">
                    {loadingLedgers ? "Loading ledgers..." : "Select ledger"}
                  </option>
                  {ledgers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.ledger_name}
                    </option>
                  ))}
                </select>
              </Box>
            </Grid>

            {/* START DATE + END DATE */}
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={{ base: 4, md: 5 }}
              mb={4}
            >
              <Box>
                <FieldLabel>Start Date</FieldLabel>
                <Input
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  {...inputStyle}
                  borderColor={fieldErrors.start_date ? "#F3C4C4" : BORDER}
                />
              </Box>

              <Box>
                <FieldLabel>End Date</FieldLabel>
                <Input
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  {...inputStyle}
                  borderColor={fieldErrors.end_date ? "#F3C4C4" : BORDER}
                />
              </Box>
            </Grid>

            {/* AMOUNT */}
            <Box mb={5} maxW={{ base: "100%", md: "50%" }}>
              <FieldLabel>Amount</FieldLabel>
              <Flex>
                <Box
                  width="42px"
                  height="42px"
                  border="1px solid"
                  borderColor={BORDER}
                  borderRadius="7px 0 0 7px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="#F8FAFC"
                  fontSize="14px"
                  fontWeight="600"
                  color={MUTED}
                  flexShrink={0}
                >
                  ₹
                </Box>
                <Input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  h="42px"
                  fontSize="13px"
                  borderColor={fieldErrors.amount ? "#F3C4C4" : BORDER}
                  borderRadius="0 7px 7px 0"
                  borderLeft="none"
                  color={DARK}
                  bg="white"
                  _placeholder={{ color: "#98A2B3" }}
                  _hover={{ borderColor: "#BFC7D4" }}
                  _focus={{
                    borderColor: PRIMARY_MAROON,
                    boxShadow: `0 0 0 1px ${PRIMARY_MAROON}`,
                  }}
                />
              </Flex>
            </Box>

            {/* DIVIDER */}
            <Box borderTop="1px solid" borderColor="#E6EAF0" mb={4} />

            {/* BUTTONS */}
            <Flex justify="flex-end" align="center" gap={3}>
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
                Save Subscription
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default SubscriptionAddPage;